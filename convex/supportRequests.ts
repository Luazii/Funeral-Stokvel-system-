import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("supportRequests").collect();
  },
});

export const create = mutation({
  args: {
    memberName: v.string(),
    funeralOf: v.string(),
    supportType: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("supportRequests", {
      memberName: args.memberName,
      funeralOf: args.funeralOf,
      supportType: args.supportType,
      notes: args.notes,
      status: "pending",
      createdAt: args.createdAt,
    });
  },
});

export const remove = mutation({
  args: { supportRequestId: v.id("supportRequests") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.supportRequestId);
  },
});
