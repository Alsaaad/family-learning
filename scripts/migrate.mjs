// ينقل سجل جهاد من القاعدة القديمة (Macaly) إلى الجديدة — آمن لو تكرر
import fs from 'fs'
const OLD = 'https://modest-buzzard-935.eu-west-1.convex.cloud', NEW = 'https://cheerful-civet-746.convex.cloud'
const W = fs.readFileSync('jehad/sync-config.js', 'utf8').match(/code: '([^']+)'/)[1]
const call = async (url, kind, path, args) => {
  const r = await fetch(`${url}/api/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, args, format: 'json' }) })
  const j = await r.json(); if (j.status !== 'success') throw new Error(JSON.stringify(j)); return j.value
}
const v = await call(OLD, 'query', 'progress:dashboard', { code: process.env.PARENT_CODE, kid: 'jehad' })
if (!v) throw new Error('old parent code rejected')
const n = await call(NEW, 'mutation', 'migrate:importSessions', { code: W, kid: 'jehad', sessions: v.sessions, progress: v.snapshot ? v.snapshot.progress : null })
console.log(`imported ${n} of ${v.sessions.length} sessions`)

// جواد: من little-spider-313 إلى القاعدة الجديدة
const JOLD = 'https://little-spider-313.eu-west-1.convex.cloud'
const rows = await call(JOLD, 'query', 'records:all', {})
const have = new Set((await call(NEW, 'query', 'records:all', {})).map(r => r.path))
let k = 0
for (const r of rows) if (!have.has(r.path)) { await call(NEW, 'mutation', 'records:put', { path: r.path, data: r.data }); k++ }
console.log(`jawad: copied ${k} of ${rows.length} records`)

// جهاد: الحالة الكاملة (القصص، الآيات، النجوم، الأرشيف…) — تُقرأ من القديمة عبر دمج حالة فارغة، ثم تُدمج في الجديدة
const oldState = await call(OLD, 'mutation', 'kidState:mergeState', { code: W, kid: 'jehad', state: {} })
const merged = await call(NEW, 'mutation', 'kidState:mergeState', { code: W, kid: 'jehad', state: oldState })
console.log(`jehad state: stars=${merged.stars} stories=${Object.keys(merged.stories || {}).length} ayat=${Object.keys(merged.ayat || {}).length} surah=${merged.qSurah}`)
