import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // كل مهمة يومية منتهية = سجل واحد
  sessions: defineTable({
    kid: v.string(),
    date: v.string(),
    summary: v.string(),
    stats: v.any(),
    createdAt: v.number(),
  }).index("by_kid_created", ["kid", "createdAt"]),

  // حالة التقدّم الكاملة لكل طفل — تُدمج من كل الأجهزة
  kidState: defineTable({
    kid: v.string(),
    state: v.any(),
    updatedAt: v.number(),
  }).index("by_kid", ["kid"]),

  // آخر صورة للتقدّم العام (نجوم، قصص، آيات، المرحلة…)
  snapshots: defineTable({
    kid: v.string(),
    progress: v.any(),
    updatedAt: v.number(),
  }).index("by_kid", ["kid"]),

  // سجلات جواد: مفتاح/قيمة (sessions/…، probes/…، plan/…)
  jawadRecords: defineTable({
    path: v.string(),
    data: v.any(),
    updatedAt: v.number(),
  }).index("by_path", ["path"]),
})
