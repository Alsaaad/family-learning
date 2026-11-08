// حالة جهاد في القاعدة (للتحقق): آخر تحديث + آخر المهام
const NEW = 'https://cheerful-civet-746.convex.cloud'
const call = async (path, args) => (await (await fetch(`${NEW}/api/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ path, args, format: 'json' }) })).json()).value
const v = (await call('progress:dashboard', { code: process.env.PARENT_CODE, kid: 'jehad' })) || {}
const s = v.snapshot, p = (s && s.progress) || {}
const ksa = t => new Date(t + 3 * 36e5).toISOString().slice(0, 16).replace('T', ' ')
console.log(`STATUS last_open=${s ? ksa(s.updatedAt) : 'none'} stars=${p.stars} ayat=${(p.ayatDone || []).join('.')} streak=${p.streak} lastMission=${p.lastMission}`)
for (const x of (v.sessions || []).slice(0, 3)) console.log(`SESSION ${x.date} @${ksa(x.createdAt)} :: ${x.summary.replace(/\n/g, ' | ')}`)
const recs = ((await call('records:all', {})) || []).filter(r => r.path.startsWith('jehad-rec/')).map(r => r.path)
console.log(`RECS ${recs.slice(-5).join(' ')}`)
