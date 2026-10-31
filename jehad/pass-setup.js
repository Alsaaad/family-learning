/* 🎮 ربط الباتل باس بلوحة جهاد: النجوم ← XP، والمهام اليومية/الأسبوعية */
(() => {
  if (!window.FamilyPass) return;
  FamilyPass.init({
    kid: 'jehad', name: 'باتل باس جهاد',
    load: () => state.pass, save: d => { state.pass = d; save(); },
    host: document.querySelector('.hero-side'),
    quests: [
      { id: 'mission', icon: '🚀', title: 'أنهِ مهمة اليوم', xp: 500 },
      { id: 'story', icon: '📖', title: 'أنهِ قصة', xp: 300 },
      { id: 'quran', icon: '🌙', title: 'سمّع آية من حفظك صح', xp: 300 },
      { id: 'listen', icon: '🎧', title: 'تدرّب وحدك على القرآن (وحدي)', xp: 200 }
    ],
    weekly: [
      { id: 'mission', icon: '🔥', title: 'أنهِ ٥ مهام هذا الأسبوع', xp: 2000, goal: 5 },
      { id: 'memorize', icon: '🏅', title: 'احفظ آيتين جديدتين', xp: 1500, goal: 2 },
      { id: 'practice', icon: '🎯', title: 'تدرّب على الحروف المتشابهة ٣ مرات', xp: 800, goal: 3 }
    ]
  });
  const orig = window.award;
  window.award = function (stars, msg, big) {
    orig(stars, msg, big);
    if (stars) FamilyPass.xp(stars * 100, '⭐'.repeat(Math.min(stars, 5)));
    if (/٣ إجابات|عيونك تميّز/.test(msg || '')) FamilyPass.progress('practice');
  };
})();
/* مكافأة البداية: نجومه السابقة تتحوّل إلى XP مرة واحدة (بعد وصول التقدّم من السحابة) */
setTimeout(() => {
  if (!window.FamilyPass) return;
  const d = FamilyPass.data();
  if (!d.bonus && state.stars > 0) { d.bonus = true; FamilyPass.xp(state.stars * 50, 'مكافأة نجومك السابقة'); }
}, 4000);
