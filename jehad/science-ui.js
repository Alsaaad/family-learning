/* =========================================================
   🔬 مذاكرة العلوم
   الترتيب: لكل وحدة ← شرح نقطة نقطة (يُقرأ بالصوت) ← أسئلة بنفس شكل الاختبار
   الإجابة الخاطئة ← تظهر الصحيحة والسبب ← تُحفظ في «أخطائي» وتعود حتى يجيبها صح
   «اختبار تجريبي» ← كل الأسئلة بترتيب الاختبار، ونتيجته تصل لعبدالله
   ========================================================= */
(() => {
  const SCI = window.JEHAD_SCIENCE;
  if (!SCI) return;
  const today = () => new Date().toLocaleDateString('en-CA');
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  state.sci = state.sci || { units: {}, wrong: [] };
  const S = () => state.sci;

  /* تبويب + قسم */
  const nav = document.querySelector('.tabs');
  const tab = document.createElement('button');
  tab.className = 'tab'; tab.dataset.tab = 'science'; tab.setAttribute('role', 'tab');
  tab.innerHTML = '🔬<span>مذاكرة</span>';
  nav.appendChild(tab);
  tab.onclick = () => { showTab('science'); home(); };
  const panel = document.createElement('section');
  panel.id = 'science'; panel.className = 'panel';
  panel.innerHTML = '<div id="sciBox"></div>';
  document.querySelector('main').appendChild(panel);
  const box = panel.querySelector('#sciBox');

  const speakQ = q => {
    const opts = q.type === 'tf' ? ['صح', 'خطأ'] : q.o;
    stopSpeech(); speak(`${q.q} ... ${opts.join('، أو ')}`);
  };
  const qIndex = q => SCI.questions.indexOf(q);

  /* ---------- الصفحة الرئيسية للمذاكرة ---------- */
  function home() {
    const units = SCI.units.map(u => {
      const st = S().units[u.id] || {};
      const qs = SCI.questions.filter(q => q.u === u.id);
      return `<button class="sci-unit ${st.learned ? 'done' : ''}" data-u="${u.id}">
        <span class="su-ico">${u.icon}</span><b>${u.name}</b>
        <small>${st.learned ? `✅ آخر نتيجة: ${ar(st.score || 0)} من ${ar(qs.length)}` : `${ar(u.points.length)} نقاط • ${ar(qs.length)} أسئلة`}</small></button>`;
    }).join('');
    const wrongN = S().wrong.length;
    box.innerHTML = `
      <article class="card">
        <h2>🔬 مذاكرة ${SCI.title}</h2>
        <div class="sci-plan">
          <b>📅 خطة المذاكرة المقترحة</b>
          <ol>
            <li><b>الجمعة:</b> الوحدات ١ إلى ٣ (التصنيف، والممالك، وأجزاء النبات).</li>
            <li><b>السبت:</b> الوحدات ٤ إلى ٦، ثم «📝 أخطائي».</li>
            <li><b>الأحد صباحًا (١٠ دقائق):</b> «🎯 اختبار تجريبي» فقط، بلا شرح جديد.</li>
          </ol>
          <p class="muted-s">كل وحدة: اسمع الشرح نقطة نقطة، ثم أجب. الأسئلة تُقرأ لك بالصوت 🔊</p>
        </div>
        <div class="sci-units">${units}</div>
        <div class="controls">
          <button class="btn ${wrongN ? 'primary' : ''}" id="sciWrong" ${wrongN ? '' : 'disabled'}>📝 أخطائي (${ar(wrongN)})</button>
          <button class="btn blue" id="sciMock">🎯 اختبار تجريبي (${ar(SCI.questions.length)} سؤالًا)</button>
        </div>
      </article>`;
    $$('#sciBox .sci-unit').forEach(b => b.onclick = () => learn(SCI.units.find(u => u.id === b.dataset.u), 0));
    $('#sciWrong').onclick = () => quiz(S().wrong.map(i => SCI.questions[i]).filter(Boolean), 'wrong');
    $('#sciMock').onclick = () => quiz(SCI.questions.slice(), 'mock');
  }

  /* ---------- الشرح: نقطة واحدة في كل مرة ---------- */
  function learn(u, k) {
    const p = u.points[k];
    const txt = p.t.replace(p.key, `<mark>${p.key}</mark>`);
    box.innerHTML = `
      <article class="card">
        <div class="m-title"><span>${u.icon} ${u.name}</span><small>${ar(k + 1)} من ${ar(u.points.length)}</small></div>
        <div class="sci-point"><div class="sp-e">${p.e}</div><p>${txt}</p></div>
        <div class="controls m-center">
          <button class="btn blue" id="spHear">🔊 اسمع</button>
          ${k > 0 ? '<button class="btn" id="spPrev">→ السابقة</button>' : ''}
          <button class="btn primary" id="spNext">${k < u.points.length - 1 ? 'التالية ←' : '✍️ اختبر نفسك'}</button>
        </div>
        <div class="controls"><button class="tool" id="spHome">⬅ رجوع للوحدات</button></div>
      </article>`;
    $('#spHear').onclick = () => { stopSpeech(); speak(p.t); };
    if (k > 0) $('#spPrev').onclick = () => learn(u, k - 1);
    $('#spNext').onclick = () => k < u.points.length - 1 ? learn(u, k + 1)
      : quiz(SCI.questions.filter(q => q.u === u.id), 'unit', u);
    $('#spHome').onclick = home;
    stopSpeech(); speak(p.t);
  }

  /* ---------- الأسئلة ---------- */
  function quiz(list, mode, unit) {
    if (!list.length) { home(); return; }
    const qs = mode === 'mock' ? list : shuffle(list);
    let i = 0, score = 0;
    const wrongHere = [];
    const label = { mcq: 'اختر الإجابة الصحيحة', tf: 'صح أم خطأ؟', match: 'صِل', term: 'اختر المصطلح العلمي', compare: 'قارن' };
    function show() {
      const q = qs[i];
      const opts = q.type === 'tf' ? ['صح ✅', 'خطأ ❌'] : q.o;
      box.innerHTML = `
        <article class="card">
          <div class="m-title"><span>${mode === 'mock' ? '🎯 اختبار تجريبي' : mode === 'wrong' ? '📝 أخطائي' : unit.icon + ' ' + unit.name}</span>
            <small>${ar(i + 1)} من ${ar(qs.length)}</small></div>
          <div class="m-bar"><i style="width:${Math.round(i / qs.length * 100)}%"></i></div>
          <p class="sci-type">${label[q.type]}</p>
          <div class="sci-q">${q.q}</div>
          <div class="controls m-center"><button class="tool" id="sqHear">🔊 اسمع السؤال</button></div>
          <div class="sci-opts">${opts.map((o, k) => `<button class="sci-opt" data-k="${k}">${o}</button>`).join('')}</div>
          <div id="sqWhy"></div>
        </article>`;
      $('#sqHear').onclick = () => speakQ(q);
      $$('#sciBox .sci-opt').forEach(b => b.onclick = () => answer(q, +b.dataset.k, b));
    }
    function answer(q, k, btn) {
      const right = q.type === 'tf' ? (k === 0) === q.a : k === q.a;
      const rightK = q.type === 'tf' ? (q.a ? 0 : 1) : q.a;
      $$('#sciBox .sci-opt').forEach((b, j) => { b.disabled = true; if (j === rightK) b.classList.add('right'); });
      const idx = qIndex(q);
      if (right) {
        score++; confetti(30);
        if (mode === 'wrong' || mode === 'mock') S().wrong = S().wrong.filter(x => x !== idx);
      } else {
        btn.classList.add('wrong');
        wrongHere.push(q);
        if (!S().wrong.includes(idx)) S().wrong.push(idx);
      }
      save();
      $('#sqWhy').innerHTML = `<div class="sci-why ${right ? 'ok' : ''}">${right ? '👏 أحسنت!' : '💡 الإجابة الصحيحة باللون الأخضر.'} ${q.why}</div>
        <div class="controls m-center"><button class="btn primary" id="sqNext">${i < qs.length - 1 ? 'التالي ←' : 'النتيجة 🏁'}</button></div>`;
      stopSpeech(); speak((right ? 'أحسنت. ' : '') + q.why);
      $('#sqNext').onclick = () => { i++; i < qs.length ? show() : finish(); };
    }
    function finish() {
      if (mode === 'unit') { S().units[unit.id] = { learned: true, score, date: today() }; }
      if (mode === 'mock') {
        S().mocks = (S().mocks || []).concat({ date: today(), score, n: qs.length }).slice(-10);
        if (window.syncReport) {
          const fails = wrongHere.map(q => '• ' + q.q.replace(/^قارن: |^صِل: |^المصطلح العلمي: /, '')).join('\n');
          syncReport({ date: today(), clientId: `sci-${Date.now()}`,
            summary: `🔬 ${SCI.title} — اختبار تجريبي\n✅ ${ar(score)} من ${ar(qs.length)}` + (fails ? `\nأخطأ في:\n${fails}` : '\nكل الإجابات صحيحة 🎉'),
            stats: { type: 'science', score, n: qs.length } });
        }
      }
      save();
      const pct = Math.round(score / qs.length * 100);
      award(score === qs.length ? 3 : 1, score === qs.length ? 'كل الإجابات صحيحة! 🏆' : 'أحسنت المحاولة! 💪', pct >= 90);
      box.innerHTML = `
        <article class="card sci-end">
          <div class="m-emoji">${pct >= 90 ? '🏆' : pct >= 70 ? '🌟' : '💪'}</div>
          <h2>${ar(score)} من ${ar(qs.length)}</h2>
          <p>${wrongHere.length ? `الأسئلة التي أخطأت فيها حُفظت في «📝 أخطائي» لتعيدها.` : 'ما شاء الله! كل الإجابات صحيحة.'}</p>
          <div class="controls m-center">
            ${wrongHere.length ? '<button class="btn primary" id="seRetry">🔁 أعد الأسئلة الخاطئة الآن</button>' : ''}
            <button class="btn" id="seHome">⬅ رجوع للوحدات</button>
          </div>
        </article>`;
      if (wrongHere.length) $('#seRetry').onclick = () => quiz(wrongHere.slice(), 'wrong');
      $('#seHome').onclick = home;
    }
    show();
    speakQ(qs[0]);
  }

  home();
})();
