import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("donor"), v.literal("recipient")),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    joinDate: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("active"), v.literal("suspended")),
    termsAcceptedAt: v.optional(v.string()),
    points: v.optional(v.number()),
    memberNumber: v.optional(v.string()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_memberNumber", ["memberNumber"])
    .index("by_email", ["email"]),

  beneficiaries: defineTable({
    memberId: v.id("users"),
    name: v.string(),
    surname: v.optional(v.string()),
    idNumber: v.string(),
    relationship: v.string(),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("deceased")),
    idDocumentUrl: v.optional(v.string()),
    idUploadedAt: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  })
    .index("by_memberId", ["memberId"])
    .index("by_idNumber", ["idNumber"]),

  contributions: defineTable({
    memberId: v.id("users"),
    amount: v.number(),
    date: v.string(),
    month: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("late"), v.literal("missed")),
    paymentReference: v.optional(v.string()),
  }).index("by_memberId", ["memberId"]),

  claims: defineTable({
    memberId: v.id("users"),
    beneficiaryId: v.id("beneficiaries"),
    documents: v.object({
      idCopyUrl: v.optional(v.string()),
      deathCertificateUrl: v.optional(v.string()),
    }),
    status: v.union(v.literal("draft"), v.literal("submitted"), v.literal("voting"), v.literal("approved"), v.literal("rejected"), v.literal("paid")),
    votesFor: v.number(),
    votesAgainst: v.number(),
  }).index("by_memberId", ["memberId"]),

  meetings: defineTable({
    date: v.string(),
    title: v.string(),
    minutesDocumentUrl: v.optional(v.string()),
  }).index("by_title", ["title"]),

  meetingRsvps: defineTable({
    meetingId: v.id("meetings"),
    memberId: v.id("users"),
    status: v.union(v.literal("accept"), v.literal("decline")),
    reason: v.optional(v.string()),
  }).index("by_meeting_member", ["meetingId", "memberId"]),

  loans: defineTable({
    memberId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("settled")),
    interestRate: v.number(),
  }).index("by_memberId", ["memberId"]),

  charityItems: defineTable({
    donorId: v.id("users"),
    category: v.string(),
    title: v.string(),
    size: v.string(),
    condition: v.string(),
    photos: v.array(v.string()),
    status: v.union(v.literal("available"), v.literal("claimed")),
  }).index("by_donorId", ["donorId"]),

  charityClaims: defineTable({
    itemId: v.id("charityItems"),
    recipientId: v.id("users"),
    date: v.string(),
  }).index("by_itemId", ["itemId"]),

  decisions: defineTable({
    externalId: v.string(),
    title: v.string(),
    description: v.string(),
    yesVotes: v.number(),
    noVotes: v.number(),
    status: v.union(v.literal("open"), v.literal("closed")),
  }).index("by_externalId", ["externalId"]),

  attendance: defineTable({
    memberName: v.string(),
    meetingTitle: v.string(),
    date: v.string(),
    status: v.union(v.literal("attended"), v.literal("missed")),
  }),

  rentals: defineTable({
    memberName: v.string(),
    type: v.union(v.literal("car"), v.literal("equipment")),
    item: v.string(),
    date: v.string(),
    notes: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    // Extended fields for validated rental flow
    equipmentCategory: v.optional(v.string()),
    quantity: v.optional(v.number()),
    pricePerUnit: v.optional(v.number()),
    totalCost: v.optional(v.number()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    days: v.optional(v.number()),
  })
    .index("by_item_dates", ["item", "startDate", "endDate"]),

  supportRequests: defineTable({
    memberName: v.string(),
    funeralOf: v.string(),
    supportType: v.string(),
    notes: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    createdAt: v.string(),
  }),

  fines: defineTable({
    memberId: v.id("users"),
    memberName: v.string(),
    amount: v.number(),
    reason: v.string(),
    date: v.string(),
    status: v.union(v.literal("unpaid"), v.literal("paid")),
  })
    .index("by_memberId", ["memberId"])
    .index("by_status", ["status"]),
});
