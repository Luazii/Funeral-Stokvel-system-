import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("attendance").collect();
  },
});

export const listByMember = query({
  args: { memberName: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("attendance")
      .filter((q) => q.eq(q.field("memberName"), args.memberName))
      .collect();
  },
});

export const log = mutation({
  args: {
    memberName: v.string(),
    meetingTitle: v.string(),
    date: v.string(),
    status: v.union(v.literal("attended"), v.literal("missed")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("attendance", {
      memberName: args.memberName,
      meetingTitle: args.meetingTitle,
      date: args.date,
      status: args.status,
    });
  },
});
