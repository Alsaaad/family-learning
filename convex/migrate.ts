import { internalMutation } from "./_generated/server"
import { v } from "convex/values"

/** نقل سجل المهام من القاعدة القديمة (Macaly) — يُشغَّل مرة واحدة من GitHub Actions */
export const importSessions = internalMutation({
  args: { kid: v.string(), sessions: v.array(v.any()), progress: v.any() },
  handler: async (ctx, a) => {
    const have = await ctx.db.query("sessions").withIndex("by_kid_created", (q) => q.eq("kid", a.kid)).collect()
    const seen = new Set(have.map((s) => `${s.createdAt}`))
    let n = 0
    for (const s of a.sessions) {
      if (seen.has(`${s.createdAt}`)) continue
      await ctx.db.insert("sessions", { kid: a.kid, date: s.date, summary: s.summary, stats: s.stats, createdAt: s.createdAt })
      n++
    }
    const snap = await ctx.db.query("snapshots").withIndex("by_kid", (q) => q.eq("kid", a.kid)).unique()
    if (!snap && a.progress) await ctx.db.insert("snapshots", { kid: a.kid, progress: a.progress, updatedAt: Date.now() })
    return n
  },
})
