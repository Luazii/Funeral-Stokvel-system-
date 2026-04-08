import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("decisions").collect();
  },
});

export const create = mutation({
  args: {
    externalId: v.string(),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("decisions")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();

    if (existing) {
      return existing._id;
    }

    return ctx.db.insert("decisions", {
      externalId: args.externalId,
      title: args.title,
      description: args.description,
      yesVotes: 0,
      noVotes: 0,
      status: "open",
    });
  },
});

export const vote = mutation({
  args: { externalId: v.string(), vote: v.union(v.literal("yes"), v.literal("no")) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("decisions")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();

    if (!existing) {
      throw new Error("Decision not found.");
    }

    await ctx.db.patch(existing._id, {
      yesVotes: args.vote === "yes" ? existing.yesVotes + 1 : existing.yesVotes,
      noVotes: args.vote === "no" ? existing.noVotes + 1 : existing.noVotes,
    });
  },
});

export const remove = mutation({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("decisions")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();

    if (!existing) {
      throw new Error("Decision not found.");
    }

    await ctx.db.delete(existing._id);
  },
});
