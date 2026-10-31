// ينقل سجل جهاد من القاعدة القديمة (Macaly) إلى الجديدة — آمن لو تكرر
import fs from 'fs'
const OLD = 'https://modest-buzzard-935.eu-west-1.convex.cloud', NEW = 'https://bright-fly-404.convex.cloud'
const W = fs.readFileSync('jehad/sync-config.js', 'utf8').match(/code: '([^']+)'/)[1]
const call = async (url, kind, path, args) => {
  const r = await fetch(`${url}/api/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, args, format: 'json' }) })
  const j = await r.json(); if (j.status !== 'success') throw new Error(JSON.stringify(j)); return j.value
}
const v = await call(OLD, 'query', 'progress:dashboard', { code: process.env.PARENT_CODE, kid: 'jehad' })
if (!v) throw new Error('old parent code rejected')
const n = await call(NEW, 'mutation', 'migrate:importSessions', { code: W, kid: 'jehad', sessions: v.sessions, progress: v.snapshot ? v.snapshot.progress : null })
console.log(`imported ${n} of ${v.sessions.length} sessions`)
