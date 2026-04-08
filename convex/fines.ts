import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByMember = query({
  args: { memberId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("fines")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("fines").order("desc").take(100);
  },
});

export const create = mutation({
  args: {
    memberId: v.id("users"),
    memberName: v.string(),
    amount: v.number(),
    reason: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("fines", {
      memberId: args.memberId,
      memberName: args.memberName,
      amount: args.amount,
      reason: args.reason,
      date: args.date,
      status: "unpaid",
    });
  },
});

export const markPaid = mutation({
  args: { fineId: v.id("fines") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fineId, { status: "paid" });
  },
});
