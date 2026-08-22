(function initAscendSkillSystem(global) {
  'use strict';

  const CORE_PREFIX = 'core::';
  const DEFAULT_AFFINITIES = ['planning', 'consistency', 'execution', 'learning'];

  const SKILLS = [
    {id:'consistency',name:'Consistency',icon:'◈',color:'#70f0b1',description:'Sustaining useful action across time.',keywords:['consistent','consistency','routine','habit','practice','repeat','استمرار','استمرارية','انتظام','عادة','روتين']},
    {id:'planning',name:'Planning',icon:'⌁',color:'#58e8ff',description:'Turning an outcome into clear priorities and workable steps.',keywords:['plan','planning','schedule','scope','roadmap','prepare','priority','priorities','time management','weekly plan','خطة','تخطيط','جدول','تحضير','أولوية','اولويه','أولويات','اولويات','إدارة الوقت','ادارة الوقت']},
    {id:'focus',name:'Focus',icon:'◎',color:'#9d83ff',description:'Directing attention without unnecessary switching.',keywords:['focus','deep work','concentrate','attention','study','تركيز','ركز','مذاكرة']},
    {id:'execution',name:'Execution',icon:'↗',color:'#77d9ff',description:'Moving work from intention to a finished result.',keywords:['execute','finish','deliver','build','implement','complete','ship','أنجز','تنفيذ','اكمل','إنهاء','بناء']},
    {id:'problem-solving',name:'Problem Solving',icon:'◇',color:'#61e0ee',description:'Finding practical paths through unclear or difficult problems.',keywords:['problem','solve','repair','fix','debug','troubleshoot','حل','مشكلة','إصلاح','اصلح','عطل']},
    {id:'critical-thinking',name:'Critical Thinking',icon:'⌕',color:'#8fc8ff',description:'Evaluating claims, tradeoffs, causes, and evidence.',keywords:['analyze','analysis','evaluate','compare','reason','evidence','risk','تحليل','حلل','قارن','دليل','تقييم','مخاطر']},
    {id:'learning',name:'Learning',icon:'⌬',color:'#b19cff',description:'Building understanding that can be recalled and applied.',keywords:['learn','study','read','review','knowledge','course','watch','تعلم','دراسة','اقرأ','راجع','معرفة','شاهد','تابع']},
    {id:'communication',name:'Communication',icon:'◫',color:'#8fdcff',description:'Expressing and receiving information clearly.',keywords:['communicate','explain','present','write','speak','listen','message','تواصل','شرح','عرض','كتابة','تحدث','استماع']},
    {id:'decision-making',name:'Decision Making',icon:'◆',color:'#f4c56b',description:'Choosing a sound action with the available information.',keywords:['decide','choose','option','tradeoff','priority','قرار','اختر','اختيار','مفاضلة','أولوية']},
    {id:'adaptability',name:'Adaptability',icon:'↻',color:'#73cfff',description:'Adjusting effectively when conditions or constraints change.',keywords:['adapt','adjust','change','unexpected','iterate','تكيّف','تكيف','تعديل','تغير','متغير']},
    {id:'resilience',name:'Resilience',icon:'▲',color:'#86e2b7',description:'Continuing through friction, setbacks, and demanding work.',keywords:['resilience','persist','difficult','pressure','setback','challenge','صمود','إصرار','ضغط','تحدي','صعب']},
    {id:'organization',name:'Organization',icon:'▦',color:'#9fd0df',description:'Creating order that reduces friction and lost information.',keywords:['organize','sort','clean','system','files','workspace','ترتيب','تنظيم','نظف','ملفات','مكتب']},
    {id:'creativity',name:'Creativity',icon:'✦',color:'#f6a8d7',description:'Generating and shaping useful original possibilities.',keywords:['create','creative','idea','design','draw','experiment','ابتكار','إبداع','فكرة','ارسم','تجربة']},
    {id:'leadership',name:'Leadership',icon:'↑',color:'#f0c474',description:'Creating direction and enabling others to perform.',keywords:['lead','delegate','team','mentor','coordinate','قيادة','فريق','تفويض','تنسيق','توجيه']},
    {id:'endurance',name:'Endurance',icon:'◒',color:'#70d8a4',description:'Sustaining physical or mental effort over time.',keywords:['endurance','conditioning','stamina','cardio','run','training','تحمل','لياقة','جري','تمرين']},
    {id:'self-management',name:'Self-Management',icon:'◌',color:'#f59cff',description:'Managing energy, impulses, recovery, and personal commitments.',keywords:['self management','discipline','recovery','sleep','stress','energy','انضباط','تعافي','نوم','توتر','طاقة','التزام']},
    {id:'quality-judgment',name:'Quality Judgment',icon:'✓',color:'#65e6c4',description:'Using standards, evidence, and verification to judge quality.',keywords:['quality','test','verify','review','precision','safety','standard','اختبار','تحقق','جودة','دقة','سلامة','معيار']},
    {id:'collaboration',name:'Collaboration',icon:'∞',color:'#88ddac',description:'Working reliably with others toward a shared result.',keywords:['collaborate','teamwork','stakeholder','support','community','تعاون','مشاركة','دعم','مجتمع']},
    {id:'systems-thinking',name:'Systems Thinking',icon:'⬡',color:'#62b8ff',description:'Understanding relationships, constraints, and downstream effects.',keywords:['system','architecture','integrate','dependency','process','نظام','تكامل','اعتماد','عملية','منظومة']},
    {id:'responsibility',name:'Responsibility',icon:'✧',color:'#d6c789',description:'Following through safely, ethically, and dependably.',keywords:['responsibility','reliable','ethics','safety','duty','accountable','مسؤولية','موثوق','أخلاق','سلامة','واجب']}
  ];

  const AREA_AFFINITIES = {
    'University':['learning','focus','planning','critical-thinking'],
    'Career':['communication','planning','execution','responsibility'],
    'Engineering':['problem-solving','critical-thinking','planning','systems-thinking','quality-judgment'],
    'Medicine & Healthcare':['learning','critical-thinking','communication','responsibility','quality-judgment'],
    'Programming & Technology':['problem-solving','systems-thinking','execution','quality-judgment'],
    'Business & Entrepreneurship':['planning','decision-making','communication','execution'],
    'Finance':['planning','critical-thinking','decision-making','responsibility'],
    'Fitness':['consistency','endurance','resilience','self-management'],
    'Sports':['endurance','focus','consistency','adaptability'],
    'Health & Wellness':['self-management','consistency','responsibility','resilience'],
    'Nutrition':['planning','consistency','self-management','learning'],
    'Personal':['self-management','decision-making','consistency','organization'],
    'Discipline & Habits':['consistency','self-management','resilience','execution'],
    'Productivity':['planning','focus','execution','organization'],
    'Mental Skills':['focus','critical-thinking','resilience','self-management'],
    'Reading & Knowledge':['learning','focus','critical-thinking'],
    'English':['learning','communication','consistency'],
    'Creativity':['creativity','adaptability','execution'],
    'Art & Design':['creativity','focus','quality-judgment','execution'],
    'Writing':['communication','critical-thinking','creativity','quality-judgment'],
    'Research':['critical-thinking','learning','planning','quality-judgment'],
    'Social Life':['communication','adaptability','responsibility'],
    'Family':['communication','responsibility','self-management'],
    'Relationships':['communication','responsibility','adaptability'],
    'Communication':['communication','critical-thinking','adaptability'],
    'Leadership':['leadership','communication','decision-making','responsibility','collaboration'],
    'Community & Volunteering':['collaboration','communication','responsibility','execution'],
    'Home':['organization','planning','responsibility','problem-solving'],
    'Organization':['organization','planning','consistency'],
    'Travel & Experiences':['planning','adaptability','organization','decision-making'],
    'Hobbies':['consistency','learning','creativity'],
    'Values & Spirituality':['responsibility','self-management','consistency'],
    'Personal Projects':['planning','execution','problem-solving','quality-judgment'],
    'Professional Projects':['planning','execution','collaboration','quality-judgment','responsibility']
  };

  const BY_ID = new Map(SKILLS.map(skill => [skill.id, skill]));
  const coreKey = id => `${CORE_PREFIX}${id}`;
  const idsForArea = area => [...(AREA_AFFINITIES[String(area || '').trim()] || DEFAULT_AFFINITIES)];
  const definitionsForArea = area => idsForArea(area).map(id => BY_ID.get(id)).filter(Boolean);

  function activeDefinitions(areas, skillState) {
    const selected = Array.isArray(areas) && areas.length ? areas : ['Personal'];
    const relevance = new Map();
    for (const area of selected) for (const id of idsForArea(area)) relevance.set(id, (relevance.get(id) || 0) + 1);
    for (const [key, value] of Object.entries(skillState || {})) {
      if (!key.startsWith(CORE_PREFIX) || Number(value) <= 0) continue;
      relevance.set(key.slice(CORE_PREFIX.length), Math.max(1, relevance.get(key.slice(CORE_PREFIX.length)) || 0));
    }
    return SKILLS.filter(skill => relevance.has(skill.id)).sort((a, b) => {
      const xpDelta = Number(skillState?.[coreKey(b.id)] || 0) - Number(skillState?.[coreKey(a.id)] || 0);
      if (xpDelta) return xpDelta;
      const relevanceDelta = Number(relevance.get(b.id) || 0) - Number(relevance.get(a.id) || 0);
      return relevanceDelta || SKILLS.indexOf(a) - SKILLS.indexOf(b);
    });
  }

  function legacySkillId(area, label) {
    const text = `${label || ''}`.toLowerCase();
    const rules = [
      ['communication',/communicat|listen|speaking|writing|presentation|audience|network|تواصل|استماع|تحدث|كتابة|عرض/],
      ['planning',/planning|strategy|scoping|requirements|budget|logistics|meal plan|career strategy|خطة|تخطيط|ميزانية|متطلبات/],
      ['quality-judgment',/quality|test|debug|verify|evaluation|evidence|safety|ethic|critique|methods|جودة|اختبار|تحقق|سلامة|أخلاق/],
      ['critical-thinking',/analysis|reasoning|risk|research question|source|synthesis|insight|تحليل|منطق|مخاطر|بحث/],
      ['problem-solving',/problem|repair|maintenance|troubleshoot|حل|إصلاح|صيانة/],
      ['systems-thinking',/system|workflow|integration|architecture|نظام|تكامل/],
      ['learning',/learning|knowledge|reading|recall|retention|note making|تعلم|معرفة|قراءة|تذكر/],
      ['consistency',/consistency|routine|practice|follow.through|reliability|انتظام|استمرار|روتين|التزام/],
      ['endurance',/strength|conditioning|mobility|technique|تحمل|قوة|لياقة/],
      ['resilience',/resilience|stress|adaptability|impulse|boundary|صمود|ضغط|تكيف/],
      ['leadership',/leadership|delegation|team development|ownership|قيادة|تفويض/],
      ['collaboration',/coordination|community|support|service|team|تنسيق|مجتمع|دعم/],
      ['creativity',/creative|ideation|visual|composition|art|experiment|إبداع|ابتكار|فكرة/],
      ['organization',/organization|administration|environment|household|تنظيم|ترتيب|إدارة/],
      ['decision-making',/decision|opportunity|customer|قرار|اختيار|فرصة/],
      ['self-management',/self.management|recovery|sleep|health|preventive|reflection|values|تعافي|نوم|صحة|تأمل/],
      ['execution',/execution|delivery|prototype|programming|craft|editing|تنفيذ|تسليم|برمجة/]
    ];
    return rules.find(([, pattern]) => pattern.test(text))?.[0] || idsForArea(area)[0] || 'execution';
  }

  function migrateSkillState(rawSkills) {
    const migrated = {};
    for (const [key, rawXp] of Object.entries(rawSkills || {})) {
      const xp = Math.max(0, Number(rawXp) || 0);
      if (!xp) continue;
      let id;
      if (key.startsWith(CORE_PREFIX)) id = key.slice(CORE_PREFIX.length);
      else {
        const split = key.indexOf('::');
        const area = split >= 0 ? key.slice(0, split) : '';
        const label = split >= 0 ? key.slice(split + 2) : key;
        id = legacySkillId(area, label);
      }
      if (!BY_ID.has(id)) id = 'execution';
      migrated[coreKey(id)] = (migrated[coreKey(id)] || 0) + xp;
    }
    return migrated;
  }

  // v2 is retained only so already-earned XP can be reversed with the exact
  // allocation rule that awarded it before v0.5.3.4.6.
  function legacyImpactForQuest(quest) {
    const primary = idsForArea(quest?.category);
    const secondary = quest?.secondaryCategory ? idsForArea(quest.secondaryCategory) : [];
    const candidates = [...new Set([...primary, ...secondary, ...DEFAULT_AFFINITIES])].map(id => BY_ID.get(id)).filter(Boolean);
    const text = `${quest?.title || ''} ${quest?.rationale || ''} ${quest?.intelligenceRationale || ''} ${(quest?.skillTags || []).join(' ')} ${(quest?.suggestedEvidence || []).join(' ')}`.toLowerCase();
    const type = String(quest?.questType || 'Side Quest');
    const scored = candidates.map((skill, index) => {
      let score = (primary.includes(skill.id) ? 4 : 0) + (secondary.includes(skill.id) ? 2 : 0);
      for (const keyword of skill.keywords) if (text.includes(keyword)) score += keyword.length > 6 ? 5 : 3;
      if (type === 'Daily Quest' && skill.id === 'consistency') score += 9;
      if (['Main Quest','Campaign Quest'].includes(type) && ['planning','execution'].includes(skill.id)) score += 5;
      if (type === 'Campaign Quest' && skill.id === 'consistency') score += 5;
      if (type === 'Boss Quest' && ['resilience','problem-solving','critical-thinking'].includes(skill.id)) score += 7;
      if (Number(quest?.estimatedMinutes || 0) >= 180 && ['focus','resilience'].includes(skill.id)) score += 3;
      if (quest?.dueDate && skill.id === 'planning') score += 2;
      return {skill, score, index};
    }).sort((a, b) => b.score - a.score || a.index - b.index);
    const chosen = scored.slice(0, 2);
    if (!chosen.length) return {[coreKey('execution')]:1};
    if (chosen.length === 1) return {[coreKey(chosen[0].skill.id)]:1};
    return {[coreKey(chosen[0].skill.id)]:.65, [coreKey(chosen[1].skill.id)]:.35};
  }

  function impactForQuest(quest) {
    const primary = idsForArea(quest?.category);
    const secondary = quest?.secondaryCategory ? idsForArea(quest.secondaryCategory) : [];
    const title = String(quest?.title || '').toLowerCase();
    const tags = (quest?.skillTags || []).join(' ').toLowerCase();
    const detail = `${quest?.rationale || ''} ${quest?.intelligenceRationale || ''} ${(quest?.suggestedEvidence || []).join(' ')}`.toLowerCase();
    const allText = `${title} ${tags} ${detail}`;
    const type = String(quest?.questType || 'Side Quest');
    const repeatSignal = /(daily|every day|each day|routine|habit|repeat|consisten|regularly|ongoing practice|يومي|يومياً|يوميا|كل يوم|روتين|عادة|كرر|تكرار|بانتظام|باستمرار|بشكل مستمر|استمرارية)/i.test(allText);

    const scored = SKILLS.map((skill, index) => {
      let score = (primary.includes(skill.id) ? 4 : 0) + (secondary.includes(skill.id) ? 2 : 0);
      for (const keyword of skill.keywords) {
        const needle = keyword.toLowerCase();
        if (title.includes(needle)) score += 8;
        if (tags.includes(needle)) score += 6;
        if (detail.includes(needle)) score += 3;
      }
      if (skill.id === 'consistency' && !repeatSignal && !['Daily Quest','Campaign Quest'].includes(type)) score = -10;
      if (type === 'Daily Quest' && skill.id === 'consistency') score += 14;
      if (['Main Quest','Campaign Quest'].includes(type) && ['planning','execution'].includes(skill.id)) score += 5;
      if (type === 'Campaign Quest' && skill.id === 'consistency') score += 7;
      if (type === 'Boss Quest' && ['resilience','problem-solving','critical-thinking'].includes(skill.id)) score += 7;
      if (Number(quest?.estimatedMinutes || 0) >= 180 && ['focus','resilience'].includes(skill.id)) score += 3;
      if (quest?.dueDate && skill.id === 'planning') score += 2;
      return {skill, score, index};
    }).sort((a, b) => b.score - a.score || a.index - b.index);

    const chosen = scored.filter(item => item.score > 0).slice(0, 2);
    if (!chosen.length) return {[coreKey(primary[0] || 'execution')]:1};
    if (chosen.length === 1) return {[coreKey(chosen[0].skill.id)]:1};
    return {[coreKey(chosen[0].skill.id)]:2/3, [coreKey(chosen[1].skill.id)]:1/3};
  }

  global.AscendSkillSystem = Object.freeze({
    version:3,
    CORE_PREFIX,
    skills:Object.freeze(SKILLS.map(skill => Object.freeze({...skill, keywords:Object.freeze([...skill.keywords])}))),
    affinities:Object.freeze(Object.fromEntries(Object.entries(AREA_AFFINITIES).map(([area, ids]) => [area, Object.freeze([...ids])]))),
    coreKey,
    definition:id => BY_ID.get(id) || null,
    idsForArea,
    definitionsForArea,
    activeDefinitions,
    migrateSkillState,
    legacyImpactForQuest,
    impactForQuest
  });
})(globalThis);
