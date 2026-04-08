import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByMember = query({
  args: { memberId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("claims")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("claims").order("desc").take(100);
  },
});

export const vote = mutation({
  args: {
    claimId: v.id("claims"),
    vote: v.union(v.literal("for"), v.literal("against")),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new Error("Claim not found.");
    await ctx.db.patch(args.claimId, {
      votesFor: args.vote === "for" ? claim.votesFor + 1 : claim.votesFor,
      votesAgainst: args.vote === "against" ? claim.votesAgainst + 1 : claim.votesAgainst,
      status: "voting",
    });
  },
});

export const create = mutation({
  args: {
    memberId: v.id("users"),
    beneficiaryId: v.id("beneficiaries"),
    idCopyUrl: v.optional(v.string()),
    deathCertificateUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("claims", {
      memberId: args.memberId,
      beneficiaryId: args.beneficiaryId,
      documents: {
        idCopyUrl: args.idCopyUrl,
        deathCertificateUrl: args.deathCertificateUrl,
      },
      status: "submitted",
      votesFor: 0,
      votesAgainst: 0,
    });
  },
});

export const setStatus = mutation({
  args: {
    claimId: v.id("claims"),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("voting"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("paid"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.claimId, { status: args.status });
  },
});
