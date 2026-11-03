/* =========================================================
   🎧 وحدي — تدريب جهاد بدون مشرف (استماع وحفظ القرآن)
   لا يغيّر «حفظتُ» ولا يحسب تسميعًا؛ التسميع يكون مع المشرف في المهمة.
   يُسجَّل وقت الاستماع في state.soloLog ليظهر لعبدالله.
   ========================================================= */
(() => {
  if (typeof AYAT === 'undefined' || !AYAT.length) return;
  const QN = (window.JEHAD_QURAN || {}).name || 'السورة';
  const today = () => new Date().toLocaleDateString('en-CA');
  let sid = 0, busy = false, times = 3;
  state.soloLog = state.soloLog || [];

  const nav = document.querySelector('.tabs');
  const tab = document.createElement('button');
  tab.className = 'tab'; tab.dataset.tab = 'solo'; tab.setAttribute('role', 'tab');
  tab.innerHTML = '🎧<span>وحدي</span>';
  nav.appendChild(tab);
  const panel = document.createElement('section');
  panel.id = 'solo'; panel.className = 'panel';
  document.querySelector('main').appendChild(panel);
  tab.onclick = () => { showTab('solo'); render(); };

  const defAyah = () => {
    const q = state.qNew && state.qNew.i < AYAT.length ? state.qNew.i : AYAT.findIndex((_, i) => !state.ayat[i]);
    return q >= 0 ? q : 0;
  };
  let cur = null;
  function log(kind, n) {
    state.soloLog = state.soloLog.concat({ date: today(), kind, ayah: cur + 1, n, t: Date.now() }).slice(-100);
    save();
    if (window.FamilyPass) FamilyPass.progress('listen');
  }
  function stop() { sid++; busy = false; if (window.stopAyah) stopAyah(); lbl(''); hl(-1); setBtns(); }
  const lbl = t => { const e = document.getElementById('soLbl'); if (e) e.textContent = t; };
  const hl = j => panel.querySelectorAll('.aw').forEach((el, k) => el.classList.toggle('on', k === j));
  const setBtns = () => { const b = document.getElementById('soStop'); if (b) b.style.display = busy ? '' : 'none'; };

  async function loop() {
    stop(); stopSpeech(); const s = ++sid; busy = true; setBtns();
    for (let k = 1; k <= times; k++) {
      lbl(`🔁 ${ar(k)} من ${ar(times)} — ردّد بعد الشيخ`);
      const ok = await playAyahAudio(cur, qSession);
      if (s !== sid) return;
      if (!ok) { toast('نحتاج اتصالاً بالإنترنت 🌐'); break; }
      await qSleep(1500); if (s !== sid) return;
    }
    log('loop', times); busy = false; setBtns(); lbl('✅ أحسنت! كرّرها مرة أخرى أو جرّب البناء');
    confetti(40);
  }
  async function build() {
    stop(); stopSpeech(); const s = ++sid; busy = true; setBtns();
    for (const [from, end] of buildSteps(AYAT[cur].w.length)) {
      lbl(from === end ? `🧱 الكلمة ${ar(from + 1)}` : `🧱 من ${ar(from + 1)} إلى ${ar(end + 1)}`);
      for (let j = from; j <= end; j++) {
        hl(j); const ok = await playUrl(wordUrl(cur, j));
        if (s !== sid) return;
        if (!ok) { toast('نحتاج اتصالاً بالإنترنت 🌐'); stop(); return; }
        await qSleep(120);
      }
      hl(-1); lbl('🗣️ دورك! ردّدها');
      await qSleep(1300 + 750 * (end - from + 1)); if (s !== sid) return;
    }
    log('build', 1); busy = false; setBtns(); lbl('🌟 بنيتَ الآية!'); confetti(60);
  }
  async function playlist() {
    const list = AYAT.map((_, i) => i).filter(i => state.ayat[i]);
    if (!list.length) { toast('لا توجد آيات محفوظة بعد 🌱'); return; }
    stop(); stopSpeech(); const s = ++sid; busy = true; setBtns();
    for (const i of list) {
      cur = i; renderAyahBox(); lbl(`🎧 مراجعة المحفوظ: الآية ${ar(i + 1)}`);
      const ok = await playAyahAudio(i, qSession);
      if (s !== sid) return;
      if (!ok) { toast('نحتاج اتصالاً بالإنترنت 🌐'); break; }
      await qSleep(1200); if (s !== sid) return;
    }
    log('review', list.length); busy = false; setBtns(); lbl('✅ راجعتَ كل المحفوظ!'); confetti(80);
  }
  function renderAyahBox() {
    const a = AYAT[cur], box = document.getElementById('soAyah');
    if (!box) return;
    box.innerHTML = `<div class="ayah-emoji">${a.e}</div><div class="ayah-key">${a.k}</div>
      <p class="ayah">${a.w.map((w, j) => `<span class="aw" data-j="${j}">${w}</span>`).join(' ')} <span class="anum">${ar(cur + 1)}</span></p>
      ${window.glossHTML ? glossHTML(a) : ''}`;
    box.querySelectorAll('.aw').forEach(el => el.onclick = async () => { stop(); hl(+el.dataset.j); await playUrl(wordUrl(cur, +el.dataset.j)); hl(-1); });
    const sel = document.getElementById('soSel'); if (sel) sel.value = cur;
  }
  /* 🧩 رتّب الآية: الكلمات مبعثرة، يضغطها بالترتيب — التطبيق يصحّح */
  function arrange() {
    stop();
    const w = AYAT[cur].w, order = w.map((_, j) => j).sort(() => Math.random() - .5);
    let next = 0, miss = 0;
    const box = document.getElementById('soTool');
    const draw = () => {
      box.innerHTML = `<div class="so-arr">
        <p class="so-built ayah">${w.slice(0, next).join(' ') || '<span class="so-ph">اضغط الكلمة الأولى…</span>'}</p>
        <div class="so-words">${order.map(j => j < next ? '' : `<button class="so-w" data-j="${j}">${w[j]}</button>`).join('')}</div></div>`;
      box.querySelectorAll('.so-w').forEach(b => b.onclick = () => {
        const j = +b.dataset.j;
        if (j === next) {
          next++; playUrl(wordUrl(cur, j));
          if (next === w.length) {
            box.innerHTML = `<div class="so-arr"><p class="so-built ayah">${w.join(' ')}</p><p class="so-ok">${miss ? `🌟 رتّبتها! (${ar(miss)} محاولة خاطئة)` : '🏆 رتّبتها من أول مرة!'}</p>
              <div class="controls m-center"><button class="btn primary" id="soArr2">🔁 مرة ثانية</button></div></div>`;
            document.getElementById('soArr2').onclick = arrange;
            log('arrange', miss); confetti(miss ? 50 : 120);
            if (window.FamilyPass) { FamilyPass.progress('arrange'); FamilyPass.xp(miss ? 150 : 250, '🧩'); }
            return;
          }
          draw();
        } else { miss++; b.classList.add('so-bad'); setTimeout(() => b.classList.remove('so-bad'), 500); }
      });
    };
    draw();
  }
  /* 🎙️ سجّل تسميعك: يسمّع من حفظه ويسجّل، ثم يسمع نفسه ويقارن بالشيخ. التسجيل يُرسل ليسمعه عبدالله أو أخته */
  let mr = null;
  function recordUI(msg) {
    stop();
    const box = document.getElementById('soTool');
    box.innerHTML = `<div class="so-arr">
      <p>🙈 غطِّ الآية، ثم اضغط «ابدأ» وسمّع الآية ${ar(cur + 1)} من حفظك.</p>
      ${typeof msg === 'string' ? `<p class="so-ok">${msg}</p>` : ''}
      <div class="controls m-center"><button class="btn primary" id="soRecGo">${mr ? '⏹ انتهيت' : '🔴 ابدأ التسجيل'}</button></div>
      <div id="soRecOut"></div></div>`;
    document.getElementById('soRecGo').onclick = toggleRec;
    if (!mr) panel.querySelector('#soAyah').classList.add('so-cover');
  }
  async function toggleRec() {
    if (mr) { mr.stop(); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { recordUI('نحتاج إذن الميكروفون 🎤'); return; }
    const chunks = [], ayah = cur;
    mr = new MediaRecorder(stream);
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = () => {
      stream.getTracks().forEach(t => t.stop()); mr = null;
      panel.querySelector('#soAyah').classList.remove('so-cover');
      const blob = new Blob(chunks, { type: chunks[0] && chunks[0].type || 'audio/mp4' });
      const url = URL.createObjectURL(blob);
      recordUI('✅ سجّلتها! اسمع نفسك ثم اسمع الشيخ وقارن.');
      document.getElementById('soRecOut').innerHTML = `<audio controls src="${url}"></audio>
        <div class="controls m-center"><button class="btn blue" id="soSheikh">🔊 اسمع الشيخ</button></div>`;
      document.getElementById('soSheikh').onclick = () => playAyahAudio(ayah, qSession);
      log('record', 1);
      if (window.FamilyPass) { FamilyPass.progress('record'); FamilyPass.xp(200, '🎙️'); }
      if (blob.size < 700000 && window.JEHAD_SYNC) {
        const fr = new FileReader();
        fr.onload = () => fetch(`${JEHAD_SYNC.url}/api/mutation`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'records:put', format: 'json', args: { path: `jehad-rec/${today()}-${ayah + 1}-${Date.now()}`,
            data: { kid: 'jehad', date: today(), ayah: ayah + 1, surah: QN, d: fr.result } } }) }).catch(() => {});
        fr.readAsDataURL(blob);
      }
    };
    mr.start(); recordUI();
    setTimeout(() => { if (mr) mr.stop(); }, 60000);
  }
  function render() {
    if (cur === null) cur = defAyah();
    const mins = state.soloLog.filter(x => x.date === today()).length;
    panel.innerHTML = `
      <article class="card">
        <h2>🎧 أتدرّب وحدي — ${QN}</h2>
        <p class="sub">استمع وردّد بصوت عالٍ. التسميع من حفظك يكون مع أختك في «مهمتي» 🚀</p>
        <div class="controls"><label class="so-lbl">الآية:
          <select id="soSel" class="so-sel">${AYAT.map((_, i) => `<option value="${i}">${ar(i + 1)}${state.ayat[i] ? ' ✅' : ''}${state.qNew && state.qNew.i === i ? ' ⭐' : ''}</option>`).join('')}</select></label></div>
        <div class="ayah-box" id="soAyah"></div>
        <div class="repeat" id="soLbl"></div>
        <div class="controls m-center">${[3, 5, 10].map(n => `<button class="ptab ${n === times ? 'active' : ''}" data-n="${n}">${ar(n)} مرات</button>`).join('')}</div>
        <div class="controls">
          <button class="btn primary" id="soLoop">🔁 اسمع وردّد</button>
          <button class="btn blue" id="soBuild">🧱 احفظها بالبناء</button>
          <button class="btn" id="soList">🎧 راجع كل محفوظي</button>
          <button class="btn" id="soStop" style="display:none">⏹ إيقاف</button>
        </div>
        <div class="controls">
          <button class="btn primary" id="soArr">🧩 رتّب الآية</button>
          <button class="btn blue" id="soRec">🎙️ سجّل تسميعك</button>
        </div>
        <div id="soTool"></div>
        <p class="note">${mins ? `👏 تدرّبت اليوم ${ar(mins)} ${mins > 2 ? 'مرات' : 'مرة'}.` : '🌱 لم تتدرّب اليوم بعد.'} الاستماع قبل النوم يثبّت الحفظ.</p>
      </article>`;
    renderAyahBox();
    document.getElementById('soSel').onchange = e => { stop(); cur = +e.target.value; renderAyahBox(); };
    panel.querySelectorAll('.ptab').forEach(b => b.onclick = () => { times = +b.dataset.n; panel.querySelectorAll('.ptab').forEach(x => x.classList.toggle('active', x === b)); });
    document.getElementById('soLoop').onclick = loop;
    document.getElementById('soBuild').onclick = build;
    document.getElementById('soList').onclick = playlist;
    document.getElementById('soArr').onclick = arrange;
    document.getElementById('soRec').onclick = recordUI;
    document.getElementById('soStop').onclick = stop;
  }
  const origShow = window.showTab;
  window.showTab = function (id) { if (id !== 'solo' && busy) stop(); return origShow(id); };
  if (state.tab === 'solo') { showTab('solo'); render(); }
})();
