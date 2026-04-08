import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByMember = query({
  args: { memberId: v.id("users") },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("beneficiaries")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return Promise.all(
      records.map(async (record) => ({
        ...record,
        idDocumentUrl: record.idDocumentUrl
          ? await ctx.storage.getUrl(record.idDocumentUrl)
          : undefined,
        photoUrl: record.photoUrl ? await ctx.storage.getUrl(record.photoUrl) : undefined,
      })),
    );
  },
});

export const create = mutation({
  args: {
    memberId: v.id("users"),
    name: v.string(),
    surname: v.optional(v.string()),
    idNumber: v.string(),
    relationship: v.string(),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    idDocumentUrl: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("beneficiaries")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();

    if (existing.length >= 15) {
      throw new Error("Beneficiary limit reached (15).");
    }

    const duplicate = existing.find(
      (beneficiary) => beneficiary.idNumber === args.idNumber && beneficiary.status === "active",
    );
    if (duplicate) {
      throw new Error("A beneficiary with this ID number already exists.");
    }

    return ctx.db.insert("beneficiaries", {
      memberId: args.memberId,
      name: args.name,
      surname: args.surname,
      idNumber: args.idNumber,
      relationship: args.relationship,
      age: args.age,
      gender: args.gender,
      idDocumentUrl: args.idDocumentUrl,
      photoUrl: args.photoUrl,
      status: "active",
    });
  },
});

export const uploadId = mutation({
  args: { idNumber: v.string(), idDocumentUrl: v.string(), uploadedAt: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("beneficiaries")
      .withIndex("by_idNumber", (q) => q.eq("idNumber", args.idNumber))
      .first();

    if (!record) {
      throw new Error("Beneficiary not found.");
    }

    await ctx.db.patch(record._id, {
      idDocumentUrl: args.idDocumentUrl,
      idUploadedAt: args.uploadedAt,
    });
  },
});

export const uploadPhoto = mutation({
  args: { idNumber: v.string(), photoUrl: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("beneficiaries")
      .withIndex("by_idNumber", (q) => q.eq("idNumber", args.idNumber))
      .first();

    if (!record) {
      throw new Error("Beneficiary not found.");
    }

    await ctx.db.patch(record._id, {
      photoUrl: args.photoUrl,
    });
  },
});

export const generateIdUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const generatePhotoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const markDeceased = mutation({
  args: { idNumber: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("beneficiaries")
      .withIndex("by_idNumber", (q) => q.eq("idNumber", args.idNumber))
      .first();

    if (!record) {
      throw new Error("Beneficiary not found.");
    }

    await ctx.db.patch(record._id, { status: "deceased" });
  },
});

export const getByIdNumber = query({
  args: { idNumber: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("beneficiaries")
      .withIndex("by_idNumber", (q) => q.eq("idNumber", args.idNumber))
      .first();
  },
});

export const listDeceased = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db
      .query("beneficiaries")
      .filter((q) => q.eq(q.field("status"), "deceased"))
      .collect();

    return records;
  },
});

export const removeByIdNumber = mutation({
  args: { idNumber: v.string() },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("beneficiaries")
      .withIndex("by_idNumber", (q) => q.eq("idNumber", args.idNumber))
      .collect();

    await Promise.all(records.map((record) => ctx.db.delete(record._id)));
  },
});
