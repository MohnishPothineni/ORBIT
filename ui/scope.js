'use strict';
/*
 * SCOPE: CLARA's photo check (Gemini only), as its own tab.
 * Take or upload a photo of a visible concern; SCOPE describes what it sees and what it
 * could be. The photo is downscaled and re-encoded as JPEG in the browser (which also strips
 * EXIF location data), sent to this site's server, and from there to Google Gemini.
 * Nothing is stored: the photo and result live only in this tab until you check another.
 */
const ScopePage = (() => {
  const MAX_EDGE = 1568; // larger images cost more and don't analyze better
  const URGENCY = {
    emergency: { label: 'Get care now', tone: 'alert' },
    see_doctor_soon: { label: 'See a clinician soon', tone: 'warn' },
    routine: { label: 'Mention at a routine visit', tone: 'ok' },
    self_care: { label: 'Likely fine to watch at home', tone: 'ok' },
  };
  const EXAMPLES = [
    { kind: 'rash', label: 'Itchy rash', note: 'Example image. Itchy red patch on my forearm for 3 days, started after gardening.' },
    { kind: 'mole', label: 'Changing mole', note: 'Example image. Mole on my back that my partner says looks darker and bigger than last year.' },
    { kind: 'scrape', label: 'Scraped knee', note: 'Example image. Fell off my bike 2 days ago, the scrape is sore and a bit warm.' },
  ];

  // State survives the site's re-renders; it is cleared when you check another photo.
  const s = { consent: false, cameraOn: false, photo: null, example: null, note: '', busy: false, error: null, result: null, version: 0 };
  let stream = null;

  // ─── Drawn example "photos" (CLARA's examplePhotos, unchanged) ────────────
  const W = 1024, H = 768;
  function rng(seed) {
    let v = seed >>> 0;
    return () => { v = (v + 0x6d2b79f5) >>> 0; let t = v; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function skin(ctx, rand, [r, g, b]) {
    const grad = ctx.createRadialGradient(W * 0.45, H * 0.35, 50, W * 0.5, H * 0.5, W * 0.75);
    grad.addColorStop(0, `rgb(${r + 18},${g + 14},${b + 12})`); grad.addColorStop(1, `rgb(${r - 30},${g - 32},${b - 30})`);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    const img = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < img.data.length; i += 4) { const n = (rand() - 0.5) * 14; img.data[i] += n; img.data[i + 1] += n * 0.9; img.data[i + 2] += n * 0.8; }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = `rgba(${r - 60},${g - 60},${b - 55},0.05)`; ctx.lineWidth = 1.5;
    for (let i = 0; i < 10; i++) { const y = rand() * H; ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(W * 0.3, y + (rand() - 0.5) * 60, W * 0.7, y + (rand() - 0.5) * 60, W, y + (rand() - 0.5) * 40); ctx.stroke(); }
    for (let i = 0; i < 2500; i++) { ctx.fillStyle = `rgba(${r - 70},${g - 70},${b - 60},${0.08 + rand() * 0.1})`; ctx.fillRect(rand() * W, rand() * H, 1.5, 1.5); }
  }
  function blob(ctx, x, y, rx, ry, color, rand, jitter = 0.25) {
    const waves = [2, 3, 4, 5].map(f => ({ f, amp: (jitter * (rand() + 0.3)) / f * 1.6, ph: rand() * Math.PI * 2 }));
    ctx.beginPath();
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2, k = 1 + waves.reduce((sum, w) => sum + w.amp * Math.sin(w.f * a + w.ph), 0);
      const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }
  function drawRash(ctx, rand) {
    skin(ctx, rand, [214, 170, 140]);
    ctx.filter = 'blur(18px)';
    for (let i = 0; i < 9; i++) blob(ctx, 470 + (rand() - 0.5) * 260, 380 + (rand() - 0.5) * 170, 120 + rand() * 60, 80 + rand() * 50, 'rgba(205,70,70,0.28)', rand, 0.3);
    ctx.filter = 'blur(3px)';
    for (let i = 0; i < 160; i++) {
      const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * 210, x = 480 + Math.cos(a) * d * 1.35, y = 380 + Math.sin(a) * d * 0.8, r = 4 + rand() * 7;
      ctx.fillStyle = `rgba(${170 + rand() * 40},${45 + rand() * 30},${50 + rand() * 25},0.75)`; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,230,220,0.35)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2); ctx.fill();
    }
    ctx.filter = 'blur(1px)'; ctx.strokeStyle = 'rgba(160,40,40,0.45)'; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) { const x = 380 + rand() * 220, y = 300 + rand() * 140; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + rand() * 50, y + 30 + rand() * 40); ctx.stroke(); }
    ctx.filter = 'none';
  }
  function drawMole(ctx, rand) {
    skin(ctx, rand, [222, 182, 152]);
    ctx.filter = 'blur(2px)';
    blob(ctx, 512, 384, 72, 58, 'rgb(120,78,52)', rand, 0.22); blob(ctx, 500, 378, 50, 40, 'rgb(78,48,32)', rand, 0.3);
    blob(ctx, 535, 400, 22, 18, 'rgb(45,28,22)', rand, 0.35); blob(ctx, 478, 356, 16, 12, 'rgba(150,95,80,0.8)', rand, 0.4);
    ctx.filter = 'blur(6px)'; blob(ctx, 512, 384, 88, 72, 'rgba(140,90,60,0.18)', rand, 0.25); ctx.filter = 'none';
    for (let i = 0; i < 6; i++) blob(ctx, 200 + rand() * 650, 150 + rand() * 480, 6 + rand() * 4, 5 + rand() * 4, 'rgba(150,100,70,0.6)', rand, 0.15);
  }
  function drawScrape(ctx, rand) {
    skin(ctx, rand, [205, 158, 125]);
    ctx.filter = 'blur(26px)'; blob(ctx, 512, 390, 300, 170, 'rgba(215,90,80,0.35)', rand, 0.2);
    ctx.filter = 'blur(4px)'; blob(ctx, 512, 390, 210, 105, 'rgb(176,58,52)', rand, 0.18);
    ctx.filter = 'blur(10px)'; blob(ctx, 500, 385, 150, 70, 'rgba(200,80,70,0.5)', rand, 0.2);
    ctx.filter = 'blur(2.5px)';
    for (let i = 0; i < 45; i++) { const y = 315 + rand() * 150, x = 340 + rand() * 110; ctx.strokeStyle = rand() > 0.5 ? 'rgba(125,30,30,0.35)' : 'rgba(235,150,130,0.3)'; ctx.lineWidth = 1 + rand() * 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 180 + rand() * 160, y + (rand() - 0.5) * 30); ctx.stroke(); }
    ctx.filter = 'blur(3px)';
    for (let i = 0; i < 26; i++) { const a = rand() * Math.PI * 2, d = 0.85 + rand() * 0.15; blob(ctx, 512 + Math.cos(a) * 200 * d, 390 + Math.sin(a) * 98 * d, 9 + rand() * 12, 6 + rand() * 7, `rgba(${170 + rand() * 30},${115 + rand() * 30},${55 + rand() * 20},0.55)`, rand, 0.2); }
    ctx.filter = 'none';
  }
  function drawExample(kind) {
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d'), rand = rng(kind === 'rash' ? 11 : kind === 'mole' ? 23 : 37);
    (kind === 'rash' ? drawRash : kind === 'mole' ? drawMole : drawScrape)(ctx, rand);
    const url = canvas.toDataURL('image/jpeg', 0.88);
    return { b64: url.slice(url.indexOf(',') + 1), url };
  }

  // ─── Photo handling ──────────────────────────────────────────────────────
  function toJpeg(source, width, height) {
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height)), canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL('image/jpeg', 0.85);
    return { b64: url.slice(url.indexOf(',') + 1), url };
  }
  async function pickFile(file) {
    if (!file) return;
    s.error = null;
    if (!file.type.startsWith('image/')) { s.error = 'Choose a photo (JPEG, PNG, HEIC or WebP).'; return paint(); }
    if (file.size > 20 * 1024 * 1024) { s.error = 'That photo is over 20 MB.'; return paint(); }
    const objectUrl = URL.createObjectURL(file);
    try { const img = new Image(); img.src = objectUrl; await img.decode(); setPhoto(toJpeg(img, img.naturalWidth, img.naturalHeight), null); }
    catch { s.error = "This browser can't open that photo. Try a JPEG or PNG, or use the camera."; paint(); }
    finally { URL.revokeObjectURL(objectUrl); }
  }
  function setPhoto(photo, example) { s.photo = photo; s.example = example; s.result = null; s.version++; s.busy = false; paint(); }

  function stopCamera() { stream?.getTracks().forEach(t => t.stop()); stream = null; s.cameraOn = false; }
  async function startCamera() {
    s.error = null;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { s.error = 'The camera needs HTTPS or localhost in a supported browser. You can upload a photo instead.'; return paint(); }
    try {
      const next = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      stopCamera(); stream = next; s.cameraOn = true; paint();
      const video = document.getElementById('scope-video');
      if (video) { video.srcObject = stream; void video.play(); }
    } catch (err) {
      s.error = err.name === 'NotAllowedError' ? "Camera access was blocked. Allow it in your browser's site settings, or upload a photo instead." : 'No camera was found. You can upload a photo instead.';
      paint();
    }
  }
  function capture() {
    const v = document.getElementById('scope-video');
    if (!v?.videoWidth) return;
    const photo = toJpeg(v, v.videoWidth, v.videoHeight);
    stopCamera(); setPhoto(photo, null);
  }

  async function analyze() {
    if (!s.photo || !s.consent || s.busy) return;
    if (typeof orbitOnline === 'function' && !orbitOnline()) {
      s.error = typeof offlineMode !== 'undefined' && offlineMode ? 'Offline mode is on, so nothing can leave this device. Switch to Online at the top of the page to use SCOPE.' : 'This device has no internet connection. SCOPE needs it to check a photo.';
      return paint();
    }
    const version = ++s.version;
    s.busy = true; s.error = null; paint();
    try {
      const res = await fetch('api/scope/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: s.photo.b64, note: s.note }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || (res.status === 404 || res.status === 405 || res.status === 502 ? 'SCOPE needs the ORBIT site server (npm run dev).' : 'Photo check failed. Please try again.'));
      if (version !== s.version) return;
      s.result = body;
    } catch (err) {
      if (version === s.version) s.error = err.message;
    } finally {
      if (version === s.version) { s.busy = false; paint(); }
    }
  }
  function reset() { stopCamera(); Object.assign(s, { photo: null, example: null, note: '', result: null, error: null, busy: false }); s.version++; paint(); }

  // ─── Markup ──────────────────────────────────────────────────────────────
  const list = (title, items, tone = '') => items.length ? `<div class="scope-block"><h3 class="${tone}">${esc(title)}</h3><ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';

  function resultMarkup() {
    const r = s.result, a = r.analysis, u = URGENCY[a.urgency] || URGENCY.see_doctor_soon;
    return `<div class="scope-result">
      ${r.provider === 'demo' ? `<p class="scope-demo">${icon('info')}<span>Demo mode: no Gemini API key is set on this server, so this is a sample result, not an analysis of your photo.</span></p>` : ''}
      <p class="scope-urgency ${u.tone}">${a.urgency === 'emergency' ? icon('alert') : ''}<span><strong>${esc(u.label)}</strong>${a.urgencyReason ? `<span>${esc(a.urgencyReason)}</span>` : ''}${a.urgency === 'emergency' ? '<span>Call <strong>911</strong> or go to the nearest emergency room.</span>' : ''}</span></p>
      ${r.message && r.provider !== 'demo' ? `<div class="scope-says"><p class="scope-says-label">SCOPE says</p><p>${esc(r.message)}</p></div>` : ''}
      <div class="scope-block"><h3>What SCOPE sees</h3><p>${esc(a.observations)}</p></div>
      ${a.possibilities.length ? `<div class="scope-block"><h3>What it could be consistent with</h3><ol class="scope-possible">${a.possibilities.map(p => `<li><p class="scope-possible-head"><strong>${esc(p.name)}</strong><span>${esc(p.likelihood)}</span></p><p>${esc(p.reasoning)}</p>${p.historyLink ? `<p class="scope-link">From what you said: ${esc(p.historyLink)}</p>` : ''}</li>`).join('')}</ol></div>` : ''}
      ${list('Get care right away if you notice', a.warningSigns, 'alert')}
      ${list('In the meantime', a.selfCare)}
      ${list('A clinician may ask', a.followUpQuestions)}
      <p class="scope-specialty">Suggested clinician: <strong>${esc(a.suggestedSpecialty)}</strong>.</p>
      <p class="scope-fine">SCOPE provides informational assistance only. Not a medical diagnosis. Consult a licensed physician. Photo analysis can be wrong, especially in poor light or on darker skin tones.</p>
      <div class="scope-actions"><button type="button" class="button" data-scope="reset">${icon('refresh')}Check another photo</button></div>
    </div>`;
  }

  function cardMarkup() {
    const off = s.consent ? '' : 'disabled';
    let step = '';
    if (!s.photo && !s.cameraOn) {
      step = `<div class="scope-actions">
          <button type="button" class="button primary" data-scope="camera" ${off}>${icon('eye')}Use camera</button>
          <label class="button scope-upload${s.consent ? '' : ' is-disabled'}" for="scope-file">${icon('plus')}Upload a photo</label>
          <input id="scope-file" class="sr-only" type="file" accept="image/*" ${off}>
        </div>
        <div class="scope-examples"><p>No photo handy? Try a drawn example:</p><div>${EXAMPLES.map(e => `<button type="button" class="button small" data-scope-example="${e.kind}" ${off}>${esc(e.label)}</button>`).join('')}</div></div>`;
    } else if (s.cameraOn) {
      step = `<div class="scope-camera"><video id="scope-video" playsinline muted aria-label="Camera preview"></video>
        <p>Use good light, hold the camera about 15–30 cm away, and keep the area in focus.</p>
        <div class="scope-actions"><button type="button" class="button primary" data-scope="capture">${icon('eye')}Take photo</button><button type="button" class="button" data-scope="stop-camera">${icon('close')}Cancel</button></div></div>`;
    } else {
      step = `<div class="scope-photo"><img src="${s.photo.url}" alt="${s.example ? `Drawn example: ${esc(s.example)}` : "The photo you're about to check"}">
        ${s.example ? `<p class="scope-fine">Drawn example (${esc(s.example.toLowerCase())}), not a real patient photo.</p>` : ''}
        ${s.result ? '' : `<label class="field full"><span>Anything to add? <small>(optional)</small></span><textarea class="field-input" id="scope-note" rows="2" maxlength="500" placeholder="For example: itchy, started 3 days ago, on my forearm">${esc(s.note)}</textarea></label>
        <div class="scope-actions"><button type="button" class="button primary" data-scope="analyze" ${s.busy || !s.consent ? 'disabled' : ''}>${s.busy ? '<span class="scope-spinner" aria-hidden="true"></span>Looking…' : `${icon('search')}Check this photo`}</button><button type="button" class="button" data-scope="reset" ${s.busy ? 'disabled' : ''}>${icon('refresh')}Retake</button></div>`}</div>`;
    }
    return `<h2 class="scope-title" id="scope-title">${icon('search')}Show SCOPE</h2>
      <p class="scope-lead">Take or upload a photo of a rash, mole, wound, swelling or other visible concern. SCOPE describes what it sees and what it could be.</p>
      <label class="scope-consent"><input type="checkbox" id="scope-consent" ${s.consent ? 'checked' : ''}><span>I agree to send this photo and my note to an AI service (Google Gemini) for analysis. The photo isn't saved. Location data is removed before sending. Don't include your face or intimate areas.</span></label>
      <p class="sr-only" role="status" aria-live="polite">${s.busy ? 'Analyzing your photo.' : s.result ? 'Photo check results are ready.' : ''}</p>
      ${s.error ? `<p class="scope-error" role="alert">${esc(s.error)}</p>` : ''}
      ${step}
      ${s.result ? resultMarkup() : ''}`;
  }

  function render() {
    return `${pageHeading('SCOPE', 'Photo check. Show SCOPE a visible concern and get a plain-language read of what it could be.')}
      <section class="panel scope-card" id="scope-card" aria-labelledby="scope-title">${cardMarkup()}</section>`;
  }

  function paint() {
    const card = document.getElementById('scope-card');
    if (!card) return;
    const focusId = document.activeElement?.closest?.('#scope-card') ? (document.activeElement.id || document.activeElement.dataset.scope || document.activeElement.dataset.scopeExample) : null;
    card.innerHTML = cardMarkup();
    hydrateIcons(card);
    if (s.cameraOn && stream) { const v = document.getElementById('scope-video'); if (v && v.srcObject !== stream) { v.srcObject = stream; void v.play(); } }
    if (focusId) (document.getElementById(focusId) || card.querySelector(`[data-scope="${focusId}"],[data-scope-example="${focusId}"]`) || card.querySelector('[data-scope="analyze"],[data-scope="reset"]'))?.focus({ preventScroll: true });
  }

  function attach() {
    const card = document.getElementById('scope-card');
    if (!card) return;
    if (s.cameraOn && stream) { const v = document.getElementById('scope-video'); if (v) { v.srcObject = stream; void v.play(); } }
    card.addEventListener('change', e => {
      if (e.target.id === 'scope-consent') { s.consent = e.target.checked; if (!s.consent) { s.result = null; s.version++; s.busy = false; } paint(); }
      else if (e.target.id === 'scope-file') pickFile(e.target.files?.[0]);
    });
    card.addEventListener('input', e => { if (e.target.id === 'scope-note') { s.note = e.target.value; } });
    card.addEventListener('click', e => {
      const ex = e.target.closest('[data-scope-example]');
      if (ex) { const item = EXAMPLES.find(x => x.kind === ex.dataset.scopeExample); s.error = null; s.note = item.note; setPhoto(drawExample(item.kind), item.label); return; }
      const action = e.target.closest('[data-scope]')?.dataset.scope;
      if (action === 'camera') startCamera();
      else if (action === 'capture') capture();
      else if (action === 'stop-camera') { stopCamera(); paint(); }
      else if (action === 'analyze') analyze();
      else if (action === 'reset') reset();
    });
  }

  /* Leaving the tab turns the camera off; the photo and result stay until you check another. */
  function dispose() { if (stream) stopCamera(); }

  /* Going back online clears the offline notice. */
  window.addEventListener('orbit:connectivity', () => { if (s.error && /offline|internet/i.test(s.error) && (typeof orbitOnline !== 'function' || orbitOnline())) { s.error = null; paint(); } });

  return { render, attach, dispose };
})();
