import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByMember = query({
  args: { memberId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("contributions")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("contributions").collect();
  },
});

export const create = mutation({
  args: {
    memberId: v.id("users"),
    amount: v.number(),
    date: v.string(),
    month: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("late"),
      v.literal("missed"),
    ),
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("contributions", {
      memberId: args.memberId,
      amount: args.amount,
      date: args.date,
      month: args.month,
      status: args.status,
      paymentReference: args.paymentReference,
    });
  },
});

export const remove = mutation({
  args: { contributionId: v.id("contributions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.contributionId);
  },
});
