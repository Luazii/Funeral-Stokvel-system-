import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("meetings").collect();
  },
});

export const getByTitle = query({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("meetings")
      .withIndex("by_title", (q) => q.eq("title", args.title))
      .first();
  },
});

export const create = mutation({
  args: { date: v.string(), title: v.string(), minutesDocumentUrl: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("meetings")
      .withIndex("by_title", (q) => q.eq("title", args.title))
      .collect();
    const duplicate = existing.find((meeting) => meeting.date === args.date);
    if (duplicate) {
      return duplicate._id;
    }

    return ctx.db.insert("meetings", {
      date: args.date,
      title: args.title,
      minutesDocumentUrl: args.minutesDocumentUrl,
    });
  },
});

export const ensureByTitle = mutation({
  args: { title: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("meetings")
      .withIndex("by_title", (q) => q.eq("title", args.title))
      .first();
    if (existing) {
      return existing._id;
    }
    return ctx.db.insert("meetings", {
      title: args.title,
      date: args.date,
      minutesDocumentUrl: undefined,
    });
  },
});

export const rsvp = mutation({
  args: {
    meetingId: v.id("meetings"),
    memberId: v.id("users"),
    status: v.union(v.literal("accept"), v.literal("decline")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("meetingRsvps")
      .withIndex("by_meeting_member", (q) =>
        q.eq("meetingId", args.meetingId).eq("memberId", args.memberId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        reason: args.reason,
      });
      return existing._id;
    }

    return ctx.db.insert("meetingRsvps", {
      meetingId: args.meetingId,
      memberId: args.memberId,
      status: args.status,
      reason: args.reason,
    });
  },
});

export const listWithRsvpSummary = query({
  args: { memberId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const meetings = await ctx.db.query("meetings").collect();
    const summarized = await Promise.all(
      meetings.map(async (meeting) => {
        const rsvps = await ctx.db
          .query("meetingRsvps")
          .withIndex("by_meeting_member", (q) => q.eq("meetingId", meeting._id))
          .collect();

        const acceptedCount = rsvps.filter((rsvp) => rsvp.status === "accept").length;
        const declinedCount = rsvps.filter((rsvp) => rsvp.status === "decline").length;
        const memberRsvp = args.memberId
          ? rsvps.find((rsvp) => rsvp.memberId === args.memberId)
          : undefined;

        return {
          _id: meeting._id,
          title: meeting.title,
          date: meeting.date,
          acceptedCount,
          declinedCount,
          memberStatus: memberRsvp?.status,
          memberReason: memberRsvp?.reason,
        };
      }),
    );

    return summarized.sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const updateMinutes = mutation({
  args: { meetingId: v.id("meetings"), minutesDocumentUrl: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.meetingId, { minutesDocumentUrl: args.minutesDocumentUrl });
  },
});

export const remove = mutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    const rsvps = await ctx.db
      .query("meetingRsvps")
      .withIndex("by_meeting_member", (q) => q.eq("meetingId", args.meetingId))
      .collect();

    await Promise.all(rsvps.map((rsvp) => ctx.db.delete(rsvp._id)));
    await ctx.db.delete(args.meetingId);
  },
});
