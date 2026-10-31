import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

/* سجلات جواد (التقييم الأساسي، الخطة، اللعبة) — منقولة من jawad-baseline كما هي: مفتاح (path) وقيمة (data) */
export const all = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("jawadRecords").collect()).map((r) => ({ path: r.path, data: r.data })),
})

export const put = mutation({
  args: { path: v.string(), data: v.any() },
  handler: async (ctx, a) => {
    if (a.path.length > 200) throw new Error("bad path")
    const doc = await ctx.db.query("jawadRecords").withIndex("by_path", (q) => q.eq("path", a.path)).unique()
    if (doc) await ctx.db.patch(doc._id, { data: a.data, updatedAt: Date.now() })
    else await ctx.db.insert("jawadRecords", { path: a.path, data: a.data, updatedAt: Date.now() })
    return true
  },
})
