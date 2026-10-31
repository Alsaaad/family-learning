import { mutation } from "./_generated/server"
import { v } from "convex/values"
import { WRITE_CODE } from "./codes"

const KID = /^[a-z0-9-]{1,32}$/
type S = Record<string, any>

const orMap = (x: S = {}, y: S = {}) => {
  const r: S = {}
  for (const k in x) if (x[k]) r[k] = true
  for (const k in y) if (y[k]) r[k] = true
  return r
}
const later = (a: any, b: any) => (!a ? b : !b ? a : (b.date || "") > (a.date || "") ? b : a)

function mergeMission(a: any, b: any) {
  if (!a) return b
  if (!b) return a
  if (a.date !== b.date) return a.date > b.date ? a : b
  if (!!a.done !== !!b.done) return a.done ? a : b
  if (!!a.started !== !!b.started) return a.started ? a : b
  return (b.i || 0) >= (a.i || 0) ? b : a
}

function streakFrom(dates: string[]) {
  const set = new Set(dates)
  const sorted = [...set].sort()
  if (!sorted.length) return { last: null as string | null, streak: 0 }
  const last = sorted[sorted.length - 1]
  let streak = 0
  let d = new Date(last + "T12:00:00Z")
  while (set.has(d.toISOString().slice(0, 10))) { streak++; d = new Date(d.getTime() - 864e5) }
  return { last, streak }
}

/** a = المخزّن في السحابة، b = القادم من جهاز */
export function mergeStates(a: S | null, b: S): S {
  const inc = { ...b }
  delete inc.pendingReports
  if (!a) return inc
  const out: S = { ...a, ...inc }
  out.stories = orMap(a.stories, inc.stories)
  out.ayat = orMap(a.ayat, inc.ayat)
  out.letters = orMap(a.letters, inc.letters)

  const ap: S = {}
  for (const src of [a.ayahPass || {}, inc.ayahPass || {}])
    for (const k in src) ap[k] = Array.from(new Set([...(ap[k] || []), ...(src[k] || [])])).sort()
  out.ayahPass = ap

  const qi: S = { ...(a.qIntro || {}) }
  for (const k in inc.qIntro || {}) if (!qi[k] || inc.qIntro[k] < qi[k]) qi[k] = inc.qIntro[k]
  out.qIntro = qi
  out.qNew = later(a.qNew, inc.qNew)

  const td: S = { ...(a.troubleDone || {}) }
  for (const k in inc.troubleDone || {}) if (!td[k] || td[k] < inc.troubleDone[k]) td[k] = inc.troubleDone[k]
  out.troubleDone = td
  const tm = new Map<string, any>()
  for (const t of [...(a.trouble || []), ...(inc.trouble || [])]) {
    const p = tm.get(t.t)
    if (!p || (p.date || "") < (t.date || "")) tm.set(t.t, t)
  }
  out.trouble = [...tm.values()]
    .filter((t) => !(td[t.t] && td[t.t] >= t.date))
    .sort((x, y) => ((x.date || "") < (y.date || "") ? -1 : 1))
    .slice(-12)

  out.stars = Math.max(a.stars || 0, inc.stars || 0)

  const logs = new Map<string, any>()
  for (const l of [...(a.missionLog || []), ...(inc.missionLog || [])]) logs.set(`${l.date}|${l.story}`, l)
  out.missionLog = [...logs.values()].sort((x, y) => (x.date < y.date ? -1 : 1)).slice(-60)
  const dates = out.missionLog.map((l: any) => l.date)
  for (const x of [a.lastMission, inc.lastMission]) if (x) dates.push(x)
  const st = streakFrom(dates)
  out.lastMission = st.last
  out.streak = st.streak

  const ans = new Map<number, any>()
  for (const x of [...(a.answers || []), ...(inc.answers || [])]) ans.set(x.d, x)
  out.answers = [...ans.values()].sort((x, y) => y.d - x.d).slice(0, 50)

  out.badgesSeen = Array.from(new Set([...(a.badgesSeen || []), ...(inc.badgesSeen || [])]))
  out.mission = mergeMission(a.mission, inc.mission)

  // تغيير السورة: حقول الحفظ تؤخذ من الجهة صاحبة السورة الأحدث فقط (لا تختلط آيات سورتين)
  const qa = a.qSurahSince || "", qb = inc.qSurahSince || ""
  if (qa !== qb) {
    const src = qb > qa ? inc : a
    out.ayat = src.ayat || {}
    out.ayahPass = src.ayahPass || {}
    out.qIntro = src.qIntro || {}
    out.qNew = src.qNew || null
    out.qSurah = src.qSurah
    out.qSurahSince = src.qSurahSince
  }
  out.quranArchive = { ...(a.quranArchive || {}), ...(inc.quranArchive || {}) }
  return out
}

/** يُرسل الجهاز حالته، فتُدمج مع المخزّن وتُعاد النسخة المدمجة */
export const mergeState = mutation({
  args: { code: v.string(), kid: v.string(), state: v.any() },
  handler: async (ctx, a) => {
    if (a.code !== WRITE_CODE) throw new Error("unauthorized")
    if (!KID.test(a.kid)) throw new Error("bad kid")
    const doc = await ctx.db
      .query("kidState")
      .withIndex("by_kid", (q) => q.eq("kid", a.kid))
      .unique()
    const merged = mergeStates(doc ? doc.state : null, a.state || {})
    if (doc) await ctx.db.patch(doc._id, { state: merged, updatedAt: Date.now() })
    else await ctx.db.insert("kidState", { kid: a.kid, state: merged, updatedAt: Date.now() })
    return merged
  },
})
