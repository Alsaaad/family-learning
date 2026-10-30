/* =========================================================
   📡 المزامنة — يرسل نتيجة كل مهمة وصورة التقدّم لقاعدة البيانات
   حتى يتابع عبدالله عن بعد. إذا انقطع الإنترنت تُحفظ في طابور
   وتُرسل تلقائيًا عند عودة الاتصال أو عند فتح اللوحة.
   ========================================================= */
(() => {
  const C = window.JEHAD_SYNC;
  if (!C || !C.url || typeof fetch !== 'function') return;

  async function call(kind, path, args) {
    const r = await fetch(`${C.url}/api/${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args, format: 'json' })
    });
    const j = await r.json();
    if (j.status !== 'success') throw new Error(j.errorMessage || 'sync error');
    return j.value;
  }

  function progress() {
    const levels = (typeof LEVELS !== 'undefined' ? LEVELS : []).map((L, i) => ({
      name: L.name,
      done: STORIES.filter(s => s.level === i && state.stories[s.id]).length,
      total: STORIES.filter(s => s.level === i).length
    }));
    return {
      name: state.name,
      stars: state.stars || 0,
      streak: state.streak || 0,
      lastMission: state.lastMission || null,
      levels,
      storiesDone: STORIES.filter(s => state.stories[s.id]).map(s => stripMarks(s.title)),
      ayatDone: AYAT.map((_, i) => i).filter(i => state.ayat[i]).map(i => i + 1),
      ayatTotal: AYAT.length,
      surahName: (window.JEHAD_QURAN || {}).name || '',
      qNew: state.qNew ? state.qNew.i + 1 : null,
      trouble: (state.trouble || []).map(t => t.t),
      stage: window.JEHAD_STAGE_INFO ? window.JEHAD_STAGE_INFO() : null,
      lettersKnown: typeof lettersDone === 'function' ? lettersDone() : null,
      device: (navigator.userAgent.match(/iPad|iPhone|Android|Mac|Windows/) || ['?'])[0]
    };
  }

  let flushing = false;
  async function flush() {
    if (flushing) return;
    flushing = true;
    try {
      state.pendingReports = state.pendingReports || [];
      while (state.pendingReports.length) {
        const rep = state.pendingReports[0];
        await call('mutation', 'progress:report', {
          code: C.code, kid: C.kid, date: rep.date, summary: rep.summary,
          stats: rep.stats || {}, clientId: rep.clientId, progress: progress()
        });
        const idx = state.pendingReports.indexOf(rep);
        if (idx >= 0) state.pendingReports.splice(idx, 1);
        save();
      }
    } catch (e) { /* بلا إنترنت — نحاول لاحقًا */ }
    finally { flushing = false; }
  }

  /** يُستدعى من المهمة عند انتهائها (وعند اختيار المزاج) */
  window.syncReport = rep => {
    state.pendingReports = (state.pendingReports || []).filter(r => r.clientId !== rep.clientId).concat(rep).slice(-30);
    save();
    flush();
  };
  window.syncSnapshot = async () => {
    try { await call('mutation', 'progress:snapshot', { code: C.code, kid: C.kid, progress: progress() }); } catch (e) {}
  };

  addEventListener('online', flush);
  setTimeout(() => { flush().then(() => window.syncSnapshot()); }, 2500);
})();
