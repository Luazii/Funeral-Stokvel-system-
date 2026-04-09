import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function normalizeContributionMonth(month?: string, date?: string) {
  if (month) {
    return month.slice(0, 7);
  }
  if (date) {
    return date.slice(0, 7);
  }
  return new Date().toISOString().slice(0, 7);
}

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

export const recordPayment = mutation({
  args: {
    memberId: v.id("users"),
    amount: v.number(),
    date: v.string(),
    month: v.optional(v.string()),
    paymentReference: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedMonth = normalizeContributionMonth(args.month, args.date);
    const memberContributions = await ctx.db
      .query("contributions")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();

    const existing = memberContributions.find(
      (contribution) => contribution.paymentReference === args.paymentReference,
    );

    const hadPaidForMonth = memberContributions.some((contribution) => {
      if (existing && contribution._id === existing._id) {
        return false;
      }
      const contributionMonth = normalizeContributionMonth(
        contribution.month,
        contribution.date,
      );
      return contribution.status === "paid" && contributionMonth === normalizedMonth;
    });

    let contributionId = existing?._id;
    const wasAlreadyPaid = existing?.status === "paid";

    if (existing) {
      await ctx.db.patch(existing._id, {
        amount: args.amount,
        date: args.date,
        month: normalizedMonth,
        status: "paid",
        paymentReference: args.paymentReference,
      });
    } else {
      contributionId = await ctx.db.insert("contributions", {
        memberId: args.memberId,
        amount: args.amount,
        date: args.date,
        month: normalizedMonth,
        status: "paid",
        paymentReference: args.paymentReference,
      });
    }

    let pointsAdded = 0;
    if (!hadPaidForMonth && !wasAlreadyPaid) {
      const member = await ctx.db.get(args.memberId);
      if (member) {
        const currentPoints = member.points ?? 0;
        await ctx.db.patch(args.memberId, { points: currentPoints + 3 });
        pointsAdded = 3;
      }
    }

    return {
      contributionId,
      month: normalizedMonth,
      pointsAdded,
    };
  },
});

export const remove = mutation({
  args: { contributionId: v.id("contributions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.contributionId);
  },
});
