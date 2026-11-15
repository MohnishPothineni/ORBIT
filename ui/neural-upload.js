/* Validates local model uploads. Reading a file never writes to the crew log. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const inputs=node?require('./input-logic.js'):InputLogic;
  const neural=node?require('./neural-adapter.js'):root.OrbitNeural;
  const model=node?require('./neural-model.js'):root.OrbitNeuralModel;
  const maxBytes=2*1024*1024;
  const supplemental=neural.supplemental;
  function baselineFrom(value){
    const candidate=value?.baseline||value?.neural?.baseline||value;
    return neural.validateBaseline(candidate,model);
  }
  function columns(){
    return [
      {header:'at',key:'at',text:true},
      ...Object.entries(inputs.fields).map(([key,rule])=>({header:key+' ['+rule.unit+']',key,unit:rule.unit})),
      {header:'glucoseContext',key:'glucoseContext',text:true},
      ...supplemental.map(key=>{const f=model.features.find(f=>f.key===key);return {header:key+' ['+f.unit+']',key,unit:f.unit,extra:true};}),
      {header:'notes',key:'notes',text:true}
    ];
  }
  function csvRows(text){
    const rows=[];let row=[],field='',quoted=false,closed=false;
    const finish=()=>{row.push(field);field='';closed=false;};
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
      if(c==='"'){if(field||closed)throw Error('CSV quotation is invalid. Use the downloaded template.');quoted=true;continue;}
      if(c===','){finish();continue;}
      if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;finish();if(row.some(v=>v.trim()!==''))rows.push(row);row=[];continue;}
      if(closed&&c!==' '&&c!=='\t')throw Error('Unexpected characters after a quoted CSV value.');
      if(!closed)field+=c;
    }
    if(quoted)throw Error('CSV contains an unfinished quoted value.');
    finish();if(row.some(v=>v.trim()!==''))rows.push(row);
    return rows;
  }
  function parseCSV(text,{workspace,synthetic,baseline,now=Date.now()}={}){
    if(typeof synthetic!=='boolean')throw Error('Choose whether the CSV contains measured or synthetic data.');
    const rows=csvRows(text.replace(/^\uFEFF/,''));
    if(rows.length<2)throw Error('CSV needs a header and at least one data row.');
    if(rows.length>501)throw Error('Upload no more than 500 measurement rows at once.');
    const headers=rows.shift().map(v=>v.trim()),specs=columns();
    if(new Set(headers).size!==headers.length)throw Error('CSV contains duplicate headers.');
    const selected=headers.map(h=>{const spec=specs.find(s=>s.header===h);if(!spec)throw Error('Unknown CSV header or unit: '+h+'. Use the template headers.');return spec;});
    if(!selected.some(s=>s.key==='at'))throw Error('CSV must include an at column with ISO timestamps and a timezone.');
    const extras=[];
    const entries=rows.map((row,i)=>{
      if(row.length!==headers.length)throw Error('CSV row '+(i+2)+' has a different number of columns.');
      const entry={},extra={};
      row.forEach((raw,j)=>{const spec=selected[j],value=raw.trim();if(value==='')return;
        if(spec.text){entry[spec.key]=value;return;}
        const n=Number(value);if(!Number.isFinite(n))throw Error('CSV row '+(i+2)+': '+spec.key+' must be a finite number.');
        if(spec.extra)extra[spec.key]=n;else entry[spec.key]=n;
      });
      extras.push(neural.validateExtras(extra,Object.fromEntries(specs.filter(s=>s.extra).map(s=>[s.key,s.unit])),model));
      return entry;
    });
    const records=inputs.validateDataset({format:'ORBIT_INDICATOR_DATASET',version:1,synthetic,units:Object.fromEntries(specs.filter(s=>s.unit&&!s.extra).map(s=>[s.key,s.unit])),entries},workspace,now);
    records.forEach((r,i)=>{if(Object.keys(extras[i]).length)r.neural=extras[i];});
    return {records,baseline:baseline?baselineFrom(baseline):null,synthetic,format:'CSV'};
  }
  function parse(text,{name='',workspace,synthetic,baseline,now=Date.now()}={}){
    if(typeof text!=='string'||new TextEncoder().encode(text).length>maxBytes)throw Error('Choose a JSON or CSV file no larger than 2 MB.');
    if(/\.csv$/i.test(name))return parseCSV(text,{workspace,synthetic,baseline,now});
    if(!/\.json$/i.test(name))throw Error('Choose a .json or .csv data file.');
    let data;try{data=JSON.parse(text);}catch{throw Error('The JSON file is not valid. Use the template structure.');}
    if(baseline&&data?.neural)data.neural.baseline=baselineFrom(baseline);
    const records=inputs.validateDataset(data,workspace,now),config=inputs.neuralConfig(data);
    return {records,baseline:baseline?baselineFrom(baseline):config?.baseline||null,synthetic:data.synthetic,format:'JSON'};
  }
  function csvTemplate(){return columns().map(s=>s.header).join(',')+'\n'+columns().map(s=>s.key==='glucoseContext'?'Fasting':'').join(',')+'\n';}
  function csvExample(data){
    const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
    return columns().map(s=>quote(s.header)).join(',')+'\n'+data.entries.map(r=>columns().map(s=>quote(s.extra?r.neural?.[s.key]:r[s.key])).join(',')).join('\n')+'\n';
  }
  function jsonTemplate(){
    return {format:'ORBIT_INDICATOR_DATASET',version:1,synthetic:false,units:Object.fromEntries(Object.entries(inputs.fields).map(([k,v])=>[k,v.unit])),
      neural:{model:model.name,baseline:Object.fromEntries(model.features.slice(0,16).map(f=>[f.key,null])),units:Object.fromEntries(model.features.filter(f=>supplemental.includes(f.key)).map(f=>[f.key,f.unit]))},
      entries:Array.from({length:7},()=>({at:'REPLACE_WITH_ISO_TIMESTAMP_AND_TIMEZONE',...Object.fromEntries(Object.keys(inputs.fields).map(k=>[k,null])),glucoseContext:'Fasting',neural:Object.fromEntries(supplemental.map(k=>[k,null]))}))};
  }
  function currentExample(data,now=Date.now()){
    if(data.synthetic!==true)throw Error('Only a fictional example can receive generated demo dates.');
    const copy=JSON.parse(JSON.stringify(data)),last=new Date(now);last.setUTCHours(7,0,0,0);if(last.getTime()>now)last.setUTCDate(last.getUTCDate()-1);
    copy.entries.forEach((r,i)=>r.at=new Date(last.getTime()-(copy.entries.length-1-i)*86400000).toISOString());return copy;
  }
  const api={maxBytes,baselineFrom,columns,csvRows,parse,parseCSV,csvTemplate,csvExample,jsonTemplate,currentExample};
  root.OrbitNeuralUpload=api;if(node)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
