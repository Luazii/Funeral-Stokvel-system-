import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByMember = query({
  args: { memberId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("loans")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("loans").order("desc").take(100);
  },
});

export const create = mutation({
  args: {
    memberId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    interestRate: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("loans", {
      memberId: args.memberId,
      amount: args.amount,
      reason: args.reason,
      interestRate: args.interestRate,
      status: "pending",
    });
  },
});

export const setStatus = mutation({
  args: {
    loanId: v.id("loans"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("settled"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.loanId, { status: args.status });
  },
});
