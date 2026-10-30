/* =========================================================
   تقسيم الكلمة المشكولة إلى مقاطع: تَـ دَحْـ رَ جَتْ
   القاعدة: كل حرف عليه حركة (فتحة/ضمة/كسرة/تنوين) يبدأ مقطعًا جديدًا،
   والحرف الساكن أو حرف المد يلتحق بالمقطع الذي قبله.
   ========================================================= */
(function () {
  const MARK = /[ً-ٰٟۖ-ۭ]/;
  const VOWEL = /[ً-ِ]/;            // تنوين + فتحة ضمة كسرة
  const SUKUN = 'ْ';
  const TAT = 'ـ', ZWNJ = '‌';
  const NONJOIN = new Set(['ا', 'أ', 'إ', 'آ', 'ٱ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ة', 'ى', 'ء']);

  function units(word) {
    const u = [];
    for (const ch of word) {
      if (MARK.test(ch) && u.length) u[u.length - 1] += ch;
      else u.push(ch);
    }
    return u;
  }
  function syllables(word) {
    const m = word.match(/^(.*?)([.,،!؟?:؛»«"]*)$/);
    const core = m[1], tail = m[2];
    const out = [];
    units(core).forEach((u, idx) => {
      const startsNew = idx === 0 || (VOWEL.test(u) && !u.includes(SUKUN));
      if (startsNew || !out.length) out.push(u); else out[out.length - 1] += u;
    });
    if (tail && out.length) out[out.length - 1] += tail;
    return out;
  }
  function lastBase(s) {
    const chars = [...s].filter(c => !MARK.test(c) && !/[.,،!؟?:؛»«"]/.test(c));
    return chars[chars.length - 1];
  }
  window.syllables = syllables;
  window.sylHTML = function (word, on) {
    if (!on) return word;
    const parts = syllables(word);
    if (parts.length < 3) return word;
    return parts.map((p, k) => {
      const joins = k < parts.length - 1 && !NONJOIN.has(lastBase(p));
      return `<span class="sy sy${k % 2}">${p}${joins ? TAT : ''}</span>`;
    }).join(ZWNJ);
  };
})();
