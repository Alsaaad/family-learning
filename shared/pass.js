/* =========================================================
   🎮 باتل باس العائلة — نظام مكافآت على طريقة ألعاب الباتل رويال
   (شخصيات وأسماء من تصميمنا، ليست من أي لعبة حقيقية)
   - XP من المهام ← تفتح مستويات الموسم (٣٠ مستوى) ← كل مستوى فيه جائزة
   - مهام يومية وأسبوعية ← XP إضافي
   - عملات 🪙 ← متجر يتغيّر كل يوم
   - الخزانة: تلبس شخصية + حقيبة ظهر + رقصة + مظلة
   الاستخدام: FamilyPass.init({ kid, name, load, save, quests, weekly, host })
   ثم FamilyPass.xp(n, 'السبب') و FamilyPass.progress('questId')
   ========================================================= */
(() => {
  const RAR = {
    common: ['عادي', '#8E959C'], uncommon: ['غير شائع', '#3FA34D'], rare: ['نادر', '#2F80ED'],
    epic: ['ملحمي', '#9B51E0'], legendary: ['أسطوري', '#E8892B']
  };
  const SEASON = { n: 1, name: 'الموسم ١: أبطال الحروف', tiers: 30, xpPerTier: 1500 };

  /* ---------- الشخصيات (SVG من تصميمنا) ---------- */
  const SKINS = {
    rookie:  { name: 'المستكشف', r: 'common', c1: '#4A6FA5', c2: '#2E4A73', head: 'cap', em: '🧭' },
    green:   { name: 'الجندي الأخضر', r: 'uncommon', c1: '#4E8C3A', c2: '#2F5A22', head: 'cap', em: '🍃' },
    shadow:  { name: 'الظل', r: 'uncommon', c1: '#5B5F66', c2: '#2B2E33', head: 'mask', em: '🌑' },
    falcon:  { name: 'صقر الصحراء', r: 'rare', c1: '#C9A26B', c2: '#8A6A3D', head: 'hood', em: '🦅' },
    ice:     { name: 'قنّاص الجليد', r: 'rare', c1: '#7EC8E3', c2: '#3A7CA5', head: 'hood', em: '❄️', glow: '#BFF3FF' },
    robo:    { name: 'روبو-حرف', r: 'rare', c1: '#AEB8C2', c2: '#5D6D7E', head: 'visor', em: '⚡', glow: '#3CF2FF' },
    ninja:   { name: 'النينجا الليلي', r: 'epic', c1: '#3A2D5C', c2: '#16112A', head: 'ninja', em: '🌙', glow: '#C77DFF' },
    astro:   { name: 'رائد الفضاء', r: 'epic', c1: '#F2F2F2', c2: '#E07A1F', head: 'visor', em: '🚀', glow: '#FFB347' },
    lava:    { name: 'البركان', r: 'epic', c1: '#D7381E', c2: '#5A1308', head: 'helmet', em: '🔥', glow: '#FFC93C' },
    dragon:  { name: 'حارس التنين', r: 'legendary', c1: '#B3121D', c2: '#1B0A0C', head: 'mask', em: '🐉', glow: '#FFD23F' },
    knight:  { name: 'فارس النجوم', r: 'legendary', c1: '#1F3A93', c2: '#0B1640', head: 'helmet', em: '⭐', glow: '#FFD700' },
    hero:    { name: 'القارئ البطل', r: 'legendary', c1: '#E2B33C', c2: '#7A5A10', head: 'crown', em: '📖', glow: '#FFF3B0' },
    cyber:   { name: 'سايبر', r: 'epic', c1: '#0FB9B1', c2: '#1B1464', head: 'visor', em: '💠', glow: '#FF4FD8' },
    jungle:  { name: 'مغامر الغابة', r: 'rare', c1: '#6A994E', c2: '#386641', head: 'hood', em: '🐆' }
  };
  const BACKS = {
    bag: { name: 'حقيبة المغامر', r: 'common', e: '🎒' }, shield: { name: 'الدرع', r: 'uncommon', e: '🛡️' },
    swords: { name: 'سيفان', r: 'rare', e: '⚔️' }, wings: { name: 'جناحان', r: 'epic', e: '🪽' },
    minidragon: { name: 'تنين صغير', r: 'legendary', e: '🐲' }, moon: { name: 'الهلال', r: 'rare', e: '🌙' },
    jet: { name: 'حقيبة نفاثة', r: 'epic', e: '🚀' }, cat: { name: 'قطّ مرافق', r: 'uncommon', e: '🐱' }
  };
  const EMOTES = {
    wave: { name: 'التحية', r: 'common', e: '👋', a: 'fp-wiggle' }, jump: { name: 'قفزة النصر', r: 'uncommon', e: '🙌', a: 'fp-jump' },
    spin: { name: 'الدوّامة', r: 'rare', e: '🌀', a: 'fp-spin' }, robot: { name: 'رقصة الروبوت', r: 'epic', e: '🤖', a: 'fp-robot' },
    flex: { name: 'العضلات', r: 'uncommon', e: '💪', a: 'fp-jump' }, star: { name: 'نجم المسرح', r: 'legendary', e: '🌟', a: 'fp-spin' }
  };
  const GLIDERS = {
    umbrella: { name: 'المظلة', r: 'common', e: '☂️' }, kite: { name: 'الطائرة الورقية', r: 'uncommon', e: '🪁' },
    rocket: { name: 'الصاروخ', r: 'epic', e: '🚀' }, dragon: { name: 'التنين الطائر', r: 'legendary', e: '🐉' },
    balloon: { name: 'المنطاد', r: 'rare', e: '🎈' }
  };
  const CAT = { skin: SKINS, back: BACKS, emote: EMOTES, glider: GLIDERS };
  const CAT_NAME = { skin: 'شخصية', back: 'حقيبة ظهر', emote: 'رقصة', glider: 'مظلة', coins: 'عملات' };
  const item = id => { const [c, k] = id.split(':'); return CAT[c] && CAT[c][k] ? Object.assign({ id, cat: c, key: k }, CAT[c][k]) : null; };

  /* المستويات: جائزة لكل مستوى */
  const TIERS = ['emote:wave', 'coins:100', 'back:bag', 'skin:green', 'coins:100', 'glider:kite', 'emote:jump', 'back:cat',
    'coins:150', 'skin:falcon', 'emote:flex', 'back:moon', 'coins:150', 'glider:balloon', 'skin:ice', 'coins:200',
    'back:swords', 'emote:spin', 'skin:ninja', 'coins:200', 'glider:rocket', 'back:wings', 'emote:robot', 'skin:astro',
    'coins:300', 'back:jet', 'skin:lava', 'glider:dragon', 'back:minidragon', 'skin:knight'];
  const SHOP = [['skin:shadow', 400], ['skin:robo', 800], ['skin:jungle', 800], ['skin:cyber', 1200], ['skin:dragon', 2000],
    ['skin:hero', 2000], ['emote:star', 900], ['back:shield', 300], ['glider:umbrella', 200]];

  /* ---------- الرسم ---------- */
  function avatarSVG(skinKey, size = 120, backKey) {
    const s = SKINS[skinKey] || SKINS.rookie, g = s.glow || '#FFFFFF';
    const head = {
      cap: `<path d="M34 38 Q60 14 86 38 L90 42 L30 42 Z" fill="${s.c2}"/><rect x="58" y="38" width="38" height="6" rx="3" fill="${s.c2}"/>`,
      hood: `<path d="M26 60 Q24 14 60 12 Q96 14 94 60 L86 50 Q60 30 34 50 Z" fill="${s.c2}"/>`,
      mask: `<rect x="36" y="44" width="48" height="14" rx="7" fill="${s.c2}"/>`,
      ninja: `<path d="M30 40 Q60 8 90 40 L90 60 Q60 72 30 60 Z" fill="${s.c2}"/><rect x="38" y="44" width="44" height="12" rx="6" fill="#F3D5B5"/>`,
      visor: `<circle cx="60" cy="48" r="30" fill="${s.c1}" stroke="${s.c2}" stroke-width="4"/><rect x="38" y="38" width="44" height="22" rx="11" fill="${s.c2}"/><rect x="42" y="42" width="36" height="14" rx="7" fill="${g}" opacity=".85"/>`,
      helmet: `<path d="M30 52 Q30 16 60 16 Q90 16 90 52 L82 52 L82 44 L38 44 L38 52 Z" fill="${s.c2}"/><rect x="56" y="10" width="8" height="14" rx="3" fill="${g}"/>`,
      crown: `<path d="M34 32 L42 14 L52 28 L60 10 L68 28 L78 14 L86 32 Z" fill="${g}" stroke="${s.c2}" stroke-width="2"/>`
    }[s.head] || '';
    const eyes = (s.head === 'visor') ? '' : (s.head === 'ninja' || s.glow && s.head === 'mask')
      ? `<circle cx="50" cy="50" r="3.5" fill="${g}"/><circle cx="70" cy="50" r="3.5" fill="${g}"/>`
      : `<circle cx="50" cy="51" r="3" fill="#1A1A2E"/><circle cx="70" cy="51" r="3" fill="#1A1A2E"/><path d="M52 61 Q60 66 68 61" stroke="#1A1A2E" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    const back = backKey && BACKS[backKey] ? `<text x="96" y="92" font-size="30" text-anchor="middle">${BACKS[backKey].e}</text>` : '';
    return `<svg viewBox="0 0 120 140" width="${size}" height="${size * 140 / 120}" aria-hidden="true">
      ${back}
      <path d="M22 140 Q22 84 60 82 Q98 84 98 140 Z" fill="${s.c1}"/>
      <path d="M44 84 L60 104 L76 84" fill="${s.c2}"/>
      <circle cx="60" cy="118" r="11" fill="${s.c2}"/><text x="60" y="123" font-size="13" text-anchor="middle">${s.em}</text>
      ${s.head === 'visor' ? '' : `<circle cx="60" cy="50" r="28" fill="#F3D5B5"/>`}
      ${head}${eyes}
    </svg>`;
  }
  function iconOf(it, size = 70) {
    if (it.cat === 'skin') return avatarSVG(it.key, size);
    if (it.cat === 'coins') return `<span class="fp-big" style="font-size:${size * .5}px">🪙</span>`;
    return `<span class="fp-big" style="font-size:${size * .55}px">${it.e}</span>`;
  }

  /* ---------- الحالة ---------- */
  let C = null, D = null, root = null;
  const today = () => new Date().toLocaleDateString('en-CA');
  const weekOf = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 1) % 7)); return d.toLocaleDateString('en-CA'); }; // يبدأ السبت
  const fresh = () => ({ season: 1, xp: 0, coins: 0, owned: ['skin:rookie'], eq: { skin: 'rookie', back: null, emote: null, glider: null },
    q: { date: today(), p: {}, done: [] }, w: { date: weekOf(), p: {}, done: [] }, rev: 0, seen: 0 });
  const tierOf = xp => Math.min(SEASON.tiers, Math.floor(xp / SEASON.xpPerTier));
  function data() {
    if (!D) D = Object.assign(fresh(), C.load() || {});
    if (D.q.date !== today()) D.q = { date: today(), p: {}, done: [] };
    if (D.w.date !== weekOf()) D.w = { date: weekOf(), p: {}, done: [] };
    return D;
  }
  function commit() { D.rev = (D.rev || 0) + 1; D.at = Date.now(); C.save(D); renderChip(); }

  function grant(id) {
    const d = data();
    if (id.startsWith('coins:')) { d.coins += +id.split(':')[1]; return; }
    if (!d.owned.includes(id)) d.owned.push(id);
  }
  function xp(n, reason) {
    if (!C || !n) return;
    const d = data(), before = tierOf(d.xp);
    d.xp += Math.round(n);
    const after = tierOf(d.xp);
    const won = [];
    for (let t = before + 1; t <= after; t++) { const id = TIERS[t - 1]; if (id) { grant(id); won.push({ t, id }); } }
    commit();
    floatXP(n, reason);
    if (won.length) setTimeout(() => later(() => levelUp(won)), 900);
  }
  function progress(qid, inc = 1) {
    if (!C) return;
    const d = data();
    [[C.quests, d.q], [C.weekly || [], d.w]].forEach(([list, st]) => list.forEach(q => {
      const k = q.key || q.id;
      if (q.id !== qid || st.done.includes(k)) return;
      st.p[k] = (st.p[k] || 0) + inc;
      if (st.p[k] >= (q.goal || 1)) { st.done.push(k); setTimeout(() => { toastFP(`✅ مهمة: ${q.title} (+${q.xp} XP)`); xp(q.xp); }, 600); }
    }));
    commit();
  }

  /* ---------- الواجهة ---------- */
  function renderChip() {
    const el = document.getElementById('fpChip'); if (!el || !D) return;
    const t = tierOf(D.xp), pct = Math.round((D.xp % SEASON.xpPerTier) / SEASON.xpPerTier * 100);
    el.innerHTML = `<span class="fp-chip-av">${avatarSVG(D.eq.skin, 38)}</span>
      <span class="fp-chip-t"><b>المستوى ${t}</b><i><u style="width:${t >= SEASON.tiers ? 100 : pct}%"></u></i></span>
      <span class="fp-chip-c">🪙 ${D.coins}</span>`;
  }
  function floatXP(n, reason) {
    const f = document.createElement('div'); f.className = 'fp-float';
    f.textContent = `+${n} XP${reason ? ' • ' + reason : ''}`;
    document.body.appendChild(f); setTimeout(() => f.remove(), 2200);
  }
  function toastFP(m) { const f = document.createElement('div'); f.className = 'fp-float fp-q'; f.textContent = m; document.body.appendChild(f); setTimeout(() => f.remove(), 3000); }

  const queue = [];
  const later = fn => { if (root) queue.push(fn); else fn(); };
  function overlay(html, cls = '') {
    if (root) { root.remove(); root = null; }
    root = document.createElement('div'); root.className = 'fp-wrap ' + cls;
    root.innerHTML = `<div class="fp-box">${html}</div>`;
    root.addEventListener('click', e => { if (e.target === root || e.target.closest('[data-fp-close]')) close(); });
    document.body.appendChild(root);
    return root;
  }
  function close() { if (root) { root.remove(); root = null; } if (queue.length) setTimeout(queue.shift(), 250); }

  function levelUp(won) {
    const last = won[won.length - 1], it = item(last.id) || { cat: 'coins', name: last.id.split(':')[1] + ' عملة', r: 'common' };
    const rr = RAR[it.r] || RAR.common, g = GLIDERS[data().eq.glider];
    overlay(`
      ${g ? `<div class="fp-glide">${g.e}</div>` : ''}
      <div class="fp-lvl">⬆️ المستوى ${last.t}</div>
      <div class="fp-reveal" style="--rc:${rr[1]}">${iconOf(it, 130)}</div>
      <h2>${it.name}</h2>
      <p class="fp-rar" style="color:${rr[1]}">${rr[0]} • ${CAT_NAME[it.cat]}</p>
      ${won.length > 1 ? `<p>وفتحت ${won.length} مستويات! 🎉</p>` : ''}
      <div class="fp-row">${it.cat !== 'coins' ? `<button class="fp-btn fp-pri" id="fpEquip">البسها الآن</button>` : ''}
      <button class="fp-btn" data-fp-close>رائع!</button></div>`, 'fp-celebrate');
    const b = document.getElementById('fpEquip');
    if (b) b.onclick = () => { equip(it); close(); };
    if (window.confetti) window.confetti(220);
  }
  function equip(it) { const d = data(); d.eq[it.cat] = it.key; commit(); }

  function open(tab = 'pass') {
    const d = data(), t = tierOf(d.xp);
    const tabs = [['pass', '🎟️ الباتل باس'], ['quests', '🎯 المهام'], ['locker', '🧥 الخزانة'], ['shop', '🛒 المتجر']];
    let body = '';
    if (tab === 'pass') {
      body = `<p class="fp-sub">${SEASON.name} — كل ${SEASON.xpPerTier} XP تفتح مستوى جديد</p>
        <div class="fp-xpbar"><u style="width:${t >= SEASON.tiers ? 100 : Math.round((d.xp % SEASON.xpPerTier) / SEASON.xpPerTier * 100)}%"></u>
        <span>المستوى ${t} • ${t >= SEASON.tiers ? 'أكملت الموسم! 🏆' : `${SEASON.xpPerTier - d.xp % SEASON.xpPerTier} XP للمستوى التالي`}</span></div>
        <div class="fp-tiers">${TIERS.map((id, k) => {
          const it = item(id) || { cat: 'coins', name: id.split(':')[1], r: 'common' }, rr = RAR[it.r] || RAR.common, open_ = k < t;
          return `<div class="fp-tier ${open_ ? 'on' : ''} ${k === t ? 'next' : ''}" style="--rc:${rr[1]}"><small>${k + 1}</small>
            <div class="fp-ti">${open_ ? iconOf(it, 54) : `<span class="fp-lock">${k === t ? iconOf(it, 54) : '🔒'}</span>`}</div>
            <b>${it.cat === 'coins' ? '🪙 ' + it.name : it.name}</b></div>`;
        }).join('')}</div>`;
    } else if (tab === 'quests') {
      const row = (q, st) => { const k = q.key || q.id, p = Math.min(st.p[k] || 0, q.goal || 1), done = st.done.includes(k);
        return `<div class="fp-quest ${done ? 'done' : ''}"><span>${q.icon || '🎯'}</span><div><b>${q.title}</b>
          <i><u style="width:${Math.round(p / (q.goal || 1) * 100)}%"></u></i><small>${p} / ${q.goal || 1}</small></div><em>${done ? '✅' : '+' + q.xp + ' XP'}</em></div>`; };
      body = `<h3>☀️ مهام اليوم <small>تتجدد كل يوم</small></h3>${C.quests.map(q => row(q, d.q)).join('')}
        ${(C.weekly || []).length ? `<h3>📅 مهام الأسبوع <small>تتجدد كل سبت</small></h3>${C.weekly.map(q => row(q, d.w)).join('')}` : ''}`;
    } else if (tab === 'locker') {
      const sk = SKINS[d.eq.skin] || SKINS.rookie;
      const slot = c => { const own = d.owned.filter(id => id.startsWith(c + ':')).map(item).filter(Boolean);
        return `<h3>${{ skin: '🧍 الشخصيات', back: '🎒 حقائب الظهر', emote: '💃 الرقصات', glider: '🪂 المظلات' }[c]}</h3>
          <div class="fp-grid">${own.length ? own.map(it => { const rr = RAR[it.r];
            return `<button class="fp-item ${d.eq[c] === it.key ? 'eq' : ''}" style="--rc:${rr[1]}" data-eq="${it.id}">${iconOf(it, 60)}<b>${it.name}</b><small>${rr[0]}</small></button>`; }).join('')
            : '<p class="fp-sub">افتحها من الباتل باس أو المتجر 🔓</p>'}</div>`; };
      body = `<div class="fp-stage" style="--rc:${RAR[sk.r][1]}"><div class="fp-hero ${d.eq.emote ? '' : ''}" id="fpHero">${avatarSVG(d.eq.skin, 150, d.eq.back)}</div>
        <div><h2>${sk.name}</h2><p class="fp-rar" style="color:${RAR[sk.r][1]}">${RAR[sk.r][0]}</p>
        ${d.eq.emote ? `<button class="fp-btn fp-pri" id="fpDance">${EMOTES[d.eq.emote].e} ارقص: ${EMOTES[d.eq.emote].name}</button>` : ''}</div></div>
        ${['skin', 'back', 'emote', 'glider'].map(slot).join('')}`;
    } else {
      const seed = [...today()].reduce((a, c) => a * 31 + c.charCodeAt(0) >>> 0, 7);
      const pick = SHOP.map((x, i) => [((seed * (i + 3)) % 997), x]).sort((a, b) => a[0] - b[0]).slice(0, 4).map(x => x[1]);
      body = `<p class="fp-sub">🔄 المتجر يتغيّر كل يوم. عندك <b>🪙 ${d.coins}</b></p><div class="fp-grid">${pick.map(([id, price]) => {
        const it = item(id), rr = RAR[it.r], own = d.owned.includes(id);
        return `<div class="fp-item fp-shop" style="--rc:${rr[1]}">${iconOf(it, 70)}<b>${it.name}</b><small>${rr[0]} • ${CAT_NAME[it.cat]}</small>
          <button class="fp-btn ${own ? '' : 'fp-pri'}" data-buy="${id}" data-price="${price}" ${own || d.coins < price ? 'disabled' : ''}>${own ? 'تملكها ✅' : '🪙 ' + price}</button></div>`;
      }).join('')}</div><p class="fp-sub">💡 العملات تجيك من مستويات الباتل باس.</p>`;
    }
    overlay(`<div class="fp-head"><h2>🎮 ${C.name}</h2><button class="fp-btn" data-fp-close>✕</button></div>
      <div class="fp-tabs">${tabs.map(([k, l]) => `<button class="fp-tab ${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
      <div class="fp-body">${body}</div>`);
    root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => open(b.dataset.tab));
    root.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => { equip(item(b.dataset.eq)); open('locker'); });
    root.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const price = +b.dataset.price; if (d.coins < price) return;
      d.coins -= price; grant(b.dataset.buy); commit();
      const it = item(b.dataset.buy); levelUpBuy(it);
    });
    const dn = document.getElementById('fpDance');
    if (dn) dn.onclick = () => dance(document.getElementById('fpHero'));
  }
  function levelUpBuy(it) {
    const rr = RAR[it.r];
    overlay(`<div class="fp-lvl">🛒 اشتريت!</div><div class="fp-reveal" style="--rc:${rr[1]}">${iconOf(it, 130)}</div><h2>${it.name}</h2>
      <div class="fp-row"><button class="fp-btn fp-pri" id="fpEquip">البسها الآن</button><button class="fp-btn" data-fp-close>تمام</button></div>`, 'fp-celebrate');
    document.getElementById('fpEquip').onclick = () => { equip(it); open('locker'); };
    if (window.confetti) window.confetti(150);
  }
  function dance(el) {
    const e = EMOTES[data().eq.emote]; if (!el || !e) return;
    el.classList.remove('fp-wiggle', 'fp-jump', 'fp-spin', 'fp-robot'); void el.offsetWidth; el.classList.add(e.a);
    setTimeout(() => el.classList.remove(e.a), 2400);
  }
  /** شاشة الفوز في نهاية المهمة/الجولة */
  function victory(title = 'فوز البطل!') { later(() => victoryNow(title)); }
  function victoryNow(title) {
    const d = data();
    overlay(`<div class="fp-vic">🏆 ${title}</div><div class="fp-hero" id="fpHero">${avatarSVG(d.eq.skin, 170, d.eq.back)}</div>
      <p>${(SKINS[d.eq.skin] || SKINS.rookie).name} • المستوى ${tierOf(d.xp)}</p>
      <div class="fp-row"><button class="fp-btn fp-pri" data-fp-close>كمّل ⬅</button><button class="fp-btn" id="fpOpen">🎮 الباتل باس</button></div>`, 'fp-celebrate');
    document.getElementById('fpOpen').onclick = () => open('pass');
    setTimeout(() => dance(document.getElementById('fpHero')), 300);
  }

  function init(cfg) {
    C = cfg; D = null; data();
    if (cfg.host) {
      const b = document.createElement('button'); b.id = 'fpChip'; b.className = 'fp-chip'; b.type = 'button';
      b.setAttribute('aria-label', 'الباتل باس'); b.onclick = () => open('pass');
      cfg.host.appendChild(b);
    }
    renderChip();
  }
  /** عند وصول نسخة أحدث من جهاز آخر */
  function reload() { if (!C) return; const n = C.load(); if (n && (n.rev || 0) > (D ? D.rev || 0 : -1)) { D = null; data(); renderChip(); } }

  window.FamilyPass = { init, xp, progress, open, victory, reload, avatarSVG, data: () => data() };
})();
