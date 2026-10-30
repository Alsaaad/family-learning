/* =========================================================
   🚀 مهمتي — مهمة اليوم لجهاد
   التطبيق يقسم الجلسة إلى خطوات، وجهاد يقرأ بصوت عالٍ،
   والمشرف (الأخت/الأخ) يضغط ✅ إذا قرأ صحيحًا أو 🔁 إذا احتاج إعادة.
   - أول 🔁: تظهر مساعدة (تقسيم المقاطع / عُدّ النقاط / صوت الآية)
   - ثاني 🔁: تُؤجَّل البطاقة لآخر الخطوة وتُسجَّل لتتكرر في مهمة الغد
   - «أنهى القصة» و«حفظ الآية» تُحسب تلقائيًا حسب معايير الدليل
   ---------------------------------------------------------
   ⚙️ الإعدادات (CONFIG) هي ما يغيّره عبدالله/Claude لتوجيه المهام
   ========================================================= */
(() => {
  const CONFIG = {
    level: null,           // null = حسب المرحلة الحالية تلقائيًا. أو رقم ثابت: 0 = المستوى ١، 1 = ٢، 2 = ٣
    pairsCount: 6,         // بطاقات الإحماء
    wordsCount: 4,         // كلمات طويلة من القصة
    quranMinutes: 8,       // حدّ وقت القرآن في الجلسة (بعده يظهر زر «نكمل غدًا»)
    maxInProgress: 2,      // آيات قيد الحفظ في نفس الوقت — لا نضيف جديدة فوقها
    storyPass: 0.8,        // نسبة الأسطر الصحيحة من أول مرة لاعتبار القصة منتهية
    troubleMax: 4,         // كلمات تعثّر فيها سابقًا تُعاد في المهمة
    breakSeconds: 60,
    pairsItems: ['عَ', 'غَ', 'ثَ', 'ذَ', 'عُ', 'غِ', 'ثُ', 'ذِ',
                 'عِنَبٌ', 'عَيْنٌ', 'غَيْمَةٌ', 'غَزَالٌ', 'ثَلْجٌ', 'ثُومٌ', 'ذَهَبٌ', 'ذُرَةٌ'],
    letterHints: {
      'ع': '«ع» بلا نقطة',
      'غ': '«غ» نقطة فوقه مثل الغيمة ☁️',
      'ث': '«ث» ثلاث نقاط، مثل أول حرف في كلمة «ثَلاث»',
      'ذ': '«ذ» دال عليها نقطة'
    }
  };
  const STEPS = {
    pairs:    { icon: '🔥', title: 'إحماء: حروف تتشابه', instr: 'عُدّ النقاط بإصبعك، ثم اقرأ بصوت عالٍ' },
    words:    { icon: '🔤', title: 'كلمات القصة',        instr: 'اقرأ الكلمة حتى آخر حرف — الجزء الأخضر في آخرها مهم!' },
    story:    { icon: '📖', title: 'القصة',              instr: 'اقرأ السطر وإصبعك تحت الكلمات حتى آخر حرف' },
    rest:     { icon: '🧃', title: 'استراحة',            instr: 'قم وتحرّك قليلًا واشرب ماء' },
    quran:    { icon: '🌙', title: 'القرآن',             instr: '' },
    question: { icon: '🎤', title: 'سؤال',               instr: 'أجب بصوتك' }
  };
  const KIND_INSTR = {
    listen: 'اسمع الآية وردّد بعد الشيخ',
    build: 'اسمع وردّد: كلمة، ثم كلمتين، ثم ثلاث…',
    look: 'اقرأ الآية وأنت تنظر إليها',
    recite: 'سمّع الآية من حفظك'
  };
  const KIND_TITLE = { listen: 'استمع وردّد', build: 'احفظها بالبناء', look: 'اقرأها وأنت تنظر', recite: 'سمّعها غيبًا' };

  const box = document.getElementById('mBox');
  if (!box) return;
  const today = () => new Date().toLocaleDateString('en-CA');
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  const firstBase = t => [...t].find(c => /[ء-ي]/.test(c)) || '';
  const clean = t => t.replace(/[.,،!؟?:؛]/g, '');
  const lineText = l => l.split(/\s+/).map(t => parseToken(t).text).join(' ');
  const syl = (t, on) => window.sylHTML ? sylHTML(t, on) : t;
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let M = null, hintOn = false, mS = 0, restTimer = null, qTimer = null;
  const qMins = () => M && M.qStart ? Math.floor((Date.now() - M.qStart) / 60000) : 0;
  const qBarHTML = mins => mins >= CONFIG.quranMinutes
    ? `<div class="m-timeup">⏰ مرّت ${ar(mins)} دقائق على القرآن. الحفظ يثبت بالتكرار على أيام، لا بجلسة طويلة.
        <div class="controls m-center"><button class="btn primary" id="mQStop">✋ كفاية اليوم — نكمل غدًا</button></div></div>`
    : `<p class="m-qclock">⏱️ وقت القرآن: ${ar(mins)} من ${ar(CONFIG.quranMinutes)} دقائق</p>`;
  function stopQuran() {
    let k = M.i;
    while (M.plan[k] && M.plan[k].step === 'quran') { M.plan[k].skipped = true; k++; }
    M.qStopped = true;
    M.i = k - 1;
    next();
  }

  /* ---------- بناء خطة اليوم ---------- */
  function pickStory() {
    const lvl = (CONFIG.level !== null && CONFIG.level !== undefined) ? CONFIG.level : (window.currentReadingLevel ? currentReadingLevel() : 0);
    const list = STORIES.filter(s => s.level === lvl);
    if (!list.length) return STORIES[0];
    return list.find(s => !state.stories[s.id]) || list[Math.floor(Math.random() * list.length)];
  }
  function longWords(st) {
    const seen = new Set(), out = [];
    st.lines.forEach(line => line.split(/\s+/).forEach(tok => {
      const w = clean(parseToken(tok).text);
      if (!w || seen.has(w)) return;
      seen.add(w);
      out.push({ w, n: window.syllables ? syllables(w).length : w.length });
    }));
    return out.filter(x => x.n >= 3).sort((a, b) => b.n - a.n).slice(0, CONFIG.wordsCount).map(x => x.w);
  }
  /* الآية الجديدة: استماع + بناء + قراءة نظرًا فقط. التسميع غيبًا يكون في الأيام التالية
     (الحفظ يثبت بعد النوم، والتسميع في نفس اليوم كان يأخذ أكثر من ٢٠ دقيقة) */
  function quranCards() {
    const t = today(), cards = [];
    state.qIntro = state.qIntro || {};
    if (state.qNew && state.qIntro[state.qNew.i] === undefined) state.qIntro[state.qNew.i] = state.qNew.date;
    const inProg = Object.keys(state.qIntro).map(Number)
      .filter(i => i < AYAT.length && !state.ayat[i] && state.qIntro[i] !== t).sort((a, b) => a - b);
    inProg.slice(0, CONFIG.maxInProgress).forEach(i =>
      cards.push({ step: 'quran', kind: 'recite', ayah: i, review: true, title: `سمّع الآية ${ar(i + 1)} من حفظك` }));
    const introduced = Object.keys(state.qIntro).map(Number);
    const introducedToday = Object.values(state.qIntro).includes(t);
    const n = AYAT.findIndex((_, i) => !state.ayat[i] && !introduced.includes(i));
    if (n >= 0 && !introducedToday && inProg.length < CONFIG.maxInProgress) {
      ['listen', 'build', 'look'].forEach(kind =>
        cards.push({ step: 'quran', kind, ayah: n, isNew: true, title: `الآية ${ar(n + 1)}: ${KIND_TITLE[kind]}` }));
    } else if (!cards.length && AYAT.length) {
      const r = Math.floor(Math.random() * AYAT.length);
      cards.push({ step: 'quran', kind: 'recite', ayah: r, review: true, title: `مراجعة الآية ${ar(r + 1)}` });
    }
    return cards;
  }
  function buildPlan() {
    const st = pickStory();
    const plan = [];
    const trouble = (state.trouble || []).filter(x => x.date !== today()).slice(-CONFIG.troubleMax);
    shuffle(CONFIG.pairsItems).slice(0, CONFIG.pairsCount).forEach(t => plan.push({ step: 'pairs', kind: 'read', text: t }));
    trouble.filter(x => x.kind === 'pairs').forEach(x => plan.push({ step: 'pairs', kind: 'read', text: x.t, old: true }));
    if (st) {
      longWords(st).forEach(t => plan.push({ step: 'words', kind: 'read', text: t }));
      trouble.filter(x => x.kind === 'words').forEach(x => plan.push({ step: 'words', kind: 'read', text: x.t, old: true }));
      st.lines.forEach((l, k) => plan.push({ step: 'story', kind: 'line', text: l, li: k }));
    }
    plan.push({ step: 'rest', kind: 'rest' });
    quranCards().forEach(c => plan.push(c));
    const qs = (st && st.questions) || [];
    if (qs.length) plan.push({ step: 'question', kind: 'answer', text: qs[Math.floor(Math.random() * qs.length)] });
    plan.forEach((c, k) => c.id = k);
    return { date: today(), plan, i: 0, res: {}, said: {}, nextId: plan.length, story: st ? st.id : null,
             started: null, ended: null, done: false, mood: null };
  }

  /* ---------- أدوات ---------- */
  const cur = () => M.plan[M.i];
  const instrOf = c => c.step === 'quran'
    ? (c.review && c.kind === 'recite' ? 'سمّع آية الأمس من حفظك' : KIND_INSTR[c.kind])
    : STEPS[c.step].instr;
  const supOkRetry = l => `<div class="m-sup"><span class="m-sup-lbl">👩‍🏫 للمشرف</span><div class="controls">
      <button class="btn ok" id="mOk">${l}</button><button class="btn" id="mRetry">🔁 نعيدها</button></div></div>`;
  const supNext = (l = 'كمّل ⬅') => `<div class="m-sup"><span class="m-sup-lbl">👩‍🏫 للمشرف</span><div class="controls">
      <button class="btn ok" id="mNext">${l}</button></div></div>`;
  function ayahHTML(i, mode) {
    const a = AYAT[i];
    return `<div class="m-emoji">${a.e}</div><p class="ayah m-ayah">${a.w.map((x, j) =>
      `<span class="aw ${(mode === 'first' && j > 0) ? 'hid' : ''}" data-j="${j}">${x}</span>`).join(' ')}
      <span class="anum">${ar(i + 1)}</span></p>${mode === 'show' && window.glossHTML ? glossHTML(a) : ''}`;
  }
  function addTrouble(c) {
    state.trouble = (state.trouble || []).filter(x => x.t !== c.text);
    state.trouble.push({ t: c.text, kind: c.step, date: today() });
    if (state.trouble.length > 12) state.trouble.shift();
  }
  const removeTrouble = t => {
    state.trouble = (state.trouble || []).filter(x => x.t !== t);
    state.troubleDone = state.troubleDone || {};
    state.troubleDone[t] = today();
  };
  function takeSaid(c) { const el = $('#mSaid'); if (el && el.value.trim()) M.said[c.id] = el.value.trim(); }

  /* ---------- الصوت ---------- */
  const hl = j => $$('#mBox .aw').forEach((el, k) => el.classList.toggle('on', k === j));
  function stopAudio() { mS++; if (window.stopAyah) stopAyah(); }
  const offline = () => toast('نحتاج اتصالاً بالإنترنت لسماع التلاوة 🌐');
  async function playWord(i, j) { stopAudio(); stopSpeech(); const s = mS; hl(j); await playUrl(wordUrl(i, j)); if (s === mS) hl(-1); }
  async function playAyahOnce(i) { stopAudio(); stopSpeech(); const s = mS; const ok = await playAyahAudio(i, qSession); if (s === mS && !ok) offline(); }
  async function playListen(i) {
    stopAudio(); stopSpeech(); const s = mS;
    for (let k = 1; k <= 3; k++) {
      const lbl = $('#mLbl'); if (lbl) lbl.textContent = `🔁 ${ar(k)} من ${ar(3)} — ردّد بعد الشيخ`;
      const ok = await playAyahAudio(i, qSession);
      if (s !== mS) return;
      if (!ok) { offline(); return; }
      await qSleep(1500); if (s !== mS) return;
    }
    const lbl = $('#mLbl'); if (lbl) lbl.textContent = '✅ أحسنت! اضغط «كمّل»';
  }
  async function playBuild(i) {
    stopAudio(); stopSpeech(); const s = mS; const n = AYAT[i].w.length;
    const say = t => { const lbl = $('#mLbl'); if (lbl) lbl.textContent = t; };
    for (const [from, end] of buildSteps(n)) {
      say(from === end ? `🧱 الكلمة ${ar(from + 1)}` : `🧱 من الكلمة ${ar(from + 1)} إلى ${ar(end + 1)}`);
      for (let j = from; j <= end; j++) {
        hl(j);
        const ok = await playUrl(wordUrl(i, j));
        if (s !== mS) return;
        if (!ok) { offline(); hl(-1); return; }
        await qSleep(120);
      }
      hl(-1); say('🗣️ دورك! ردّدها');
      await qSleep(1300 + 750 * (end - from + 1));
      if (s !== mS) return;
    }
    say('🌟 بنيتَ الآية! اضغط «كمّل»');
  }
  function startRest() {
    let t = CONFIG.breakSeconds;
    clearInterval(restTimer);
    restTimer = setInterval(() => {
      t--;
      const el = $('#mTimer');
      if (!el) { clearInterval(restTimer); return; }
      el.textContent = t > 0 ? ar(t) : '✅';
      if (t <= 0) { clearInterval(restTimer); toast('انتهت الاستراحة! نكمل 💪'); }
    }, 1000);
  }

  /* ---------- أفعال المشرف ---------- */
  function mark(c, okv) { const r = M.res[c.id] || { tries: 0 }; r.tries++; r.ok = okv; M.res[c.id] = r; return r; }
  function passAyah(c, r) {
    if (r.tries !== 1) return;
    state.ayahPass = state.ayahPass || {};
    const d = state.ayahPass[c.ayah] || [];
    if (!d.includes(M.date)) d.push(M.date);
    state.ayahPass[c.ayah] = d;
    if (d.length >= 2 && !state.ayat[c.ayah]) {
      state.ayat[c.ayah] = true;
      M.memorized = (M.memorized || []).concat(c.ayah);
      setTimeout(() => { confetti(200); toast(`🏅 حفظتَ الآية ${ar(c.ayah + 1)}!`); }, 400);
    }
  }
  function ok(c) {
    takeSaid(c);
    const r = mark(c, true);
    if (c.old && r.tries === 1) removeTrouble(c.text);
    if (c.kind === 'recite') passAyah(c, r);
    if (c.kind === 'read') { stopSpeech(); speak(c.text); }
    if (r.tries === 1) confetti(30); else toast('أحسنت! 👏');
    next();
  }
  function requeue(c) {
    let pos = M.i;
    while (M.plan[pos + 1] && M.plan[pos + 1].step === c.step) pos++;
    M.plan.splice(pos + 1, 0, Object.assign({}, c, { id: M.nextId++, requeued: true }));
  }
  function reinforce(a) {
    M.plan.forEach((x, k) => {
      if (k > M.i && x.isNew) { x.ayah = a; x.title = `نثبّت آية الأمس (${ar(a + 1)}): ${KIND_TITLE[x.kind]}`; }
    });
    M.reinforced = a;
  }
  function retry(c) {
    takeSaid(c);
    const r = M.res[c.id] || { tries: 0 };
    if (!hintOn) {
      r.tries++; M.res[c.id] = r; hintOn = true; save(); renderCard();
      if (c.kind === 'recite' || c.kind === 'look') playAyahOnce(c.ayah);
      return;
    }
    r.tries++; r.ok = false; M.res[c.id] = r;
    if (c.kind === 'read') addTrouble(c);
    if (c.kind === 'recite' && c.review) reinforce(c.ayah);
    if (!c.requeued && (c.kind === 'read' || c.kind === 'line')) requeue(c);
    toast(c.kind === 'recite' ? 'لا بأس، نثبّتها اليوم 💪' : 'نرجع لها بعدين 👍');
    next();
  }
  function next() {
    stopAudio(); stopSpeech(); hintOn = false; clearInterval(restTimer); clearInterval(qTimer);
    const prev = M.plan[M.i];
    M.i++;
    if (prev && prev.step === 'quran' && (!M.plan[M.i] || M.plan[M.i].step !== 'quran')) M.qEnd = Date.now();
    if (M.i >= M.plan.length) finish();
    save(); render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function finish() {
    M.done = true; M.ended = Date.now();
    const stBefore = window.stageIndexes ? stageIndexes() : null;
    const st = STORIES.find(s => s.id === M.story);
    const lines = M.plan.filter(c => c.step === 'story' && !c.requeued);
    const errs = lines.filter(c => { const r = M.res[c.id]; return !r || !r.ok || r.tries > 1; }).length;
    M.storyErr = errs;
    let extra = 0;
    const okRatio = lines.length ? (lines.length - errs) / lines.length : 0;
    if (st && lines.length && !state.stories[st.id] && okRatio >= CONFIG.storyPass) { state.stories[st.id] = true; M.storyDone = true; extra += 3; }
    const nwCards = M.plan.filter(c => c.isNew);
    if (nwCards.some(c => M.res[c.id] && M.res[c.id].ok)) {
      state.qIntro = state.qIntro || {};
      state.qIntro[nwCards[0].ayah] = M.date;
      state.qNew = { i: nwCards[0].ayah, date: M.date };
    }
    if (M.qStart) M.qMin = Math.max(1, Math.round(((M.qEnd || M.ended) - M.qStart) / 60000));
    const y = new Date(Date.now() - 864e5).toLocaleDateString('en-CA');
    if (state.lastMission !== M.date) state.streak = state.lastMission === y ? (state.streak || 0) + 1 : 1;
    state.lastMission = M.date;
    state.missionLog = (state.missionLog || []).concat({ date: M.date, story: M.story, storyErr: errs }).slice(-60);
    if (stBefore && window.stageIndexes) {
      const a = stageIndexes();
      M.stageUp = [];
      if (a.reading > stBefore.reading) M.stageUp.push(stageName('reading', a.reading));
      if (a.quran > stBefore.quran || (stBefore.quran >= 0 && a.quran === -1)) M.stageUp.push(a.quran === -1 ? `🏅 أتممت حفظ ${(window.JEHAD_QURAN || {}).name || 'السورة'}!` : stageName('quran', a.quran));
      if (M.stageUp.length) extra += 5;
    }
    M.clientId = M.clientId || `${M.date}-${M.started}`;
    save();
    award(5 + extra, `أنجزت مهمة اليوم يا ${state.name}! 🚀`, true);
    if (M.stageUp && M.stageUp.length) setTimeout(() => { confetti(260); toast(`🎉 فتحت مرحلة جديدة: ${M.stageUp.join(' — ')}`); }, 2600);
    report();
    if (window.renderLevels) { renderLevels(); renderShelf(); renderStory(); }
    if (window.renderAyah) renderAyah();
  }

  /* ---------- الإرسال لعبدالله (المتابعة عن بعد) ---------- */
  function statsOf() {
    const res = c => M.res[c.id] || {};
    const first = c => res(c).ok && res(c).tries === 1;
    const grp = s => M.plan.filter(c => c.step === s && !c.requeued);
    const pack = s => { const g = grp(s); return { ok: g.filter(first).length, n: g.length }; };
    const st = STORIES.find(x => x.id === M.story);
    return {
      dur: Math.max(1, Math.round(((M.ended || Date.now()) - (M.started || Date.now())) / 60000)),
      pairs: pack('pairs'), words: pack('words'),
      story: Object.assign(pack('story'), { title: st ? stripMarks(st.title) : '', done: !!M.storyDone }),
      quran: M.plan.filter(c => c.step === 'quran' && (c.kind === 'recite' || c.kind === 'look') && !c.requeued)
        .map(c => ({ title: c.title, ok: !!res(c).ok, first: first(c) })),
      memorized: (M.memorized || []).map(i => i + 1),
      qMin: M.qMin || null, qStopped: !!M.qStopped,
      fails: M.plan.filter(c => (c.step === 'pairs' || c.step === 'words') && !first(c) && !c.requeued).map(c => c.text),
      stageUp: M.stageUp || [],
      mood: M.mood || null
    };
  }
  function report() {
    if (!window.syncReport || !M.done) return;
    M.clientId = M.clientId || `${M.date}-${M.started}`;
    syncReport({ date: M.date, summary: summary(), stats: statsOf(), clientId: M.clientId });
  }

  /* ---------- الملخص ---------- */
  function summary() {
    const L = [];
    const res = c => M.res[c.id] || {};
    const grp = s => M.plan.filter(c => c.step === s && !c.requeued);
    const first = c => res(c).ok && res(c).tries === 1;
    const saidOf = c => {
      const all = M.plan.filter(x => x.step === c.step && x.text === c.text && M.said[x.id]).map(x => M.said[x.id]);
      return all.length ? ` (قال: ${all.join(' / ')})` : '';
    };
    const dur = Math.max(1, Math.round(((M.ended || Date.now()) - (M.started || Date.now())) / 60000));
    L.push(`🚀 مهمة ${state.name} — ${M.date}`);
    L.push(`⏱️ المدة: ${ar(dur)} دقيقة`);
    [['pairs', '🔥 حروف تتشابه'], ['words', '🔤 كلمات القصة']].forEach(([s, name]) => {
      const g = grp(s); if (!g.length) return;
      const fails = g.filter(c => !first(c)).map(c => c.text + saidOf(c));
      L.push(`${name}: ${ar(g.filter(first).length)}/${ar(g.length)} من أول مرة` + (fails.length ? ` — تعثّر في: ${fails.join('، ')}` : ''));
    });
    const s = grp('story'), st = STORIES.find(x => x.id === M.story);
    if (s.length && st) {
      const fails = s.filter(c => !first(c)).map(c => `السطر ${ar(c.li + 1)}${saidOf(c)}`);
      L.push(`📖 قصة «${stripMarks(st.title)}»: ${ar(s.filter(first).length)}/${ar(s.length)} سطر من أول مرة` +
        (M.storyDone ? ' — ✅ أنهاها' : ' — نعيدها في المهمة القادمة') + (fails.length ? ` — تعثّر في: ${fails.join('، ')}` : ''));
    }
    M.plan.filter(c => c.step === 'quran' && (c.kind === 'recite' || c.kind === 'look') && !c.requeued).forEach(c => {
      const r = res(c);
      L.push(`🌙 ${c.title}: ${c.skipped ? '⏭️ لم نصل لها اليوم' : r.ok ? (r.tries === 1 ? '✅ من أول مرة' : '✅ بعد مساعدة') : '🔁 تحتاج تثبيت'}`);
    });
    if (M.qMin) L.push(`⏱️ وقت القرآن: ${ar(M.qMin)} دقيقة${M.qStopped ? ' — توقفنا عند الحد ✋' : ''}`);
    (M.memorized || []).forEach(i => L.push(`🏅 حفظ الآية ${ar(i + 1)}`));
    const q = M.plan.find(c => c.kind === 'answer');
    if (q) L.push(`🎤 السؤال: ${res(q).ok ? 'أجاب ✅' : 'لم يُجب'}`);
    L.push(`🙂 مزاجه: ${M.mood || '—'}`);
    return L.join('\n');
  }

  /* ---------- الشاشات ---------- */
  function render() {
    clearInterval(restTimer);
    if (!M || M.date !== today()) {
      M = (state.mission && state.mission.date === today()) ? state.mission : buildPlan();
      state.mission = M; save();
    }
    if (!M.started) return renderStart();
    if (M.done) return renderEnd();
    renderCard();
  }
  function renderStart() {
    const counts = {};
    M.plan.forEach(c => counts[c.step] = (counts[c.step] || 0) + 1);
    const order = [...new Set(M.plan.map(c => c.step))];
    const st = STORIES.find(s => s.id === M.story);
    const q = M.plan.filter(c => c.step === 'quran');
    const rv = q.find(c => c.review), nw = q.find(c => c.isNew);
    const detail = {
      pairs: n => `${ar(n)} بطاقات`, words: n => `${ar(n)} كلمات`,
      story: n => `«${st ? st.title : ''}» — ${ar(n)} أسطر`, rest: () => 'دقيقة',
      quran: () => [rv ? `مراجعة الآية ${ar(rv.ayah + 1)}` : '', nw ? `آية جديدة ${ar(nw.ayah + 1)}` : ''].filter(Boolean).join(' + '),
      question: () => 'سؤال واحد'
    };
    box.innerHTML = `
      <article class="card">
        <h2>🚀 مهمة اليوم يا ${esc2(state.name)}</h2>
        ${state.streak > 1 ? `<p>🔥 سلسلتك: ${ar(state.streak)} أيام متتالية — لا تقطعها!</p>` : ''}
        ${window.journeyHTML ? journeyHTML() : ''}
        <h3>📋 خطة اليوم</h3>
        <ul class="m-plan">${order.map(s => `<li><span>${STEPS[s].icon} ${STEPS[s].title}</span><b>${detail[s](counts[s])}</b></li>`).join('')}</ul>
        <p class="m-note">👩‍🏫 <b>للمشرف:</b> اجلس بجانب جهاد. هو يقرأ بصوت عالٍ، وأنت تضغط <b>✅</b> إذا قرأ صحيحًا أو <b>🔁</b> إذا احتاج إعادة. لا تقرأ عنه، وانتظر ٥ ثوانٍ قبل أن تساعده.</p>
        <button class="btn primary m-start" id="mStart">🚀 ابدأ المهمة</button>
      </article>`;
    $('#mStart').onclick = () => { M.started = Date.now(); save(); render(); };
  }
  function renderCard() {
    const c = cur(), S = STEPS[c.step];
    const order = [...new Set(M.plan.map(x => x.step))];
    const ci = order.indexOf(c.step);
    const total = M.plan.filter(x => x.step === c.step).length;
    const pos = M.plan.slice(0, M.i + 1).filter(x => x.step === c.step).length;
    const title = c.step === 'quran' ? c.title : S.title;
    if (c.step === 'quran' && !M.qStart) { M.qStart = Date.now(); save(); }
    let item = '', sup = '';
    if (c.kind === 'read') {
      item = `${c.old ? '<span class="m-old">⭐ كلمة من أمس</span>' : ''}<div class="m-big">${window.affixHTML ? affixHTML(c.text) : esc2(c.text)}</div>`;
      sup = supOkRetry('✅ قرأها صح');
    } else if (c.kind === 'line') {
      const split = !!state.syl || hintOn;
      item = `<div class="m-line">${lineText(c.text).split(' ').map(w => split ? syl(w, true) : (window.affixHTML ? affixHTML(w) : w)).join(' ')}</div>
        <div class="controls m-center"><button class="tool" id="mSyl">${state.syl ? '🔗 الكلمات كاملة' : '✂️ قسّم الكلمات'}</button></div>`;
      sup = supOkRetry('✅ قرأه صح');
    } else if (c.kind === 'recite') {
      item = ayahHTML(c.ayah, hintOn ? 'show' : 'first');
      sup = supOkRetry('✅ سمّعها صح');
    } else if (c.kind === 'look') {
      item = ayahHTML(c.ayah, 'show');
      sup = supOkRetry('✅ قرأها صح');
    } else if (c.kind === 'listen' || c.kind === 'build') {
      item = ayahHTML(c.ayah, 'show') + `<div class="m-lbl" id="mLbl"></div>
        <div class="controls m-center"><button class="btn primary" id="mPlay">${c.kind === 'listen' ? '▶️ اسمع ٣ مرات' : '🧱 ابدأ البناء'}</button></div>`;
      sup = supNext();
    } else if (c.kind === 'rest') {
      item = `<div class="m-emoji">🧃🤸</div><div class="m-timer" id="mTimer">${ar(CONFIG.breakSeconds)}</div>`;
      sup = supNext();
    } else if (c.kind === 'answer') {
      item = `<div class="m-line">${esc2(c.text)}</div><div class="controls m-center"><button class="btn blue" id="mHearQ">🔊 اسمع السؤال</button></div>`;
      sup = `<div class="m-sup"><span class="m-sup-lbl">👩‍🏫 للمشرف</span><div class="controls">
        <button class="btn ok" id="mOk">✅ أجاب</button><button class="btn" id="mSkip">تخطَّ</button></div></div>`;
    }
    let hint = '';
    if (hintOn && ['read', 'line', 'recite', 'look'].includes(c.kind)) {
      let h = '';
      if (c.kind === 'read' && c.step === 'pairs') {
        h = `<p>👆 عُدّ النقاط: ${CONFIG.letterHints[firstBase(c.text)] || ''}</p>`;
      } else if (c.kind === 'read') {
        const ah = window.affixHint ? affixHint(c.text) : '';
        h = (ah ? `<p>👉 إصبعك حتى آخر حرف: <b>${ah}</b></p>` : '') + `<p>✂️ اقرأها مقطعًا مقطعًا:</p><div class="m-big">${syl(c.text, true)}</div>`;
      } else if (c.kind === 'line') {
        h = `<p>✂️ قسّمنا الكلمات لك. اقرأ مقطعًا مقطعًا.</p>`;
      } else {
        h = `<p>👂 اسمع الآية مرة، ثم حاول مرة ثانية.</p>`;
      }
      const hearBtn = (c.kind === 'recite' || c.kind === 'look')
        ? `<button class="btn blue" id="mHearAyah">🔊 اسمع الآية</button>`
        : `<button class="btn blue" id="mHear">🔊 ${c.kind === 'line' ? 'اسمع السطر' : 'اسمعها'}</button>`;
      hint = `<div class="m-hint">${h}<div class="controls m-center">${hearBtn}</div>
        <input id="mSaid" placeholder="👩‍🏫 ماذا قال؟ (اختياري)"></div>`;
    }
    box.innerHTML = `
      <div class="m-steps">${order.map((s, k) => `<span class="m-chip ${k < ci ? 'done' : ''} ${k === ci ? 'cur' : ''}">${STEPS[s].icon} ${STEPS[s].title}</span>`).join('')}</div>
      <div class="m-bar"><i style="width:${Math.round(M.i / M.plan.length * 100)}%"></i></div>
      <article class="card">
        <div class="m-title"><span>${S.icon} ${title}</span><small>${ar(pos)} من ${ar(total)}</small></div>
        <p class="m-instr">${instrOf(c)} <button class="tool" id="mInstr" aria-label="اسمع التعليمات">🔊</button></p>
        ${c.step === 'quran' ? `<div id="mQBox">${qBarHTML(qMins())}</div>` : ''}
        <div class="m-item">${item}</div>
        ${hint}
        ${sup}
      </article>`;
    const on = (id, f) => { const el = document.getElementById(id); if (el) el.onclick = f; };
    on('mInstr', () => { stopSpeech(); speak(instrOf(c)); });
    on('mOk', () => ok(c));
    on('mRetry', () => retry(c));
    on('mNext', () => { mark(c, true); next(); });
    on('mSkip', () => { mark(c, false); next(); });
    on('mSyl', () => { state.syl = !state.syl; save(); renderCard(); });
    on('mHear', () => { stopSpeech(); speak(c.kind === 'line' ? lineText(c.text) : c.text); });
    on('mHearQ', () => { stopSpeech(); speak(c.text); });
    on('mHearAyah', () => playAyahOnce(c.ayah));
    on('mPlay', () => c.kind === 'listen' ? playListen(c.ayah) : playBuild(c.ayah));
    $$('#mBox .aw').forEach(el => el.onclick = () => {
      if (el.classList.contains('hid')) el.classList.remove('hid');
      else playWord(c.ayah, +el.dataset.j);
    });
    if (c.kind === 'rest') startRest();
    on('mQStop', stopQuran);
    clearInterval(qTimer);
    if (c.step === 'quran') qTimer = setInterval(() => {
      const qb = document.getElementById('mQBox');
      if (!qb || !M || M.done || cur().step !== 'quran') { clearInterval(qTimer); return; }
      if (!document.getElementById('mQStop')) { qb.innerHTML = qBarHTML(qMins()); on('mQStop', stopQuran); }
    }, 20000);
  }
  function renderEnd() {
    const dur = Math.max(1, Math.round(((M.ended || Date.now()) - (M.started || Date.now())) / 60000));
    const moods = ['😀 مبسوط', '🙂 جيد', '😐 عادي', '😫 متعب'];
    box.innerHTML = `
      <article class="card m-endcard">
        <div class="m-emoji">🎉🏆</div>
        <h2>أنجزت مهمة اليوم يا ${esc2(state.name)}!</h2>
        <p>⏱️ ${ar(dur)} دقيقة${state.streak > 1 ? ` • 🔥 ${ar(state.streak)} أيام متتالية` : ''}</p>
        ${M.storyDone ? '<p>📚 أنهيت القصة! ✅</p>' : ''}
        ${(M.memorized || []).map(i => `<p>🏅 حفظت الآية ${ar(i + 1)}</p>`).join('')}
        ${(M.stageUp || []).map(t => `<p class="m-stageup">🎉 فتحت مرحلة جديدة: ${t}</p>`).join('')}
        ${window.journeyHTML ? journeyHTML() : ''}
      </article>
      <article class="card">
        <h3>👩‍🏫 للمشرف: كيف كان مزاجه وتركيزه؟</h3>
        <div class="m-moods">${moods.map(m => `<button class="m-mood ${M.mood === m ? 'on' : ''}" data-m="${m}">${m}</button>`).join('')}</div>
        <h3>📝 ملخص الجلسة (يُرسل لعبدالله)</h3>
        <pre class="m-sum" id="mSum"></pre>
        <div class="controls">
          <button class="btn primary" id="mCopy">📋 انسخ الملخص</button>
          <a class="btn blue" id="mWa" target="_blank" rel="noopener">💬 أرسله واتساب</a>
        </div>
        <div class="controls"><button class="btn" id="mAgain">🔁 مهمة إضافية</button></div>
      </article>`;
    const fill = () => {
      const s = summary();
      $('#mSum').textContent = s;
      $('#mWa').href = 'https://wa.me/?text=' + encodeURIComponent(s);
    };
    fill();
    $$('.m-mood').forEach(b => b.onclick = () => {
      M.mood = b.dataset.m; save(); report();
      $$('.m-mood').forEach(x => x.classList.toggle('on', x === b));
      fill();
    });
    $('#mCopy').onclick = async () => {
      const s = summary(); let okc = false;
      try { await navigator.clipboard.writeText(s); okc = true; } catch (e) {}
      if (!okc) {
        const ta = document.createElement('textarea'); ta.value = s; document.body.appendChild(ta); ta.select();
        try { okc = document.execCommand('copy'); } catch (e) {}
        ta.remove();
      }
      toast(okc ? 'تم النسخ ✅ الصقه في واتساب' : 'لم يتم النسخ — انسخه يدويًا');
    };
    $('#mAgain').onclick = () => { M = buildPlan(); state.mission = M; save(); render(); };
  }

  window.renderMission = render;
  window.reloadMission = () => {
    M = null;
    if (state.mission && !state.mission.started) state.mission = null; // خطة لم تبدأ تُبنى من جديد بالتقدّم المدموج
    render();
  };
  render();
  showTab('mission');
})();
