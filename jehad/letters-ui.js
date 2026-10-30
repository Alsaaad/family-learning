/* =========================================================
   مرحلة الحروف — الواجهة
   يعتمد على الدوال العامة في الملف الرئيسي: $ $$ state save speak stopSpeech award confetti toast ar
   ========================================================= */
(() => {
  const LET = window.JEHAD_LETTERS || { units: [], info: {} };
  const FATHA = 'َ', DAMMA = 'ُ', KASRA = 'ِ', TAT = 'ـ';
  const NONJOIN = new Set(['ا', 'أ', 'د', 'ذ', 'ر', 'ز', 'و']);
  const formsOf = L => NONJOIN.has(L) ? [L, L, TAT + L, TAT + L] : [L, L + TAT, TAT + L + TAT, TAT + L];
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

  state.letters = state.letters || {};
  state.lpick = state.lpick || {};
  if (typeof state.unit !== 'number' || state.unit >= LET.units.length) state.unit = 0;

  const curUnit = () => LET.units[state.unit] || { letters: [] };
  const curLetter = () => {
    const u = curUnit();
    return u.letters[Math.min(state.lpick[state.unit] || 0, u.letters.length - 1)];
  };

  /* ---------- الوحدات والحروف ---------- */
  function renderUnits() {
    $('#units').innerHTML = LET.units.map((u, i) => {
      const done = u.letters.every(l => state.letters[l]);
      return `<button class="unit ${i === state.unit ? 'active' : ''}" data-i="${i}">
        <b>الوحدة ${ar(i + 1)} ${done ? '✅' : ''}</b><span>${u.letters.join(' ')}</span></button>`;
    }).join('');
    $$('.unit').forEach(b => b.onclick = () => {
      stopSpeech(); state.unit = +b.dataset.i; save(); renderAllLetters(); newGame();
    });
  }
  function renderLetterRow() {
    const cur = curLetter();
    $('#letterRow').innerHTML = curUnit().letters.map((l, k) =>
      `<button class="lbtn ${l === cur ? 'active' : ''}" data-k="${k}">${l}${state.letters[l] ? '<small>✅</small>' : ''}</button>`).join('');
    $$('.lbtn').forEach(b => b.onclick = () => {
      stopSpeech(); state.lpick[state.unit] = +b.dataset.k; save(); renderLetterRow(); renderLetter();
    });
  }
  function renderLetter() {
    const L = curLetter();
    if (!L) { $('#bigLetter').textContent = '…'; return; }
    const inf = LET.info[L] || {};
    $('#bigLetter').textContent = L;
    $('#lEmoji').textContent = inf.emoji || '';
    $('#lWord').textContent = inf.word || '';
    const labels = ['وحده', 'أول الكلمة', 'وسط الكلمة', 'آخر الكلمة'];
    $('#forms').innerHTML = formsOf(L).map((f, i) =>
      `<div class="form"><span class="fch">${f}</span><small>${labels[i]}</small></div>`).join('');
    $('#harakat').innerHTML = [[FATHA, 'فتحة'], [DAMMA, 'ضمّة'], [KASRA, 'كسرة']].map(([h, n]) =>
      `<button class="hbtn" data-say="${L + h}"><span class="fch">${L + h}</span><small>${n}</small></button>`).join('');
    $$('.hbtn').forEach(b => b.onclick = () => { stopSpeech(); speak(b.dataset.say); });
    const done = !!state.letters[L];
    $('#letterDone').textContent = done ? '✅ عرفته — راجعه مرة أخرى' : '✅ عرفتُ هذا الحرف';
    $('#letterDone').classList.toggle('again', done);
    drawGuide();
  }
  function renderAllLetters() { renderUnits(); renderLetterRow(); renderLetter(); }

  $('#hearLetter').onclick = () => {
    const L = curLetter(); if (!L) return;
    const inf = LET.info[L] || {};
    stopSpeech(); speak(`${L + FATHA}، ${L + FATHA}، ${inf.word || ''}`);
  };
  $('#letterDone').onclick = () => {
    const L = curLetter(); if (!L) return;
    if (!state.letters[L]) {
      state.letters[L] = true;
      const u = curUnit();
      const unitDone = u.letters.every(l => state.letters[l]);
      const k = u.letters.indexOf(L);
      if (!unitDone && k < u.letters.length - 1) state.lpick[state.unit] = k + 1;
      award(unitDone ? 3 : 1,
        unitDone ? `أنهيت الوحدة ${ar(state.unit + 1)} كاملة يا ${state.name}! 🎉` : `رائع! عرفتَ حرف «${L}» 🌟`,
        unitDone);
    } else {
      confetti(40); toast('المراجعة تقوّي الذاكرة 👏');
    }
    renderAllLetters();
  };

  /* ---------- الرسم بالإصبع (تعلّم متعدد الحواس) ---------- */
  const tc = $('#trace'), tx = tc.getContext('2d');
  let drawing = false, last = null;
  function sizeTrace() {
    const d = window.devicePixelRatio || 1;
    const w = tc.clientWidth; if (!w) return;
    const h = Math.round(Math.min(w * 0.7, 420));
    tc.style.height = h + 'px';
    tc.width = w * d; tc.height = h * d;
    tx.setTransform(d, 0, 0, d, 0, 0);
    drawGuide();
  }
  function drawGuide() {
    const w = tc.clientWidth, h = tc.clientHeight; if (!w || !h) return;
    tx.clearRect(0, 0, w, h);
    const L = curLetter(); if (!L) return;
    tx.save();
    tx.fillStyle = '#E4DCCD';
    tx.textAlign = 'center'; tx.textBaseline = 'middle'; tx.direction = 'rtl';
    tx.font = `700 ${Math.round(h * 0.7)}px "Readex Pro","Geeza Pro",sans-serif`;
    tx.fillText(L, w / 2, h * 0.5);
    tx.restore();
  }
  const pos = e => { const r = tc.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  tc.addEventListener('pointerdown', e => { drawing = true; last = pos(e); try { tc.setPointerCapture(e.pointerId); } catch (_) {} });
  tc.addEventListener('pointermove', e => {
    if (!drawing) return;
    const p = pos(e);
    tx.strokeStyle = '#E67E22'; tx.lineWidth = 14; tx.lineCap = 'round'; tx.lineJoin = 'round';
    tx.beginPath(); tx.moveTo(last.x, last.y); tx.lineTo(p.x, p.y); tx.stroke();
    last = p;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => tc.addEventListener(ev, () => { drawing = false; }));
  $('#clearTrace').onclick = drawGuide;
  addEventListener('resize', sizeTrace);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawGuide);

  /* ---------- لعبة: بماذا تبدأ الكلمة؟ ---------- */
  let target = null, rightCount = 0;
  function newGame() {
    const u = curUnit(); if (!u.letters.length) return;
    const pool = LET.units.slice(0, state.unit + 1).flatMap(x => x.letters);
    let t;
    do { t = u.letters[Math.floor(Math.random() * u.letters.length)]; } while (u.letters.length > 1 && t === target);
    target = t;
    const opts = shuffle([t, ...shuffle(pool.filter(l => l !== t)).slice(0, 2)]);
    $('#gEmoji').textContent = (LET.info[t] || {}).emoji || '❓';
    $('#choices').innerHTML = opts.map(l => `<button class="choice" data-l="${l}">${l}</button>`).join('');
    $$('.choice').forEach(b => b.onclick = () => {
      if (b.dataset.l === target) {
        b.classList.add('right');
        $$('.choice').forEach(x => x.disabled = true);
        rightCount++;
        stopSpeech(); speak((LET.info[target] || {}).word || '');
        if (rightCount % 3 === 0) award(1, '٣ إجابات صحيحة! 🎯');
        else { confetti(50); toast('أحسنت! 👏'); }
        setTimeout(newGame, 1600);
      } else {
        b.classList.add('try'); b.disabled = true;
        toast('قريب! جرّب حرفًا آخر 😊');
      }
    });
  }
  $('#hearWord').onclick = () => { stopSpeech(); speak((LET.info[target] || {}).word || ''); };
  $('#nextGame').onclick = newGame;

  /* ---------- التشغيل ---------- */
  window.onLettersShown = () => setTimeout(sizeTrace, 30);
  renderAllLetters();
  newGame();
  if (state.tab === 'letters') window.onLettersShown();
})();
