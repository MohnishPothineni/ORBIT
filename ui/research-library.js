/* Team research, topics 1 to 5, checked against each published paper. Every entry states only what its source supports. */
'use strict';

const ResearchLibrary = (() => {
  const doi = id => `https://doi.org/${id}`;
  const SOURCES = {
    scully: { cite: 'Scully et al., 2019', title: 'Effects of acute exposures to carbon dioxide on decision making and cognition in astronaut-like subjects', journal: 'npj Microgravity', url: doi('10.1038/s41526-019-0071-6') },
    nasaCo2: { cite: 'NASA, 2023', title: 'Carbon dioxide technical brief', journal: 'NASA Office of the Chief Health and Medical Officer', url: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf' },
    miranda: { cite: 'Miranda et al., 2023', title: 'A Dusty Road for Astronauts', journal: 'Biomedicines', url: doi('10.3390/biomedicines11071921') },
    avila: { cite: 'Avila-Herrera et al., 2020', title: 'Crewmember microbiome may influence microbial composition of ISS habitable surfaces', journal: 'PLOS ONE', url: doi('10.1371/journal.pone.0231838') },
    pittia: { cite: 'Pittia et al., 2023', title: 'Unraveling the intricate connection between dietary factors and the success in long-term space missions', journal: 'npj Microgravity', url: doi('10.1038/s41526-023-00331-x') },
    jonesSleep: { cite: 'Jones et al., 2022', title: 'Sleep deficiency in spaceflight is associated with degraded neurobehavioral functions and elevated stress in astronauts on six-month missions aboard the International Space Station', journal: 'Sleep', url: doi('10.1093/sleep/zsac006') },
    yin: { cite: 'Yin et al., 2023', title: 'Long-term spaceflight composite stress induces depression and cognitive impairment in astronauts: insights from neuroplasticity', journal: 'Translational Psychiatry', url: doi('10.1038/s41398-023-02638-5') },
    chouker: { cite: 'Choukér & Stahn, 2020', title: 'COVID-19: the largest isolation study in history: the value of shared learnings from spaceflight analogs', journal: 'npj Microgravity', url: doi('10.1038/s41526-020-00122-8') },
    bell: { cite: 'Bell et al., 2019', title: 'What We Know About Team Dynamics for Long-Distance Space Missions: A Systematic Review of Analog Research', journal: 'Frontiers in Psychology', url: doi('10.3389/fpsyg.2019.00811') },
    cantisani: { cite: 'Cantisani et al., 2026', title: 'Social interactions in isolated, confined, and extreme environments: A study of Antarctic winter teams using wearable sensors', journal: 'PNAS', url: doi('10.1073/pnas.2533420123') },
    flynnEvans: { cite: 'Flynn-Evans et al., 2016', title: 'Circadian misalignment affects sleep and medication use before and during spaceflight', journal: 'npj Microgravity', url: doi('10.1038/npjmgrav.2015.19') },
    gatti: { cite: 'Gatti et al., 2022', title: 'Affective health and countermeasures in long-duration space exploration', journal: 'Heliyon', url: doi('10.1016/j.heliyon.2022.e09414') },
    pagnini: { cite: 'Pagnini, 2024', title: 'Supporting the Mind in Space: Psychological Tools for Long-Duration Missions', journal: 'Interactive Journal of Medical Research', url: doi('10.2196/66626') },
    smith: { cite: 'Smith, 2024', title: 'Automated Psychotherapy in a Spaceflight Environment: Advantages, Drawbacks, and Unknowns', journal: 'Interactive Journal of Medical Research', url: doi('10.2196/58803') },
    casario: { cite: 'Casario et al., 2022', title: 'Acceptability of the Cognition Test Battery in astronaut and astronaut-surrogate populations', journal: 'Acta Astronautica', url: doi('10.1016/j.actaastro.2021.09.035') },
    chancellor: { cite: 'Chancellor et al., 2014', title: 'Space Radiation: The Number One Risk to Astronaut Health beyond Low Earth Orbit', journal: 'Life', url: doi('10.3390/life4030491') },
    guo: { cite: 'Guo et al., 2022', title: 'Carcinogenesis induced by space radiation: A systematic review', journal: 'Neoplasia', url: doi('10.1016/j.neo.2022.100828') },
    kokhan: { cite: 'Kokhan & Dobynde, 2023', title: 'The Effects of Galactic Cosmic Rays on the Central Nervous System: From Negative to Unexpectedly Positive Effects That Astronauts May Encounter', journal: 'Biology', url: doi('10.3390/biology12030400') },
    kennedy: { cite: 'Kennedy, 2014', title: 'Acute effects of solar particle event radiation', journal: 'Journal of Radiation Research', url: doi('10.1093/jrr/rrt196') },
    rooney: { cite: 'Rooney et al., 2019', title: 'Herpes Virus Reactivation in Astronauts During Spaceflight and Its Application on Earth', journal: 'Frontiers in Microbiology', url: doi('10.3389/fmicb.2019.00016') },
    cytokine: { cite: 'Crucian et al., 2014', title: 'Plasma cytokine concentrations indicate that in vivo hormonal regulation of immunity is altered during long-duration spaceflight', journal: 'Journal of Interferon & Cytokine Research', url: doi('10.1089/jir.2013.0129') },
    crucian: { cite: 'Crucian et al., 2016', title: 'Incidence of clinical symptoms during long-duration orbital spaceflight', journal: 'International Journal of General Medicine', url: doi('10.2147/IJGM.S114188') },
    puhl: { cite: 'Puhl et al., 2022', title: 'Wound management and healing in space', journal: 'Frontiers in Bioengineering and Biotechnology', url: doi('10.3389/fbioe.2022.958515') },
    voorhies: { cite: 'Voorhies et al., 2019', title: 'Study of the impact of long-duration space missions at the International Space Station on the astronaut microbiome', journal: 'Scientific Reports', url: doi('10.1038/s41598-019-46303-8') },
    park: { cite: 'Park et al., 2024', title: 'Spatial multi-omics of human skin reveals KRAS and inflammatory responses to spaceflight', journal: 'Nature Communications', url: doi('10.1038/s41467-024-48625-2') },
    sugita: { cite: 'Sugita et al., 2016', title: 'Comprehensive analysis of the skin fungal microbiota of astronauts during a half-year stay at the International Space Station', journal: 'Medical Mycology', url: doi('10.1093/mmy/myv121') },
    man: { cite: 'Man et al., 2022', title: 'The effects of microgravity on bone structure and function', journal: 'npj Microgravity', url: doi('10.1038/s41526-022-00194-8') },
    ceniza: { cite: 'Ceniza-Bordallo et al., 2024', title: 'Low Back Pain During and After Spaceflight: A Systematic Review with Meta-Analysis', journal: 'Journal of Pain Research', url: doi('10.2147/jpr.s491060') },
    vernice: { cite: 'Vernice et al., 2020', title: 'Long-term spaceflight and the cardiovascular system', journal: 'Precision Clinical Medicine', url: doi('10.1093/pcmedi/pbaa022') },
    hoenemann: { cite: 'Hoenemann et al., 2023', title: 'Effects of daily artificial gravity training on orthostatic tolerance following 60-day strict head-down tilt bedrest', journal: 'Clinical Autonomic Research', url: doi('10.1007/s10286-023-00959-5') },
    clement: { cite: 'Clément et al., 2023', title: 'Cognitive and balance functions of astronauts after spaceflight are comparable to those of individuals with bilateral vestibulopathy', journal: 'Frontiers in Neurology', url: doi('10.3389/fneur.2023.1284029') },
    jonesExercise: { cite: 'Jones et al., 2019', title: 'Optimization of Exercise Countermeasures for Human Space Flight: Operational Considerations for Concurrent Strength and Aerobic Training', journal: 'Frontiers in Physiology', url: doi('10.3389/fphys.2019.00584') },
    scott: { cite: 'Scott et al., 2019', title: 'Introduction to the Frontiers Research Topic: Optimization of Exercise Countermeasures for Human Space Flight', journal: 'Frontiers in Physiology', url: doi('10.3389/fphys.2019.00173') },
    lee: { cite: 'Lee et al., 2020', title: 'Spaceflight associated neuro-ocular syndrome (SANS) and the neuro-ophthalmologic effects of microgravity: a review and an update', journal: 'npj Microgravity', url: doi('10.1038/s41526-020-0097-9') },
    perhonen: { cite: 'Perhonen et al., 2001', title: 'Cardiac atrophy after bed rest and spaceflight', journal: 'Journal of Applied Physiology', url: doi('10.1152/jappl.2001.91.2.645') },
    pietrzyk: { cite: 'Pietrzyk et al., 2007', title: 'Renal stone formation among astronauts', journal: 'Aviation, Space, and Environmental Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/17511294/' },
    crucianReview: { cite: 'Crucian et al., 2018', title: 'Immune System Dysregulation During Spaceflight: Potential Countermeasures for Deep Space Exploration Missions', journal: 'Frontiers in Immunology', url: doi('10.3389/fimmu.2018.01437') },
    opperman: { cite: 'Opperman et al., 2010', title: 'Probability of Spacesuit-Induced Fingernail Trauma Is Associated with Hand Circumference', journal: 'Aviation, Space, and Environmental Medicine', url: doi('10.3357/asem.2810.2010') },
    neutelings: { cite: 'Neutelings et al., 2015', title: 'Skin physiology in microgravity: a 3-month stay aboard ISS induces dermal atrophy and affects cutaneous muscle and hair follicles cycling in mice', journal: 'npj Microgravity', url: doi('10.1038/npjmgrav.2015.2') },
    wilson: { cite: 'Wilson et al., 2007', title: 'Space flight alters bacterial gene expression and virulence and reveals a role for global regulator Hfq', journal: 'PNAS', url: doi('10.1073/pnas.0707155104') },
    twins: { cite: 'Garrett-Bakelman et al., 2019', title: 'The NASA Twins Study: A multidimensional analysis of a year-long human spaceflight', journal: 'Science', url: doi('10.1126/science.aau8650') },
    urbaniak: { cite: 'Urbaniak et al., 2022', title: 'Microbial Tracking-2, a metagenomics analysis of bacteria and fungi onboard the International Space Station', journal: 'Microbiome', url: doi('10.1186/s40168-022-01293-0') },
    novikova: { cite: 'Novikova et al., 2006', title: 'Survey of environmental biocontamination on board the International Space Station', journal: 'Research in Microbiology', url: doi('10.1016/j.resmic.2005.07.010') },
    tomsia: { cite: 'Tomsia et al., 2024', title: 'Long-term space missions’ effects on the human organism: what we do know and what requires further research', journal: 'Frontiers in Physiology', url: doi('10.3389/fphys.2024.1284644') },
    nasaRadiation: { cite: 'NASA, 2022', title: 'Design for ionizing radiation protection technical brief', journal: 'NASA Office of the Chief Health and Medical Officer', url: 'https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf' },
    barcellos: { cite: 'Barcellos-Hoff et al., 2015', title: 'Concepts and challenges in cancer risk prediction for the space radiation environment', journal: 'Life Sciences in Space Research', url: doi('10.1016/j.lssr.2015.07.006') },
    cataract: { cite: 'Cucinotta et al., 2001', title: 'Space Radiation and Cataracts in Astronauts', journal: 'Radiation Research', url: doi('10.1667/0033-7587(2001)156[0460:SRACIA]2.0.CO;2') },
    fuglesang: { cite: 'Fuglesang et al., 2006', title: 'Phosphenes in low Earth orbit: survey responses from 59 astronauts', journal: 'Aviation, Space, and Environmental Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/16676658/' }
  };
  const EVIDENCE = { crew: 'Astronaut data', ground: 'Ground study', lab: 'Animal and cell studies', review: 'Research review', opinion: 'Expert commentary' };
  const TOPICS = {
    environment: { title: 'Cabin environment', owner: 'Sadiq', items: [
      { title: 'Carbon dioxide', evidence: 'ground', sources: ['scully', 'nasaCo2'], text: 'Twenty-two astronaut-like volunteers were exposed for a few hours to 600 to 5,000 ppm. There was no clear dose-response pattern in decision-making or cognition. Longer exposures still need study. NASA reports that 19 of 49 astronauts in one ISS analysis had headaches, and that carbon dioxide level was linked to them. Fluid shifts in microgravity can cause similar symptoms.', watch: 'Record headaches or slowed thinking, and check the vehicle’s cabin alerts.', track: ['care', 'Log symptoms'] },
      { title: 'Lunar dust', evidence: 'crew', sources: ['miranda'], text: 'Apollo astronauts reported allergy-like symptoms after tracking dust into the lunar module. One reported sneezing, red eyes, an itchy throat and congested sinuses. Researchers are also concerned about effects on the lungs, skin and eyes.', watch: 'Record breathing, eye or throat symptoms after surface work.', track: ['care', 'Log symptoms'] },
      { title: 'Microbes on cabin surfaces', evidence: 'crew', sources: ['avila'], text: 'A study of one crew member found that ISS surfaces resemble the crew’s skin microbes. The authors support continued microbial surveillance for long missions.', watch: 'Follow habitat hygiene procedures and report shared symptoms.', track: ['care', 'Log symptoms'] },
      { title: 'Air, water and surfaces', evidence: 'crew', sources: ['urbaniak', 'novikova'], text: 'ISS surface microbes are mostly human skin organisms, with Staphylococcus and Malassezia the most represented. A six-year survey found Staphylococcus dominant in air and surface samples. No viable pathogens were recovered from potable water.', watch: 'Follow cabin cleaning and water sampling procedures.', track: null },
      { title: 'Noise, vibration and light', evidence: 'review', sources: ['tomsia'], text: 'Astronauts often have disturbed body clocks and poor sleep. Reviewers recommend designing stations with less noise and vibration, and with lighting that supports the circadian rhythm.', watch: 'Record whether noise or lighting affected your sleep.', track: ['wellbeing', 'Sleep & wellbeing'] },
      { title: 'Food and nutrition', evidence: 'review', sources: ['pittia'], text: 'Too few calories have contributed to muscle loss and weakened immune and cardiovascular systems during missions. Prolonged storage can degrade nutrients. There is currently no reliable way to measure total energy use in real time, so diet and body mass need monitoring.', watch: 'Record appetite changes and intake against the meal plan.', track: ['routine', 'Daily routine'] }
    ] },
    behavior: { title: 'Mind and behavior', owner: 'Mohnish', items: [
      { title: 'Short sleep', evidence: 'crew', sources: ['jonesSleep', 'flynnEvans'], text: 'In 24 astronauts on six-month ISS missions, average sleep was about 6.5 hours. Sleeping under 6 hours was linked to slower responses, more stress and higher workload. Longer sleep helped. Sleep medication is also common in flight.', watch: 'Track sleep hours, stress and workload every day.', track: ['wellbeing', 'Sleep & wellbeing'] },
      { title: 'Depression and cognition', evidence: 'review', sources: ['yin'], text: 'The combined stress of long missions, including microgravity, isolation, noise and disrupted body clocks, could contribute to depression and cognitive impairment.', watch: 'Discuss lasting changes in mood, motivation or focus privately with the medical officer.', track: ['wellbeing', 'Sleep & wellbeing'] },
      { title: 'Isolation and confinement', evidence: 'review', sources: ['chouker', 'gatti'], text: 'Spaceflight analogs are used to study how prolonged isolation affects the brain, behavior and immune system. Stress, coping, adaptation and resilience can each be affected differently.', watch: 'Keep check-ins consistent so changes are easier to notice.', track: ['wellbeing', 'Sleep & wellbeing'] },
      { title: 'Team dynamics', evidence: 'review', sources: ['bell'], text: 'A review of 72 analog sources, such as Antarctic stations and space chambers, examined how crews work together. All teams reported at least one conflict by 90 days or 40% of the mission. Mood data did not consistently support a morale dip after the mission’s halfway point, known as the third-quarter phenomenon.', watch: 'Use the crew connection score in the daily check-in.', track: ['wellbeing', 'Sleep & wellbeing'] },
      { title: 'Loneliness', evidence: 'ground', sources: ['cantisani'], text: 'Twelve crew members at an Antarctic station were followed for 10 months with surveys and wearable proximity sensors. Loneliness and conflict rose while cohesion and performance fell. More close-range contact was linked to more conflict, so contact alone did not equal support.', watch: 'Discuss loneliness privately with the medical officer. Wearable sensors are not part of ORBIT.', track: ['wellbeing', 'Sleep & wellbeing'] },
      { title: 'Delayed contact with Earth', evidence: 'opinion', sources: ['pagnini', 'smith'], text: 'Communication delays, isolation and confinement can affect mental health. Automated support has been proposed for times when Earth cannot respond quickly, with benefits, drawbacks and unknowns still to be worked out.', watch: 'Plan what the crew will do while waiting for a reply.', track: ['earthlink', 'Earth link'] },
      { title: 'Cognitive testing', evidence: 'crew', sources: ['casario'], text: 'The Cognition battery of 10 brief tests was built for astronauts. Its acceptability was evaluated in 87 people on the ISS and in space analog settings on Earth.', watch: 'Repeated cognitive tests are not yet part of ORBIT.', track: null }
    ] },
    radiation: { title: 'Space radiation', owner: 'Manav', items: [
      { title: 'Cancer risk', evidence: 'lab', sources: ['guo', 'chancellor', 'barcellos'], text: 'Cell and animal experiments show that high-energy protons and heavy ions can cause cancer. There are no human data on extended exposure to these complex radiation fields, so the size of the risk to astronauts remains very uncertain.', watch: 'Track cumulative dose against the mission limit.', track: ['risks', 'Mission health risks'] },
      { title: 'Brain and nervous system', evidence: 'lab', sources: ['chancellor', 'kokhan'], text: 'Space radiation may affect the central nervous system, but the evidence is mixed. Rodent and primate experiments show negative, neutral and even positive effects on cognition at space-related doses.', watch: 'Record changes in memory, focus or mood.', track: ['wellbeing', 'Sleep & wellbeing'] },
      { title: 'Long-term tissue damage', evidence: 'review', sources: ['chancellor', 'vernice'], text: 'Degenerative tissue effects are one of the main radiation risks beyond low Earth orbit. Exposure to deep space radiation has been linked to artery degeneration, aortic stiffness and faster atherosclerosis.', watch: 'Track cumulative dose and keep long-term follow-up records.', track: ['risks', 'Mission health risks'] },
      { title: 'Acute radiation syndrome', evidence: 'lab', sources: ['kennedy', 'chancellor'], text: 'A major solar particle event could put astronauts at significant risk of acute radiation syndrome, which other spaceflight stressors may worsen. Shielding is an effective countermeasure against these events.', watch: 'Follow the vehicle’s radiation procedure. Report unexplained nausea or fatigue after a solar event.', track: ['risks', 'Mission health risks'] },
      { title: 'Cataracts', evidence: 'crew', sources: ['cataract'], text: 'Among 295 astronauts, those with higher lens doses (above 8 mSv) had more cataracts. The authors call the results preliminary because the scoring methods were subjective.', watch: 'Record vision changes and keep eye exam results for follow-up.', track: null },
      { title: 'Radiation limits', evidence: 'review', sources: ['nasaRadiation'], text: 'NASA limits career effective dose to under 600 mSv for all ages and sexes, and exposure to 250 mSv per solar particle event. NASA also requires space weather monitoring, radiation alerting and dose monitoring.', watch: 'Enter dosimeter readings. ORBIT cannot measure radiation.', track: ['risks', 'Mission health risks'] },
      { title: 'Secondary radiation', evidence: 'review', sources: ['chancellor'], text: 'Space radiation striking spacecraft shielding produces secondary particles, including neutrons. These can deliver a significant share of the total mission dose.', watch: 'Follow the vehicle’s shielding and shelter procedure.', track: null },
      { title: 'Light flashes', evidence: 'crew', sources: ['fuglesang'], text: 'Of 59 astronauts who answered a survey, 47 noticed flashes of light during spaceflight, most often before sleep. They are related to high-energy particles, and several people thought they disturbed their sleep.', watch: 'Note disturbed sleep in the daily check-in.', track: ['wellbeing', 'Sleep & wellbeing'] }
    ] },
    immune: { title: 'Immune system and skin', owner: 'Felix', items: [
      { title: 'Dormant virus reactivation', evidence: 'crew', sources: ['rooney', 'crucianReview'], text: 'Dormant herpes viruses reactivate during spaceflight: 53% of shuttle astronauts and 61% of ISS astronauts shed one or more. Shedding is typically symptom-free, though it has been linked to skin lesions in some cases.', watch: 'Viral testing needs laboratory equipment. Record cold sores and skin lesions.', track: ['skin', 'Skin & wounds'] },
      { title: 'Altered immune signaling', evidence: 'crew', sources: ['cytokine'], text: 'Blood levels of 22 cytokines were monitored in 28 astronauts on long ISS missions. Several rose during flight, suggesting that immune regulation changes in space.', watch: 'Immune blood tests are not yet part of ORBIT.', track: null },
      { title: 'Rashes and infections', evidence: 'crew', sources: ['crucian'], text: 'Medical records from 46 ISS crew members showed 3.40 immune-related events per flight year. Skin rashes were reported most often, followed by upper respiratory symptoms. Rashes or hypersensitivities made up 40% of notable events.', watch: 'Record temperature, new rashes and respiratory symptoms.', track: ['skin', 'Skin & wounds'] },
      { title: 'Wound healing', evidence: 'review', sources: ['puhl'], text: 'Research suggests that wound healing is slowed and impaired in microgravity. Radiation and other spaceflight stressors may add to this.', watch: 'Track size and warning signs until the wound heals.', track: ['skin', 'Skin & wounds'] },
      { title: 'Skin microbes', evidence: 'crew', sources: ['voorhies'], text: 'In nine astronauts on six to twelve month ISS missions, microbes on the skin, gut, nose and tongue changed. The skin changes might contribute to the high rate of rashes.', watch: 'Record skin irritation and how long it lasts.', track: ['skin', 'Skin & wounds'] },
      { title: 'Skin inflammation', evidence: 'crew', sources: ['park'], text: 'Skin biopsies from the four-person Inspiration4 crew showed raised inflammation-related gene activity after a three-day flight, along with DNA damage and barrier disruption.', watch: 'Record redness, dryness or irritation.', track: ['skin', 'Skin & wounds'] },
      { title: 'Skin fungi', evidence: 'crew', sources: ['sugita'], text: 'In 10 astronauts on half-year ISS stays, skin fungal diversity fell and the share of Malassezia rose. An uncommon yeast was abundant in flight samples from 5 of the 10. Higher colonization is not the same as an infection.', watch: 'Flag skin symptoms that persist.', track: ['skin', 'Skin & wounds'] },
      { title: 'Allergy and hypersensitivity', evidence: 'review', sources: ['crucianReview', 'crucian'], text: 'Some crew members have allergic symptoms and persistent skin hypersensitivity reactions during flight. Longer missions and deep space radiation may increase this clinical risk.', watch: 'Record rashes, itching or swelling and what you were exposed to.', track: ['skin', 'Skin & wounds'] },
      { title: 'Fingernail injuries', evidence: 'crew', sources: ['opperman'], text: 'Records from 232 crew members linked fingernail separation to hand size. Hand circumference had the strongest effect on the likelihood of injury from spacesuit gloves.', watch: 'Record nail pain, discoloration or separation after spacewalk work.', track: ['skin', 'Skin & wounds'] },
      { title: 'Skin thinning', evidence: 'lab', sources: ['neutelings'], text: 'Mice kept 91 days on the ISS had 15% thinner dermis than matched ground mice. This has not been shown in people.', watch: 'Record skin dryness or fragility.', track: ['skin', 'Skin & wounds'] },
      { title: 'Bacteria in flight', evidence: 'lab', sources: ['wilson'], text: 'Salmonella grown on a Space Shuttle mission changed gene expression and was more virulent in mice. This study did not involve infections in crew.', watch: 'Follow hygiene procedures and report signs of infection.', track: null },
      { title: 'Lasting gene changes', evidence: 'crew', sources: ['twins'], text: 'In the one-year NASA Twins Study, most gene expression returned to near preflight levels within six months, but some genes stayed disrupted. This is one astronaut, compared with their identical twin.', watch: 'Keep long-term follow-up records after the mission.', track: null }
    ] },
    gravity: { title: 'Altered gravity', owner: 'Avneet', items: [
      { title: 'Bone loss', evidence: 'crew', sources: ['man'], text: 'Microgravity causes 1 to 2% bone loss per month in astronauts, mainly in weight-bearing bones.', watch: 'Compare repeated scans from the same site.', track: ['risks', 'Mission health risks'] },
      { title: 'Back pain and muscle loss', evidence: 'review', sources: ['ceniza'], text: 'A systematic review of 11 studies found lower back muscle atrophy, reduced range of motion and disc changes. Reports of pain reached 77% during flight, 47% acute after flight and 33% chronic.', watch: 'Record back pain and changes in movement.', track: ['exercise', 'Exercise'] },
      { title: 'Exercise countermeasures', evidence: 'review', sources: ['jonesExercise', 'scott'], text: 'The ISS schedule allows 2.5 hours of exercise a day, and current recommendations combine strength and aerobic training. If that combination is planned poorly, strength gains can be held back, so timing matters.', watch: 'Log both aerobic and resistance sessions against the plan.', track: ['exercise', 'Exercise'] },
      { title: 'Heart and circulation', evidence: 'review', sources: ['vernice', 'hoenemann'], text: 'Fluid shifts toward the head reduce plasma volume by about 10 to 15%. Fainting or near-fainting on standing commonly follows spaceflight. The Hoenemann study is a 60-day bed rest study, not a spaceflight study.', watch: 'Track heart rate and blood pressure, and take care when returning to gravity.', track: ['log', 'Health log'] },
      { title: 'Balance after landing', evidence: 'crew', sources: ['clement'], text: 'On landing day, 28 astronauts performed walking and balance tests at a level comparable to people with bilateral vestibulopathy, a serious balance disorder.', watch: 'Plan for impaired balance after any return to gravity.', track: null },
      { title: 'Heart muscle', evidence: 'ground', sources: ['perhonen'], text: 'In a small study, left ventricle mass fell 8% after six weeks of bed rest. It fell 12% in four astronauts after a 10-day flight, though that change was not statistically significant.', watch: 'Keep up the exercise plan and record heart rate and blood pressure.', track: ['log', 'Health log'] },
      { title: 'Eye changes', evidence: 'crew', sources: ['lee'], text: 'Long microgravity exposure can cause spaceflight-associated neuro-ocular syndrome. Findings include optic disc swelling, globe flattening, retinal folds and shifts toward farsightedness.', watch: 'Report near-vision changes. Eye imaging is not part of ORBIT.', track: null },
      { title: 'Kidney stones', evidence: 'crew', sources: ['pietrzyk'], text: 'Analysis of 24-hour urine samples showed an increased risk of stone formation after landing. Risk factors can be assessed before flight and right after landing.', watch: 'Follow the fluid and diet plan. Report flank pain or urinary symptoms.', track: null }
    ] }
  };
  // BEGIN GENERATED HISTORICAL EVIDENCE
  EVIDENCE.historical = 'Historical mission data (supplied transcription)';
  SOURCES.historicalCsv = {"cite": "User-supplied historical metrics CSV", "title": "ALL_NUMERIC_METRICS_LONG.csv \u2014 PDF/page/table references retained in each entry", "journal": "Original PDFs not supplied; transcription unverified", "url": "./assets/ALL_NUMERIC_METRICS_LONG.csv"};
  TOPICS.historical = {
  "title": "Historical mission measurements",
  "items": [
    {
      "title": "NASA-VITAL-001: Mercury-Atlas 9 — Prelaunch",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 9; Subject: Gordon Cooper; Mission phase: Prelaunch; Record type: reported_phase_value. Measurements: heart rate: 72 bpm (heart_rate_bpm); systolic bp: 113 mmHg (systolic_bp_mmHg); diastolic bp: 79 mmHg (diastolic_bp_mmHg); respiratory rate: 19 breaths/min (respiratory_rate_breaths_min). Source reference: 19770026836.pdf, page 420, Table 40-III. Quality notes: No quality note supplied. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma9",
        "View in Gordon Cooper’s health log"
      ]
    },
    {
      "title": "NASA-VITAL-002: Mercury-Atlas 9 — Orbital",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 9; Subject: Gordon Cooper; Mission phase: Orbital; Record type: reported_phase_value. Measurements: heart rate: 89 bpm (heart_rate_bpm); systolic bp: 119 mmHg (systolic_bp_mmHg); diastolic bp: 81 mmHg (diastolic_bp_mmHg); respiratory rate: 15 breaths/min (respiratory_rate_breaths_min). Source reference: 19770026836.pdf, page 420, Table 40-III. Quality notes: No quality note supplied. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma9",
        "View in Gordon Cooper’s health log"
      ]
    },
    {
      "title": "NASA-VITAL-003: Mercury-Atlas 9 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 9; Subject: Gordon Cooper; Mission phase: Postflight; Posture: supine; Relative time: 1–7 hours after landing; Record type: reported_phase_value. Measurements: heart rate: 83 bpm (heart_rate_bpm); systolic bp: 89 mmHg (systolic_bp_mmHg); diastolic bp: 64 mmHg (diastolic_bp_mmHg). Source reference: 19770026836.pdf, page 420, Table 40-III. Quality notes: No quality note supplied. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma9",
        "View in Gordon Cooper’s health log"
      ]
    },
    {
      "title": "NASA-VITAL-004: Mercury-Atlas 9 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 9; Subject: Gordon Cooper; Mission phase: Postflight; Posture: erect; Relative time: 1–7 hours after landing; Record type: reported_phase_value. Measurements: heart rate: 123 bpm (heart_rate_bpm); systolic bp: 90 mmHg (systolic_bp_mmHg); diastolic bp: 73 mmHg (diastolic_bp_mmHg). Source reference: 19770026836.pdf, page 420, Table 40-III. Quality notes: No quality note supplied. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma9",
        "View in Gordon Cooper’s health log"
      ]
    },
    {
      "title": "NASA-VITAL-005: Mercury-Atlas 9 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 9; Subject: Gordon Cooper; Mission phase: Postflight; Posture: supine; Relative time: 18 hours after landing; Record type: reported_phase_value. Measurements: heart rate: 58 bpm (heart_rate_bpm); systolic bp: 98 mmHg (systolic_bp_mmHg); diastolic bp: 61 mmHg (diastolic_bp_mmHg). Source reference: 19770026836.pdf, page 420, Table 40-III. Quality notes: No quality note supplied. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma9",
        "View in Gordon Cooper’s health log"
      ]
    },
    {
      "title": "NASA-VITAL-006: Mercury-Atlas 9 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 9; Subject: Gordon Cooper; Mission phase: Postflight; Posture: erect; Relative time: 18 hours after landing; Record type: reported_phase_value. Measurements: heart rate: 80 bpm (heart_rate_bpm); systolic bp: 94 mmHg (systolic_bp_mmHg); diastolic bp: 68 mmHg (diastolic_bp_mmHg). Source reference: 19770026836.pdf, page 420, Table 40-III. Quality notes: No quality note supplied. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma9",
        "View in Gordon Cooper’s health log"
      ]
    },
    {
      "title": "NASA-VITAL-007: Mercury-Atlas 9 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 9; Subject: Gordon Cooper; Mission phase: Postflight; Record type: reported_temperature. Measurements: body temperature: 99.4 degF (body_temperature_f); body temperature: 37.44 degC (body_temperature_c). Source reference: 19770026836.pdf, page 420, Table 40-III. Quality notes: Oral temperature; table reports 310.6 K (99.4°F). Postflight timing unspecified. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma9",
        "View in Gordon Cooper’s health log"
      ]
    },
    {
      "title": "NASA-VITAL-008: Mercury-Atlas 7 — All preflight data",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 7; Subject: Scott Carpenter; Mission phase: All preflight data; Record type: aggregate_mean. Measurements: heart rate: 57 bpm (heart_rate_bpm); heart rate min: 42 bpm (heart_rate_min_bpm); heart rate max: 84 bpm (heart_rate_max_bpm); heart rate sample count: 408 count (heart_rate_sample_count); respiratory rate: 15 breaths/min (respiratory_rate_breaths_min); respiratory rate min: 5 breaths/min (respiratory_rate_min); respiratory rate max: 32 breaths/min (respiratory_rate_max); respiratory rate sample count: 354 count (respiratory_rate_sample_count); body temperature: 99.3 degF (body_temperature_f); body temperature: 37.39 degC (body_temperature_c); body temperature min: 98.3 degF (body_temp_min_f); body temperature max: 101.5 degF (body_temp_max_f); body temperature sample count: 128 count (body_temp_sample_count). Source reference: More nasa data 2.pdf, page 66, Table 5-XII. Quality notes: No quality note supplied. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma7",
        "View in Scott Carpenter’s health log"
      ]
    },
    {
      "title": "NASA-VITAL-009: Mercury-Atlas 7 — Countdown",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 7; Subject: Scott Carpenter; Mission phase: Countdown; Record type: aggregate_mean. Measurements: heart rate: 62 bpm (heart_rate_bpm); heart rate min: 50 bpm (heart_rate_min_bpm); heart rate max: 84 bpm (heart_rate_max_bpm); heart rate sample count: 92 count (heart_rate_sample_count); respiratory rate: 15 breaths/min (respiratory_rate_breaths_min); respiratory rate min: 6 breaths/min (respiratory_rate_min); respiratory rate max: 26 breaths/min (respiratory_rate_max); respiratory rate sample count: 75 count (respiratory_rate_sample_count); body temperature: 97.8 degF (body_temperature_f); body temperature: 36.56 degC (body_temperature_c); body temperature min: 96.8 degF (body_temp_min_f); body temperature max: 98.2 degF (body_temp_max_f); body temperature sample count: 57 count (body_temp_sample_count). Source reference: More nasa data 2.pdf, page 66, Table 5-XII. Quality notes: No quality note supplied. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma7",
        "View in Scott Carpenter’s health log"
      ]
    },
    {
      "title": "NASA-VITAL-010: Mercury-Atlas 7 — Launch",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 7; Subject: Scott Carpenter; Mission phase: Launch; Record type: aggregate_mean. Measurements: heart rate: 87 bpm (heart_rate_bpm); heart rate min: 82 bpm (heart_rate_min_bpm); heart rate max: 96 bpm (heart_rate_max_bpm); heart rate sample count: 7 count (heart_rate_sample_count); respiratory rate: 16 breaths/min (respiratory_rate_breaths_min); respiratory rate min: 10 breaths/min (respiratory_rate_min); respiratory rate max: 20 breaths/min (respiratory_rate_max); respiratory rate sample count: 5 count (respiratory_rate_sample_count); body temperature: 98 degF (body_temperature_f); body temperature: 36.67 degC (body_temperature_c); body temperature min: 98 degF (body_temp_min_f); body temperature max: 98 degF (body_temp_max_f); body temperature sample count: 4 count (body_temp_sample_count). Source reference: More nasa data 2.pdf, page 66, Table 5-XII. Quality notes: No quality note supplied. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma7",
        "View in Scott Carpenter’s health log"
      ]
    },
    {
      "title": "NASA-VITAL-011: Mercury-Atlas 7 — Orbital",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 7; Subject: Scott Carpenter; Mission phase: Orbital; Record type: aggregate_mean. Measurements: heart rate: 70 bpm (heart_rate_bpm); heart rate min: 60 bpm (heart_rate_min_bpm); heart rate max: 94 bpm (heart_rate_max_bpm); heart rate sample count: 94 count (heart_rate_sample_count); respiratory rate: 14 breaths/min (respiratory_rate_breaths_min); respiratory rate min: 10 breaths/min (respiratory_rate_min); respiratory rate max: 18 breaths/min (respiratory_rate_max); respiratory rate sample count: 83 count (respiratory_rate_sample_count); body temperature: 99.9 degF (body_temperature_f); body temperature: 37.72 degC (body_temperature_c); body temperature min: 98 degF (body_temp_min_f); body temperature max: 100.6 degF (body_temp_max_f); body temperature sample count: 60 count (body_temp_sample_count). Source reference: More nasa data 2.pdf, page 66, Table 5-XII. Quality notes: Respiratory-rate estimates derived from ECG R-wave variation; approximate only. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma7",
        "View in Scott Carpenter’s health log"
      ]
    },
    {
      "title": "NASA-VITAL-012: Mercury-Atlas 7 — Reentry",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 7; Subject: Scott Carpenter; Mission phase: Reentry; Record type: aggregate_mean. Measurements: heart rate: 84 bpm (heart_rate_bpm); heart rate min: 72 bpm (heart_rate_min_bpm); heart rate max: 104 bpm (heart_rate_max_bpm); heart rate sample count: 15 count (heart_rate_sample_count); respiratory rate: 19 breaths/min (respiratory_rate_breaths_min); respiratory rate min: 16 breaths/min (respiratory_rate_min); respiratory rate max: 24 breaths/min (respiratory_rate_max); respiratory rate sample count: 9 count (respiratory_rate_sample_count); body temperature: 100.4 degF (body_temperature_f); body temperature: 38.0 degC (body_temperature_c); body temperature min: 100.2 degF (body_temp_min_f); body temperature max: 100.5 degF (body_temp_max_f); body temperature sample count: 15 count (body_temp_sample_count). Source reference: More nasa data 2.pdf, page 66, Table 5-XII. Quality notes: Respiratory-rate estimates derived from ECG R-wave variation; approximate only. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma7",
        "View in Scott Carpenter’s health log"
      ]
    },
    {
      "title": "NASA-VITAL-013: Mercury-Atlas 7 — Preflight transfer van",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Mercury-Atlas 7; Subject: Scott Carpenter; Mission phase: Preflight transfer van; Relative time: ~50 minutes on launch day; Record type: aggregate_mean. Measurements: heart rate: 65 bpm (heart_rate_bpm); heart rate min: 56 bpm (heart_rate_min_bpm); heart rate max: 70 bpm (heart_rate_max_bpm); respiratory rate: 14 breaths/min (respiratory_rate_breaths_min); respiratory rate min: 8 breaths/min (respiratory_rate_min); respiratory rate max: 20 breaths/min (respiratory_rate_max). Source reference: More nasa data 2.pdf, page 64, Narrative. Quality notes: Narrative preflight transfer-van period; no blood pressure or body temperature recorded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": [
        "log?crew=hist-ma7",
        "View in Scott Carpenter’s health log"
      ]
    },
    {
      "title": "SKYLAB4-COMMANDER-REST-PREFLIGHT: Skylab 4 — Preflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Commander; Mission phase: Preflight; Exercise state: Rest; Record type: grouped_protocol_mean. Measurements: heart rate: 66 bpm (heart_rate_bpm); systolic bp: 96 mmHg (systolic_bp_mmHg); diastolic bp: 67 mmHg (diastolic_bp_mmHg); minute ventilation: 8.9 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.237 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.234 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-COMMANDER-REST-IN-FLIGHT: Skylab 4 — In-flight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Commander; Mission phase: In-flight; Exercise state: Rest; Record type: grouped_protocol_mean. Measurements: heart rate: 66 bpm (heart_rate_bpm); systolic bp: 97 mmHg (systolic_bp_mmHg); diastolic bp: 59 mmHg (diastolic_bp_mmHg); minute ventilation: 11.79 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.283 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.301 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-COMMANDER-REST-POSTFLIGHT: Skylab 4 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Commander; Mission phase: Postflight; Exercise state: Rest; Record type: grouped_protocol_mean. Measurements: heart rate: 76 bpm (heart_rate_bpm); systolic bp: 106 mmHg (systolic_bp_mmHg); diastolic bp: 72 mmHg (diastolic_bp_mmHg); minute ventilation: 9.27 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.203 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.187 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-COMMANDER-LEVEL3-PREFLIGHT: Skylab 4 — Preflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Commander; Mission phase: Preflight; Exercise state: Level 3; Record type: grouped_protocol_mean. Measurements: heart rate: 157 bpm (heart_rate_bpm); systolic bp: 192 mmHg (systolic_bp_mmHg); diastolic bp: 71 mmHg (diastolic_bp_mmHg); minute ventilation: 64.43 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 2.26 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 2.14 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-COMMANDER-LEVEL3-IN-FLIGHT: Skylab 4 — In-flight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Commander; Mission phase: In-flight; Exercise state: Level 3; Record type: grouped_protocol_mean. Measurements: heart rate: 152 bpm (heart_rate_bpm); systolic bp: 195 mmHg (systolic_bp_mmHg); diastolic bp: 56 mmHg (diastolic_bp_mmHg); minute ventilation: 62.04 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 2.2 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 2.13 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-COMMANDER-LEVEL3-POSTFLIGHT: Skylab 4 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Commander; Mission phase: Postflight; Exercise state: Level 3; Record type: grouped_protocol_mean. Measurements: heart rate: 163 bpm (heart_rate_bpm); systolic bp: 195 mmHg (systolic_bp_mmHg); diastolic bp: 67 mmHg (diastolic_bp_mmHg); minute ventilation: 60.04 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 2.14 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 2.05 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-COMMANDER-RECOVERY-PREFLIGHT: Skylab 4 — Preflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Commander; Mission phase: Preflight; Exercise state: Recovery; Record type: grouped_protocol_mean. Measurements: heart rate: 112 bpm (heart_rate_bpm); systolic bp: 149 mmHg (systolic_bp_mmHg); diastolic bp: 66 mmHg (diastolic_bp_mmHg); minute ventilation: 25.98 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.603 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.721 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-COMMANDER-RECOVERY-IN-FLIGHT: Skylab 4 — In-flight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Commander; Mission phase: In-flight; Exercise state: Recovery; Record type: grouped_protocol_mean. Measurements: heart rate: 87 bpm (heart_rate_bpm); systolic bp: 131 mmHg (systolic_bp_mmHg); diastolic bp: 61 mmHg (diastolic_bp_mmHg); minute ventilation: 24.65 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.632 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.776 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-COMMANDER-RECOVERY-POSTFLIGHT: Skylab 4 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Commander; Mission phase: Postflight; Exercise state: Recovery; Record type: grouped_protocol_mean. Measurements: heart rate: 109 bpm (heart_rate_bpm); systolic bp: 170 mmHg (systolic_bp_mmHg); diastolic bp: 78 mmHg (diastolic_bp_mmHg); minute ventilation: 29.18 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.717 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.839 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-SCIENTISTPILOT-REST-PREFLIGHT: Skylab 4 — Preflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Scientist Pilot; Mission phase: Preflight; Exercise state: Rest; Record type: grouped_protocol_mean. Measurements: heart rate: 64 bpm (heart_rate_bpm); systolic bp: 127 mmHg (systolic_bp_mmHg); diastolic bp: 84 mmHg (diastolic_bp_mmHg); minute ventilation: 7.51 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.269 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.255 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-SCIENTISTPILOT-REST-IN-FLIGHT: Skylab 4 — In-flight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Scientist Pilot; Mission phase: In-flight; Exercise state: Rest; Record type: grouped_protocol_mean. Measurements: heart rate: 62 bpm (heart_rate_bpm); systolic bp: 119 mmHg (systolic_bp_mmHg); diastolic bp: 74 mmHg (diastolic_bp_mmHg); minute ventilation: 9.98 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.289 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.279 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-SCIENTISTPILOT-REST-POSTFLIGHT: Skylab 4 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Scientist Pilot; Mission phase: Postflight; Exercise state: Rest; Record type: grouped_protocol_mean. Measurements: heart rate: 74 bpm (heart_rate_bpm); systolic bp: 123 mmHg (systolic_bp_mmHg); diastolic bp: 78 mmHg (diastolic_bp_mmHg); minute ventilation: 10.33 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.263 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.221 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-SCIENTISTPILOT-LEVEL3-PREFLIGHT: Skylab 4 — Preflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Scientist Pilot; Mission phase: Preflight; Exercise state: Level 3; Record type: grouped_protocol_mean. Measurements: heart rate: 164 bpm (heart_rate_bpm); systolic bp: 204 mmHg (systolic_bp_mmHg); diastolic bp: 55 mmHg (diastolic_bp_mmHg); minute ventilation: 84.18 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 3.07 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 2.88 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-SCIENTISTPILOT-LEVEL3-IN-FLIGHT: Skylab 4 — In-flight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Scientist Pilot; Mission phase: In-flight; Exercise state: Level 3; Record type: grouped_protocol_mean. Measurements: heart rate: 166 bpm (heart_rate_bpm); systolic bp: 200 mmHg (systolic_bp_mmHg); diastolic bp: 52 mmHg (diastolic_bp_mmHg); minute ventilation: 97.24 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 3.01 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 3.03 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-SCIENTISTPILOT-LEVEL3-POSTFLIGHT: Skylab 4 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Scientist Pilot; Mission phase: Postflight; Exercise state: Level 3; Record type: grouped_protocol_mean. Measurements: heart rate: 167 bpm (heart_rate_bpm); systolic bp: 198 mmHg (systolic_bp_mmHg); diastolic bp: 51 mmHg (diastolic_bp_mmHg); minute ventilation: 102.69 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 3.0 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 2.91 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-SCIENTISTPILOT-RECOVERY-PREFLIGHT: Skylab 4 — Preflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Scientist Pilot; Mission phase: Preflight; Exercise state: Recovery; Record type: grouped_protocol_mean. Measurements: heart rate: 104 bpm (heart_rate_bpm); systolic bp: 186 mmHg (systolic_bp_mmHg); diastolic bp: 66 mmHg (diastolic_bp_mmHg); minute ventilation: 24.6 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.676 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.791 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-SCIENTISTPILOT-RECOVERY-IN-FLIGHT: Skylab 4 — In-flight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Scientist Pilot; Mission phase: In-flight; Exercise state: Recovery; Record type: grouped_protocol_mean. Measurements: heart rate: 92 bpm (heart_rate_bpm); systolic bp: 174 mmHg (systolic_bp_mmHg); diastolic bp: 61 mmHg (diastolic_bp_mmHg); minute ventilation: 31.44 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.745 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.982 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-SCIENTISTPILOT-RECOVERY-POSTFLIGHT: Skylab 4 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Scientist Pilot; Mission phase: Postflight; Exercise state: Recovery; Record type: grouped_protocol_mean. Measurements: heart rate: 102 bpm (heart_rate_bpm); systolic bp: 189 mmHg (systolic_bp_mmHg); diastolic bp: 63 mmHg (diastolic_bp_mmHg); minute ventilation: 34.07 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.763 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.893 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-PILOT-REST-PREFLIGHT: Skylab 4 — Preflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Pilot; Mission phase: Preflight; Exercise state: Rest; Record type: grouped_protocol_mean. Measurements: heart rate: 54 bpm (heart_rate_bpm); systolic bp: 115 mmHg (systolic_bp_mmHg); diastolic bp: 72 mmHg (diastolic_bp_mmHg); minute ventilation: 6.69 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.238 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.216 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-PILOT-REST-IN-FLIGHT: Skylab 4 — In-flight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Pilot; Mission phase: In-flight; Exercise state: Rest; Record type: grouped_protocol_mean. Measurements: heart rate: 53 bpm (heart_rate_bpm); systolic bp: 115 mmHg (systolic_bp_mmHg); diastolic bp: 64 mmHg (diastolic_bp_mmHg); minute ventilation: 8.47 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.283 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.247 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-PILOT-REST-POSTFLIGHT: Skylab 4 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Pilot; Mission phase: Postflight; Exercise state: Rest; Record type: grouped_protocol_mean. Measurements: heart rate: 65 bpm (heart_rate_bpm); systolic bp: 125 mmHg (systolic_bp_mmHg); diastolic bp: 74 mmHg (diastolic_bp_mmHg); minute ventilation: 10.73 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.253 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 0.222 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-PILOT-LEVEL3-PREFLIGHT: Skylab 4 — Preflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Pilot; Mission phase: Preflight; Exercise state: Level 3; Record type: grouped_protocol_mean. Measurements: heart rate: 147 bpm (heart_rate_bpm); systolic bp: 204 mmHg (systolic_bp_mmHg); diastolic bp: 60 mmHg (diastolic_bp_mmHg); minute ventilation: 98.51 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 2.86 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 2.72 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-PILOT-LEVEL3-IN-FLIGHT: Skylab 4 — In-flight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Pilot; Mission phase: In-flight; Exercise state: Level 3; Record type: grouped_protocol_mean. Measurements: heart rate: 147 bpm (heart_rate_bpm); systolic bp: 200 mmHg (systolic_bp_mmHg); diastolic bp: 51 mmHg (diastolic_bp_mmHg); minute ventilation: 90.61 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 2.59 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 2.65 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-PILOT-LEVEL3-POSTFLIGHT: Skylab 4 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Pilot; Mission phase: Postflight; Exercise state: Level 3; Record type: grouped_protocol_mean. Measurements: heart rate: 156 bpm (heart_rate_bpm); systolic bp: 213 mmHg (systolic_bp_mmHg); diastolic bp: 59 mmHg (diastolic_bp_mmHg); minute ventilation: 95.12 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 2.63 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 2.68 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-PILOT-RECOVERY-PREFLIGHT: Skylab 4 — Preflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Pilot; Mission phase: Preflight; Exercise state: Recovery; Record type: grouped_protocol_mean. Measurements: heart rate: 114 bpm (heart_rate_bpm); systolic bp: 188 mmHg (systolic_bp_mmHg); diastolic bp: 65 mmHg (diastolic_bp_mmHg); minute ventilation: 40.97 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.849 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 1.22 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-PILOT-RECOVERY-IN-FLIGHT: Skylab 4 — In-flight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Pilot; Mission phase: In-flight; Exercise state: Recovery; Record type: grouped_protocol_mean. Measurements: heart rate: 91 bpm (heart_rate_bpm); systolic bp: 186 mmHg (systolic_bp_mmHg); diastolic bp: 60 mmHg (diastolic_bp_mmHg); minute ventilation: 34.77 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.754 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 1.08 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    },
    {
      "title": "SKYLAB4-PILOT-RECOVERY-POSTFLIGHT: Skylab 4 — Postflight",
      "evidence": "historical",
      "sources": [
        "historicalCsv"
      ],
      "text": "Mission: Skylab 4; Crew role: Pilot; Mission phase: Postflight; Exercise state: Recovery; Record type: grouped_protocol_mean. Measurements: heart rate: 118 bpm (heart_rate_bpm); systolic bp: 204 mmHg (systolic_bp_mmHg); diastolic bp: 69 mmHg (diastolic_bp_mmHg); minute ventilation: 45.02 L/min BTPS (minute_ventilation_l_min_BTPS); oxygen consumption: 0.849 L/min STPD (oxygen_consumption_l_min_STPD); co2 production: 1.08 L/min STPD (co2_production_l_min_STPD). Source reference: 19770026836.pdf, page 387, Table 36-III. Quality notes: Mean values by crew role, phase, and exercise state; not simultaneous continuous telemetry. Minute ventilation is NOT breaths/min. Superscript significance markers not encoded. Original PDFs were not supplied; these user-supplied transcriptions have not been independently verified.",
      "watch": "Historical observations for reference. Values are not clinical thresholds or current crew readings. Group means, ranges and sample counts retain their original meaning.",
      "track": null
    }
  ]
};
  // END GENERATED HISTORICAL EVIDENCE
  const allItems = () => Object.entries(TOPICS).flatMap(([topic, t]) => t.items.map(item => ({ ...item, topic, topicTitle: t.title })));
  function search(query, topic = 'all') {
    const terms = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    return allItems().filter(item => {
      if (topic !== 'all' && item.topic !== topic) return false;
      const words = [item.title, item.text, item.watch, item.topicTitle, ...item.sources.map(id => `${SOURCES[id].cite} ${SOURCES[id].title}`)].join(' ').toLowerCase();
      return terms.every(term => words.includes(term));
    });
  }
  return { SOURCES, EVIDENCE, TOPICS, allItems, search };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ResearchLibrary;
