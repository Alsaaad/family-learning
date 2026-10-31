// يجلب سجل جهاد من القاعدة القديمة ويطبعه كمدخلات لـ convex run
const OLD = 'https://modest-buzzard-935.eu-west-1.convex.cloud'
const r = await fetch(`${OLD}/api/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ path: 'progress:dashboard', args: { code: process.env.PARENT_CODE, kid: 'jehad' }, format: 'json' }) })
const j = await r.json()
if (j.status !== 'success' || !j.value) { console.error('old fetch failed', j); process.exit(1) }
const v = j.value
process.stdout.write(JSON.stringify({ kid: 'jehad', sessions: v.sessions, progress: v.snapshot ? v.snapshot.progress : null }))
