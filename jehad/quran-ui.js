/* =========================================================
   القرآن الكريم — آية واحدة، وكلمة كلمة
   - اضغط أي كلمة: تسمعها وحدها
   - «كلمة كلمة»: كل كلمة ثم وقفة ليردّدها
   - «احفظها بالبناء»: الكلمة ١، ثم ١+٢، ثم ١+٢+٣ … حتى تكتمل الآية (الحفظ التراكمي)
   يعتمد على: AYAT  state save ar $ $$ toast confetti award stopSpeech
   ========================================================= */
const QDATA = window.JEHAD_QURAN || { ayat: [], wordAudioBase: '' };
const RECITERS = ['Husary_Muallim_128kbps', 'Husary_128kbps', 'Alafasy_128kbps'];
let reciterIdx = 0, hiddenCount = 0, qSession = 0, playing = false;
const qAudio = new Audio(); qAudio.preload = 'auto';
const ayahUrl = i => `https://everyayah.com/data/${RECITERS[reciterIdx]}/${String(QDATA.surah || 87).padStart(3, '0')}${String(i + 1).padStart(3, '0')}.mp3`;
/* خطوات «البناء»: الآية القصيرة كلمة ثم كلمتين… والطويلة (أكثر من ٦ كلمات) تُبنى نصفًا نصفًا ثم كاملة */
function buildSteps(n) {
  const steps = [];
  const cum = (from, to) => { for (let e = from; e <= to; e++) steps.push([from, e]); };
  if (n <= 6) cum(0, n - 1);
  else { const h = Math.ceil(n / 2); cum(0, h - 1); cum(h, n - 1); steps.push([0, n - 1]); }
  return steps;
}
const wordUrl = (i, j) => QDATA.wordAudioBase + AYAT[i].a[j];
const qSleep = ms => new Promise(r => setTimeout(r, ms));
const MODE_BTNS = ['listenAyah', 'repeatAyah', 'wordsAyah', 'buildAyah'];

function playUrl(url) {
  return new Promise(res => {
    qAudio.onended = () => res(true);
    qAudio.onerror = () => res(false);
    qAudio.src = url;
    const p = qAudio.play();
    if (p && p.catch) p.catch(() => res(false));
  });
}
async function playAyahAudio(i, sid) {
  for (let r = reciterIdx; r < RECITERS.length; r++) {
    reciterIdx = r;
    const ok = await playUrl(ayahUrl(i));
    if (sid !== qSession || ok) return true;
  }
  reciterIdx = 0;
  return false;
}
function glossHTML(a) {
  const g = (a && a.g) || [];
  if (!g.length) return '';
  return `<div class="gloss"><b>💡 معاني الكلمات</b>${g.map(x =>
    `<div class="gl"><span class="gl-e">${x.e}</span><span class="gl-w">${x.w}</span><span class="gl-m">${x.m}</span></div>`).join('')}</div>`;
}
function markWord(j) {
  $$('#ayahText .aw').forEach((el, k) => el.classList.toggle('on', k === j));
}
function setPlayingUI(on, active) {
  playing = on;
  $('#ayahBox').classList.toggle('playing', on);
  MODE_BTNS.forEach(id => {
    const b = $('#' + id); if (!b) return;
    if (!b.dataset.label) b.dataset.label = b.textContent;
    b.textContent = (on && id === active) ? '⏹ إيقاف' : b.dataset.label;
  });
  if (!on) $('#repeatLbl').textContent = '';
}
function stopAyah() { qSession++; qAudio.pause(); markWord(-1); setPlayingUI(false); }

async function runMode(mode, btn) {
  if (playing) { stopAyah(); return; }
  stopSpeech();
  const sid = ++qSession;
  setPlayingUI(true, btn);
  const i = state.ayah, n = AYAT[i].w.length;
  const label = t => { if (sid === qSession) $('#repeatLbl').textContent = t; };
  const offline = () => toast('نحتاج اتصالاً بالإنترنت لسماع التلاوة 🌐');
  try {
    if (mode === 'once' || mode === 'three') {
      const times = mode === 'once' ? 1 : 3;
      for (let k = 1; k <= times; k++) {
        label(times > 1 ? `🔁 التكرار ${ar(k)} من ${ar(times)}` : '🎧 استمع وردّد');
        const ok = await playAyahAudio(i, sid);
        if (sid !== qSession) return;
        if (!ok) { offline(); break; }
        if (k < times) await qSleep(1200);
      }
      if (sid === qSession && times > 1) toast('أحسنت الاستماع! جرّب أن تردّدها وحدك 🌙');
    } else if (mode === 'words') {
      for (let j = 0; j < n; j++) {
        markWord(j);
        label(`🗣️ ردّد بعده — الكلمة ${ar(j + 1)} من ${ar(n)}`);
        const ok = await playUrl(wordUrl(i, j));
        if (sid !== qSession) return;
        if (!ok) { offline(); break; }
        await qSleep(1700);
        if (sid !== qSession) return;
      }
    } else if (mode === 'build') {
      for (const [from, end] of buildSteps(n)) {
        label(from === end ? `🧱 اسمع وردّد: الكلمة ${ar(from + 1)}` : `🧱 اسمع وردّد: من الكلمة ${ar(from + 1)} إلى ${ar(end + 1)}`);
        for (let j = from; j <= end; j++) {
          markWord(j);
          const ok = await playUrl(wordUrl(i, j));
          if (sid !== qSession) return;
          if (!ok) { offline(); return; }
          await qSleep(120);
        }
        markWord(-1);
        label('🗣️ دورك! ردّدها الآن');
        await qSleep(1300 + 750 * (end - from + 1));
        if (sid !== qSession) return;
      }
      toast('بنيتَ الآية كلمة كلمة! جرّب تقرأها وحدك 🌟');
    }
  } finally {
    if (sid === qSession) { markWord(-1); setPlayingUI(false); }
  }
}
async function tapWord(j) {
  if (playing) stopAyah();
  stopSpeech();
  const sid = ++qSession;
  markWord(j);
  await playUrl(wordUrl(state.ayah, j));
  if (sid === qSession) markWord(-1);
}

function renderAyah() {
  if (!AYAT.length) { $('#ayahText').textContent = 'لم تُحمَّل السورة — تأكد من الإنترنت'; return; }
  if (state.ayah >= AYAT.length) state.ayah = 0;
  const i = state.ayah, a = AYAT[i];
  $('#qCount').textContent = `الآية ${ar(i + 1)} من ${ar(AYAT.length)} • حفظتُ ${ar(ayatDone())}`;
  $('#ayahEmoji').textContent = a.e;
  $('#ayahKey').textContent = a.k;
  const gb = document.getElementById('ayahGloss');
  if (gb) gb.innerHTML = glossHTML(a);
  const visibleUntil = a.w.length - hiddenCount;
  $('#ayahText').innerHTML = a.w.map((w, j) =>
    `<span class="aw ${j >= visibleUntil ? 'hid' : ''}" data-j="${j}">${w}</span>`).join(' ')
    + ` <span class="anum">${ar(i + 1)}</span>`;
  $$('#ayahText .aw').forEach(el => el.onclick = () => {
    if (el.classList.contains('hid')) el.classList.remove('hid');
    else tapWord(+el.dataset.j);
  });
  $('#dots').innerHTML = AYAT.map((_, j) =>
    `<button class="dot ${state.ayat[j] ? 'mem' : ''} ${j === i ? 'cur' : ''}" data-j="${j}" aria-label="الآية ${j + 1}">${ar(j + 1)}</button>`).join('');
  $$('.dot').forEach(d => d.onclick = () => goAyah(+d.dataset.j));
  $('#prevAyah').disabled = i === 0;
  $('#nextAyah').disabled = i === AYAT.length - 1;
  const mem = !!state.ayat[i];
  $('#memorized').textContent = mem ? '✅ محفوظة — راجعها لتثبت أكثر' : '✅ حفظتُ هذه الآية';
  $('#memorized').classList.toggle('again', mem);
}
function goAyah(i) {
  if (i < 0 || i >= AYAT.length) return;
  stopAyah(); state.ayah = i; hiddenCount = 0; save(); renderAyah();
}

$('#listenAyah').onclick = () => runMode('once', 'listenAyah');
$('#repeatAyah').onclick = () => runMode('three', 'repeatAyah');
$('#wordsAyah').onclick = () => runMode('words', 'wordsAyah');
$('#buildAyah').onclick = () => runMode('build', 'buildAyah');
$('#prevAyah').onclick = () => goAyah(state.ayah - 1);
$('#nextAyah').onclick = () => goAyah(state.ayah + 1);
$('#hideWord').onclick = () => {
  const total = AYAT[state.ayah].w.length;
  if (hiddenCount >= total) { toast('أخفينا الآية كلها! هل تستطيع قراءتها من حفظك؟ 🌟'); return; }
  hiddenCount++; renderAyah();
};
$('#showAll').onclick = () => { hiddenCount = 0; renderAyah(); };
$('#memorized').onclick = () => {
  const i = state.ayah;
  if (!state.ayat[i]) {
    state.ayat[i] = true;
    const n = ayatDone();
    const big = n === 5 || n === 10 || n === AYAT.length;
    award(1, n === AYAT.length ? `ما شاء الله! حفظت ${QDATA.name || 'السورة'} كاملة يا ${state.name} 🏅`
      : `بارك الله فيك! حفظت ${ar(n)} ${n <= 10 ? 'آيات' : 'آية'} 🌙`, big);
  } else {
    confetti(40); toast('المراجعة تثبّت الحفظ 👏');
  }
  renderAyah();
};
(() => {
  let x0 = null;
  const box = $('#ayahBox');
  box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) < 60) return;
    goAyah(state.ayah + (dx < 0 ? 1 : -1));
  });
})();

/* عند تغيير السورة: يُحفظ تقدّم السورة السابقة في الأرشيف، وتبدأ الجديدة من الصفر */
(function migrateSurah() {
  const S = QDATA.surah;
  if (!S || state.qSurah === S) return;
  state.quranArchive = state.quranArchive || {};
  const prev = state.qSurah || 87;
  if (Object.keys(state.ayat || {}).length || Object.keys(state.qIntro || {}).length)
    state.quranArchive[prev] = { ayat: state.ayat || {}, qIntro: state.qIntro || {}, ayahPass: state.ayahPass || {}, qNew: state.qNew || null };
  state.ayat = {}; state.qIntro = {}; state.ayahPass = {}; state.qNew = null; state.ayah = 0;
  state.qSurah = S; state.qSurahSince = QDATA.since || '';
  save();
})();
(function setTitle() {
  const h = document.querySelector('#quran h2');
  if (h && QDATA.name) h.textContent = QDATA.name + ' 🌙';
})();
renderAyah();
