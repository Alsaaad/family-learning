/* =========================================================
   🗺️ رحلتي — المراحل
   القراءة: كل مرحلة = مستوى قصص. تكتمل المرحلة حين تُنجَز كل قصصها
   (والمهمة تحسب «أنهى القصة» تلقائيًا: ٣ أخطاء أو أقل).
   القرآن: سورة الأعلى في ٤ أجزاء، يكتمل الجزء حين تُحفظ آياته.
   المهمة اليومية تأخذ قصصها من المرحلة الحالية تلقائيًا.
   ========================================================= */
(() => {
  const READ = [
    { icon: '🌱', name: 'المرحلة ١', desc: 'كلمات قصيرة', level: 0 },
    { icon: '🌿', name: 'المرحلة ٢', desc: 'المدود و«ال»', level: 1 },
    { icon: '🌳', name: 'المرحلة ٣', desc: 'التنوين والشدّة', level: 2 },
    { icon: '🏆', name: 'المرحلة ٤', desc: 'القارئ البطل', level: null }
  ];
  const QN = (window.JEHAD_QURAN || {}).name || 'القرآن';
  const QPARTS = (() => { const out = []; for (let a = 0; a < AYAT.length; a += 5) out.push([a, Math.min(a + 4, AYAT.length - 1)]); return out; })();

  const lvlStories = l => STORIES.filter(s => s.level === l);
  const readDone = st => st.level !== null && lvlStories(st.level).length > 0 && lvlStories(st.level).every(s => state.stories[s.id]);

  function readInfo() {
    let ci = READ.findIndex(st => st.level === null || !readDone(st));
    if (ci < 0) ci = READ.length - 1;
    return READ.map((st, i) => {
      const l = st.level === null ? [] : lvlStories(st.level);
      return Object.assign({}, st, {
        done: i < ci, cur: i === ci, locked: i > ci,
        have: l.filter(s => state.stories[s.id]).length, total: l.length
      });
    });
  }
  function quranInfo() {
    const ci = QPARTS.findIndex(([a, b]) => { for (let i = a; i <= b; i++) if (!state.ayat[i]) return true; return false; });
    return QPARTS.map(([a, b], i) => {
      let have = 0;
      for (let k = a; k <= b; k++) if (state.ayat[k]) have++;
      return { icon: '🌙', name: `الآيات ${ar(a + 1)}–${ar(b + 1)}`, done: ci === -1 || i < ci, cur: i === ci,
               locked: ci !== -1 && i > ci, have, total: b - a + 1 };
    });
  }

  /** مستوى القصص الحالي (للمهمة اليومية) */
  window.currentReadingLevel = () => {
    const c = readInfo().find(x => x.cur);
    return c && c.level !== null ? c.level : 2;
  };
  /** رقم المرحلة الحالية — لاكتشاف فتح مرحلة جديدة */
  window.stageIndexes = () => ({
    reading: readInfo().findIndex(x => x.cur),
    quran: quranInfo().findIndex(x => x.cur)
  });
  /** وصف نصي للمرحلة الحالية (لصفحة المتابعة) */
  window.JEHAD_STAGE_INFO = () => {
    const r = readInfo().find(x => x.cur), q = quranInfo().find(x => x.cur);
    return {
      reading: r ? `${r.name}: ${r.desc}` + (r.total ? ` (${ar(r.have)} من ${ar(r.total)} قصص)` : '') : '',
      quran: q ? `${QN} — ${q.name} (${ar(q.have)} من ${ar(q.total)} محفوظة)` : `أتمّ حفظ ${QN} 🏅`,
      readingIndex: readInfo().findIndex(x => x.cur),
      quranIndex: quranInfo().findIndex(x => x.cur)
    };
  };
  window.stageName = (track, i) => track === 'reading'
    ? (READ[i] ? `${READ[i].icon} ${READ[i].name}: ${READ[i].desc}` : '')
    : (QPARTS[i] ? `🌙 ${QN}: الآيات ${ar(QPARTS[i][0] + 1)}–${ar(QPARTS[i][1] + 1)}` : '');

  const node = (x, label) => `
    <div class="j-node ${x.done ? 'done' : ''} ${x.cur ? 'cur' : ''} ${x.locked ? 'locked' : ''}">
      <span class="j-ico">${x.done ? '✅' : x.locked ? '🔒' : x.icon}</span>
      <b>${label}</b>
      ${x.cur && x.total ? `<small>${ar(x.have)} من ${ar(x.total)}</small>` : ''}
      ${x.cur && x.level === null ? '<small>قريبًا ✨</small>' : ''}
    </div>`;

  window.journeyHTML = () => {
    const r = readInfo(), q = quranInfo();
    return `<div class="journey">
      <h3>🗺️ رحلتي</h3>
      <p class="j-lbl">📖 القراءة</p>
      <div class="j-path">${r.map(x => node(x, `${x.name}<small>${x.desc}</small>`)).join('<span class="j-link"></span>')}</div>
      <p class="j-lbl">🌙 ${QN}</p>
      <div class="j-path">${q.map(x => node(x, x.name)).join('<span class="j-link"></span>')}</div>
    </div>`;
  };
})();
