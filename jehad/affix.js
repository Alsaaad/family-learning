/* =========================================================
   🎨 تلوين زوائد الكلمة: قَلَمَ«هُ» — «وَ»فَرِحَ
   أُضيف بعد مهمة ٥ أكتوبر: جهاد يقرأ أول الكلمة ويخمّن آخرها من المعنى
   (قرأ «قَلَمَهُ» → «القلم»، و«فَرَسَهُ» → «الفرسه»، وتعثّر في «وَفَرِحَ»).
   تلوين الزائدة في آخر الكلمة أو أولها ينبّهه أن يقرأ حتى آخر حرف.
   ========================================================= */
(function () {
  // «وَ» العاطفة — تُضاف يدويًا لأن «و» قد تكون من أصل الكلمة (وَضَعَ، وَجَدَ)
  const PREFIX_WA = new Set(['وَفَرِحَ', 'وَلَعِبَ', 'وَضَحِكَ', 'وَقَفَزَ', 'وَأَضَاءَ', 'وَرَأَى', 'وَهَذَا', 'وَمَرَّ', 'وَهُوَ', 'وَمَرِحَ', 'وَلَبِسَ']);
  const MARK = /[ً-ٰٟ]/;
  const units = w => { const u = []; for (const ch of w) { if (MARK.test(ch) && u.length) u[u.length - 1] += ch; else u.push(ch); } return u; };

  function split(word) {
    const m = word.match(/^(.*?)([.,،!؟?:؛]*)$/);
    const core = m[1], tail = m[2];
    let pre = '', base = core, suf = '';
    if (/اللَّه|لِلَّه/.test(core)) return { pre, base, suf, tail };
    if (PREFIX_WA.has(core)) { const u = units(core); pre = u[0]; base = u.slice(1).join(''); }
    const bu = units(base);
    const last = bu[bu.length - 1] || '', prev = bu[bu.length - 2] || '';
    if (bu.length >= 3 && /^ه[ُِ]$/.test(last)) {            // ـهُ / ـهِ
      suf = last; base = bu.slice(0, -1).join('');
    } else if (bu.length >= 4 && /^هَ$/.test(prev) && last === 'ا') { // ـهَا
      suf = prev + last; base = bu.slice(0, -2).join('');
    }
    return { pre, base, suf, tail };
  }
  window.affixSplit = split;
  window.affixHTML = function (word) {
    const s = split(word);
    if (!s.pre && !s.suf) return word;
    return `${s.pre ? `<span class="afx">${s.pre}</span>` : ''}${s.base}${s.suf ? `<span class="afx">${s.suf}</span>` : ''}${s.tail}`;
  };
  window.affixHint = function (word) {
    const s = split(word);
    return (s.pre || s.suf) ? [s.pre, s.base, s.suf].filter(Boolean).join(' + ') : '';
  };
})();
