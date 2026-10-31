// حالة جهاد في القاعدة الجديدة (للتحقق)
const NEW = 'https://cheerful-civet-746.convex.cloud'
const r = await fetch(`${NEW}/api/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ path: 'progress:dashboard', args: { code: process.env.PARENT_CODE, kid: 'jehad' }, format: 'json' }) })
const v = (await r.json()).value || {}
const s = v.snapshot
const p = (s && s.progress) || {}
console.log(`snapshot_age_min=${s ? Math.round((Date.now() - s.updatedAt) / 60000) : 'none'} stars=${p.stars} stories=${(p.storiesDone || []).length} ayat=${(p.ayatDone || []).join('.')} streak=${p.streak} device=${p.device} sessions=${(v.sessions || []).length}`)
