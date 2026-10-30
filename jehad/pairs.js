/* =========================================================
   حروف تتشابه — تدريب على التمييز
   جهاد ينطق «غ» مثل «ع»، ويخلط بين «ث» و«ذ» — وقت القراءة فقط (نطقه في الكلام سليم).
   إذن المشكلة في ربط الشكل المكتوب بالصوت، لا في النطق.
   لذلك الوضع الأساسي: «👀 اقرأ واختر» — يقرأ الكلمة المكتوبة ثم يختار صورتها.
   الوضع الثاني: «👂 اسمع واختر».
   لإضافة زوج جديد: أضف عنصرًا إلى PAIRS بنفس الشكل.
   ========================================================= */
(() => {
  const PAIRS = [
    {
      a: 'ع', b: 'غ',
      cueA: 'بلا نقطة',
      cueB: 'نقطة فوقه مثل الغيمة فوق ☁️ — وصوته مثل الغرغرة 💦',
      wordsA: [{ word: 'عِنَبٌ', emoji: '🍇' }, { word: 'عَيْنٌ', emoji: '👁️' }, { word: 'عُصْفُورٌ', emoji: '🐦' }],
      wordsB: [{ word: 'غَيْمَةٌ', emoji: '☁️' }, { word: 'غَزَالٌ', emoji: '🦌' }, { word: 'غُصْنٌ', emoji: '🌿' }]
    },
    {
      a: 'ث', b: 'ذ',
      cueA: '«ثَلَاث» نقاط — مثل أول حرف في كلمة ثَلَاث 🔺 — هواء فقط 🌬️',
      cueB: 'نقطة واحدة فوق الدال — الحلق يهتز 🐝',
      wordsA: [{ word: 'ثَعْلَبٌ', emoji: '🦊' }, { word: 'ثَلْجٌ', emoji: '❄️' }, { word: 'ثُومٌ', emoji: '🧄' }],
      wordsB: [{ word: 'ذُرَةٌ', emoji: '🌽' }, { word: 'ذِئْبٌ', emoji: '🐺' }, { word: 'ذَهَبٌ', emoji: '🥇' }]
    }
  ];
  const panel = document.getElementById('letters');
  if (!panel || !PAIRS.length) return;
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <h2>👀 حروف تتشابه</h2>
    <p class="sub">قبل أن تقرأ: انظر للنقاط وعُدّها بإصبعك 👆</p>
    <div class="pair-tabs" id="pairTabs"></div>
    <div class="pair-cues" id="pairCues"></div>
    <div class="pair-tabs" id="modeTabs"></div>
    <div class="game-emoji" id="pEmoji"></div>
    <div class="controls"><button class="btn blue" id="pHear">🔊 اسمع الكلمة</button><button class="btn" id="pNext">🔀 كلمة أخرى</button></div>
    <div class="choices two" id="pChoices"></div>
    <p class="pword" id="pWord"></p>`;
  panel.appendChild(card);

  let pIdx = 0, mode = 'read', target = null, right = 0;
  const firstLetter = w => {
    const m = w.match(/^(.[ً-ٰٟ]*)(.*)$/u);
    return m ? `<span class="first">${m[1]}</span>${m[2]}` : w;
  };

  function renderPair() {
    $('#pairTabs').innerHTML = PAIRS.map((p, i) =>
      `<button class="ptab ${i === pIdx ? 'active' : ''}" data-i="${i}">${p.a} / ${p.b}</button>`).join('');
    $$('#pairTabs .ptab').forEach(b => b.onclick = () => { stopSpeech(); pIdx = +b.dataset.i; renderPair(); newRound(); });
    const p = PAIRS[pIdx];
    $('#pairCues').innerHTML = [[p.a, p.cueA, p.wordsA[0]], [p.b, p.cueB, p.wordsB[0]]].map(([l, c, w]) =>
      `<button class="cue" data-say="${w.word}"><span class="fch">${l}</span><span class="cue-ico">${w.emoji}</span><small>${w.word}</small><p>${c}</p></button>`).join('');
    $$('#pairCues .cue').forEach(b => b.onclick = () => { stopSpeech(); speak(b.dataset.say); });
    $('#modeTabs').innerHTML = [['read', '👀 اقرأ واختر الصورة'], ['hear', '👂 اسمع واختر الحرف']].map(([m, t]) =>
      `<button class="ptab ${m === mode ? 'active' : ''}" data-m="${m}">${t}</button>`).join('');
    $$('#modeTabs .ptab').forEach(b => b.onclick = () => { stopSpeech(); mode = b.dataset.m; renderPair(); newRound(); });
  }

  function win(b) {
    b.classList.add('right');
    $$('#pChoices .choice').forEach(x => x.disabled = true);
    $('#pWord').innerHTML = firstLetter(target.word);
    stopSpeech(); speak(target.word);
    right++;
    if (right % 3 === 0) award(1, 'عيونك تميّز الحروف! ٣ إجابات صحيحة 👀🎯');
    else { confetti(50); toast('أحسنت! 👏'); }
    setTimeout(newRound, 2300);
  }

  function newRound() {
    const p = PAIRS[pIdx];
    const A = p.wordsA.map(w => Object.assign({ l: p.a }, w));
    const B = p.wordsB.map(w => Object.assign({ l: p.b }, w));
    const pool = [...A, ...B];
    let t;
    do { t = pick(pool); } while (pool.length > 1 && target && t.word === target.word);
    target = t;
    $('#pWord').textContent = '';

    if (mode === 'read') {
      // يرى الكلمة مكتوبة (بلا صورة ولا صوت) ويختار صورتها من صورتين تبدآن بالحرفين المتشابهين
      const other = pick(t.l === p.a ? B : A);
      $('#pEmoji').innerHTML = `<span class="pread">${t.word}</span>`;
      $('#pHear').style.display = 'none';
      $('#pChoices').innerHTML = shuffle([t, other]).map(x =>
        `<button class="choice" data-w="${x.word}">${x.emoji}</button>`).join('');
      $$('#pChoices .choice').forEach(b => b.onclick = () => {
        if (b.dataset.w === target.word) win(b);
        else { b.classList.add('try'); b.disabled = true; toast('انظر للنقاط مرة ثانية 👀'); }
      });
    } else {
      $('#pEmoji').textContent = t.emoji;
      $('#pHear').style.display = '';
      $('#pChoices').innerHTML = shuffle([p.a, p.b]).map(l => `<button class="choice" data-l="${l}">${l}</button>`).join('');
      $$('#pChoices .choice').forEach(b => b.onclick = () => {
        if (b.dataset.l === target.l) win(b);
        else { b.classList.add('try'); b.disabled = true; toast('اسمعها مرة ثانية 👂'); stopSpeech(); speak(target.word); }
      });
    }
  }
  $('#pHear').onclick = () => { if (target) { stopSpeech(); speak(target.word); } };
  $('#pNext').onclick = newRound;
  renderPair();
  newRound();
})();
