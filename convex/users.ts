import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.userId);
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getByMemberNumber = query({
  args: { memberNumber: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_memberNumber", (q) => q.eq("memberNumber", args.memberNumber))
      .first();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("users").collect();
  },
});

export const create = mutation({
  args: {
    clerkId: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("member"),
      v.literal("donor"),
      v.literal("recipient"),
    ),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    joinDate: v.string(),
  },
  handler: async (ctx, args) => {
    const prefix = args.role === "admin" ? "ADM" : "MEM";
    const allUsers = await ctx.db.query("users").collect();
    const maxSeq = allUsers.reduce((max, u) => {
      if (!u.memberNumber?.startsWith(prefix + "-")) return max;
      const seq = parseInt(u.memberNumber.slice(prefix.length + 1), 10);
      return isNaN(seq) ? max : Math.max(max, seq);
    }, 0);
    const memberNumber = `${prefix}-${String(maxSeq + 1).padStart(4, "0")}`;

    return ctx.db.insert("users", {
      clerkId: args.clerkId,
      role: args.role,
      name: args.name,
      email: args.email,
      phone: args.phone,
      joinDate: args.joinDate,
      status: "pending",
      points: 0,
      memberNumber: memberNumber,
    });
  },
});

export const ensure = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    const allUsers = await ctx.db.query("users").collect();
    const maxSeq = allUsers.reduce((max, u) => {
      if (!u.memberNumber?.startsWith("MEM-")) return max;
      const seq = parseInt(u.memberNumber.slice(4), 10);
      return isNaN(seq) ? max : Math.max(max, seq);
    }, 0);
    const memberNumber = `MEM-${String(maxSeq + 1).padStart(4, "0")}`;

    return ctx.db.insert("users", {
      clerkId: args.clerkId,
      role: "member",
      name: args.name,
      email: args.email,
      joinDate: new Date().toISOString(),
      status: "pending",
      points: 0,
      memberNumber: memberNumber,
    });
  },
});

export const approve = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { status: "approved" });
  },
});

export const reject = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { status: "suspended" });
  },
});

export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("member"),
      v.literal("donor"),
      v.literal("recipient"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

export const setTermsAccepted = mutation({
  args: { userId: v.id("users"), acceptedAt: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found.");
    }
    if (!user.termsAcceptedAt) {
      await ctx.db.patch(args.userId, { termsAcceptedAt: args.acceptedAt });
    }
  },
});

export const addPoints = mutation({
  args: { userId: v.id("users"), points: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found.");
    }
    const currentPoints = user.points ?? 0;
    await ctx.db.patch(args.userId, { points: currentPoints + args.points });
  },
});
