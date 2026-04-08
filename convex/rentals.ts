import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Equipment catalog — single source of truth for pricing and stock limits
export const CATALOG = [
  { id: "tent", label: "Tent", type: "equipment", pricePerUnit: 350, priceUnit: "per day", maxStock: 5 },
  { id: "chair", label: "Chairs", type: "equipment", pricePerUnit: 10, priceUnit: "per chair/day", maxStock: 100 },
  { id: "table", label: "Tables", type: "equipment", pricePerUnit: 25, priceUnit: "per table/day", maxStock: 30 },
  { id: "car", label: "Funeral car", type: "car", pricePerUnit: 800, priceUnit: "per day", maxStock: 2 },
] as const;

export type CatalogItem = (typeof CATALOG)[number];

export const getCatalog = query({
  args: {},
  handler: async () => {
    return CATALOG;
  },
});

/** Returns booked quantity for an item between startDate and endDate (inclusive). */
export const getBookedQuantity = query({
  args: {
    equipmentCategory: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const overlapping = await ctx.db
      .query("rentals")
      .filter((q) =>
        q.and(
          q.eq(q.field("equipmentCategory"), args.equipmentCategory),
          q.neq(q.field("status"), "rejected"),
          // Overlap: existing.start <= new.end AND existing.end >= new.start
          q.lte(q.field("startDate"), args.endDate),
          q.gte(q.field("endDate"), args.startDate),
        ),
      )
      .take(500);

    return overlapping.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("rentals").order("desc").take(100);
  },
});

export const create = mutation({
  args: {
    memberName: v.string(),
    type: v.union(v.literal("car"), v.literal("equipment")),
    item: v.string(),
    date: v.string(),
    notes: v.optional(v.string()),
    equipmentCategory: v.optional(v.string()),
    quantity: v.optional(v.number()),
    pricePerUnit: v.optional(v.number()),
    totalCost: v.optional(v.number()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("rentals", {
      memberName: args.memberName,
      type: args.type,
      item: args.item,
      date: args.date,
      notes: args.notes,
      status: "pending",
      equipmentCategory: args.equipmentCategory,
      quantity: args.quantity,
      pricePerUnit: args.pricePerUnit,
      totalCost: args.totalCost,
      startDate: args.startDate,
      endDate: args.endDate,
      days: args.days,
    });
  },
});

export const setStatus = mutation({
  args: {
    rentalId: v.id("rentals"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rentalId, { status: args.status });
  },
});

export const remove = mutation({
  args: { rentalId: v.id("rentals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.rentalId);
  },
});
