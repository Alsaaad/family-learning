/* =========================================================
   ☁️ تقدّم واحد على كل الأجهزة
   عند فتح اللوحة: يُرسل تقدّم هذا الجهاز ويُستلم التقدّم المدموج من السحابة.
   عند كل حفظ: يُرسل بعد ثانيتين. الدمج في الخادم يجمع الإنجازات من كل الأجهزة
   ولا يحذف شيئًا (قصة أنهاها على الآيفون تبقى منتهية على الآيباد).
   إعدادات الشاشة (حجم الخط، اللون، سرعة الصوت…) تبقى خاصة بكل جهاز.
   ========================================================= */
(() => {
  const C = window.JEHAD_SYNC;
  if (!C || !C.url || typeof fetch !== 'function' || typeof window.save !== 'function') return;
  const LOCAL = ['fs', 'grey', 'rate', 'tab', 'syl', 'pendingReports'];
  const origSave = window.save;

  async function merge() {
    const s = Object.assign({}, state);
    delete s.pendingReports;
    const r = await fetch(`${C.url}/api/mutation`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'kidState:mergeState', args: { code: C.code, kid: C.kid, state: s }, format: 'json' })
    });
    const j = await r.json();
    if (j.status !== 'success') throw new Error(j.errorMessage || 'merge error');
    return j.value;
  }
  function adopt(merged, initial) {
    if (!merged || typeof merged !== 'object') return;
    const keep = {};
    LOCAL.forEach(k => { if (k in state) keep[k] = state[k]; });
    const localMission = state.mission;
    Object.keys(merged).forEach(k => { state[k] = merged[k]; });
    Object.assign(state, keep);
    if (window.FamilyPass) FamilyPass.reload();
    if (!initial && localMission) state.mission = localMission; // لا نلمس مهمة جارية على هذا الجهاز
    origSave();
  }
  function refresh(full) {
    try {
      if (full) {
        if (window.renderAll) renderAll();
        if (window.reloadMission) reloadMission();
      } else if (window.renderProgress) renderProgress();
      if (window.renderAyah) renderAyah();
    } catch (e) { /* لا شيء */ }
  }

  let timer = null, busy = false, again = false;
  async function push() {
    if (busy) { again = true; return; }
    busy = true;
    try { adopt(await merge(), false); refresh(false); } catch (e) { /* بلا إنترنت: نحاول عند الحفظ التالي */ }
    busy = false;
    if (again) { again = false; push(); }
  }
  window.save = function () {
    origSave();
    clearTimeout(timer);
    timer = setTimeout(push, 2000);
  };
  window.cloudSyncNow = push;

  (async () => {
    try { adopt(await merge(), true); refresh(true); } catch (e) {}
  })();
  addEventListener('online', push);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') push(); });
})();
