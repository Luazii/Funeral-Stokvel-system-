import {
  CreditCard,
  Database,
  KeyRound,
  MessageSquare,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

export const keyMetrics = [
  { label: "Monthly contribution", value: "R380", caption: "Required from every active member." },
  { label: "Beneficiary limit", value: "15", caption: "Maximum number allowed under one member." },
  { label: "Missed-payment penalty", value: "30%", caption: "Applied after three consecutive missed months." },
];

export const dashboardWidgets = [
  { category: "Widget", title: "Payment reminder", description: "Highlights the next contribution due date and arrears balance." },
  { category: "Widget", title: "Claim status", description: "Tracks uploaded documents, voting progress, and admin review." },
  { category: "Widget", title: "Meeting RSVP", description: "Shows invitations and captures required decline reasons." },
];

export const terms = [
  "By agreeing to these terms and conditions you are agreeing to share your personal documents and information.",
  "By agreeing to these terms and conditions you are agreeing to pay a monthly contribution of R380 on time.",
  "You are only allowed to add 15 beneficiaries under your name.",
  "Should you miss your monthly contribution for three consecutive months you will be required to pay a fine of 30% on top of your missed payments.",
  "Should you commit fraud you and your beneficiaries will be removed from the club and you will not get your money.",
  "No new members will be added without admin approval.",
  "Should you have missed payments for more than four months no money will be received if a funeral occurs.",
  "Should you choose to leave the club you will not receive any money back.",
  "Should you pass away one of your family members will have to continue on your behalf.",
  "If you have recently joined the club, you will not receive the same amount as a member who joined before you.",
];

export const termsSummary = terms.slice(0, 4);

export const serviceReadiness = [
  {
    name: "Clerk authentication",
    status: "Keys received",
    detail:
      "Your Clerk keys are available and the app is structured to wrap the UI with Clerk when the env file is present.",
  },
  {
    name: "Convex backend",
    status: "Partially ready",
    detail:
      "The Convex deployment token is available, but the live app still needs the public Convex URL and generated client wiring.",
  },
  {
    name: "Paystack payments",
    status: "Pending keys",
    detail:
      "Paystack is chosen as the payment gateway. We still need the public key, secret key, and webhook secret to go live.",
  },
  {
    name: "SMS notifications",
    status: "Provider needed",
    detail:
      "SMS is confirmed as the notification channel. We still need your provider choice and credentials, such as Twilio or Vonage.",
  },
];

export const implementationResources = [
  {
    title: "Paystack credentials",
    description:
      "Provide the Paystack public key, secret key, and webhook secret so contribution checkouts can become live.",
    icon: CreditCard,
  },
  {
    title: "Convex public URL",
    description:
      "We still need the `NEXT_PUBLIC_CONVEX_URL` value to connect the frontend to your real Convex project.",
    icon: Database,
  },
  {
    title: "SMS provider credentials",
    description:
      "Choose the SMS service and send the account details, sender name, and test number so alerts can be delivered.",
    icon: MessageSquare,
  },
  {
    title: "Real admin and seed data",
    description:
      "A first admin email plus sample members, claims, meetings, and charity items will let us replace the demo content.",
    icon: ShieldCheck,
  },
  {
    title: "Domain decision",
    description:
      "You can leave the domain undecided for now. We can continue building locally and attach the domain later.",
    icon: Smartphone,
  },
  {
    title: "Production secrets storage",
    description:
      "We should confirm where production secrets will live, such as Vercel environment variables for safer deployment.",
    icon: KeyRound,
  },
];

export const memberOverview = [
  { label: "Contribution status", value: "On track", caption: "April payment due on the 7th." },
  { label: "Missed months", value: "1", caption: "Two more consecutive misses trigger the 30% fine." },
  { label: "Claim eligibility", value: "Eligible", caption: "No 4-month arrears block on this account." },
];

export const memberActions = [
  { title: "Make a Payment", description: "Log a monthly contribution and continue into Paystack checkout when live credentials are added." },
  { title: "Request for Payment", description: "Open a funeral claim for a beneficiary and upload ID and death certificate files." },
  { title: "Apply for Loan", description: "Request a member loan with the reason, amount, and expected recovery plan." },
  { title: "Transportation Rental", description: "Request stokvel funeral transport with date, route, and family contact details." },
];

export const beneficiaries = [
  { name: "Nokuthula Maseko", relationship: "Mother", idNumber: "6902150813087" },
  { name: "Bheki Maseko", relationship: "Brother", idNumber: "8105035632081" },
  { name: "Zanele Maseko", relationship: "Daughter", idNumber: "1407020178081" },
];

export const memberNotifications = [
  { title: "Contribution due soon", description: "SMS reminder scheduled for 48 hours before the monthly due date." },
  { title: "Meeting RSVP requested", description: "The next general meeting invitation needs an accept or decline response." },
  { title: "Claim voting update", description: "Members are notified when funeral assistance votes start and when a decision is reached." },
];

export const upcomingMeetings = [
  {
    title: "April family support briefing",
    date: "12 April 2026 • 10:00",
    description: "Agenda includes contribution review, loan approvals, and funeral support role assignment.",
  },
  {
    title: "Quarterly finance update",
    date: "26 April 2026 • 14:00",
    description: "Members review contribution trends, withdrawals, and no-claim reward preparation.",
  },
];

export const charityItems = [
  { title: "Winter coat set", category: "Clothing", size: "M", condition: "Very good", status: "available", description: "Two warm coats prepared for donation with clean, ready-to-wear condition." },
  { title: "Children's school jersey", category: "Uniform", size: "10-11 years", condition: "Good", status: "available", description: "Donated school jersey suitable for colder mornings and school events." },
  { title: "Formal shoes", category: "Footwear", size: "6", condition: "Good", status: "claimed", description: "Black formal shoes suitable for interviews, church, or formal family events." },
];

export const charityClaims = [
  { item: "Formal shoes", recipient: "Sibongile Dlamini", date: "2 April 2026" },
  { item: "Baby clothes bundle", recipient: "Ayanda Mokoena", date: "31 March 2026" },
];

export const adminInsights = [
  { label: "New applications", value: "08", caption: "Awaiting approval before sign-up continues." },
  { label: "Late contributors", value: "13", caption: "Members needing reminders or fine review." },
  { label: "Open claims", value: "04", caption: "Documents and member votes still in progress." },
];

export const adminActions = [
  { title: "Approve or reject new members", description: "No member can join the club without admin approval, matching your rule set." },
  { title: "Assign funeral assistance tasks", description: "Delegate transport, venue support, and family coordination duties to available members." },
  { title: "Upload year-end posters", description: "Publish yearly summary posters and trigger no-claim benefit distribution notices." },
  { title: "Manage fines and arrears", description: "Track repeated missed payments and flag members that cross the 4-month claim limit." },
];

export const pendingApplications = [
  { name: "Amanda Dube", appliedOn: "1 April 2026", note: "Waiting for admin decision before terms acceptance page is unlocked." },
  { name: "Lindani Ncube", appliedOn: "30 March 2026", note: "Submitted ID copy and family details. Review pending." },
];

export const pendingLoans = [
  { member: "Busisiwe Molefe", amount: "R3,500", reason: "School registration support", repaymentPlan: "R750 for 5 months" },
  { member: "Thabo Mkhize", amount: "R2,000", reason: "Emergency household repairs", repaymentPlan: "R430 for 5 months" },
];

export const recentClaims = [
  { member: "Nomonde Mthembu", beneficiary: "Miriam Mthembu", status: "Awaiting final admin review", votesFor: 18, totalVotes: 24 },
  { member: "Lerato Ndlovu", beneficiary: "Sipho Ndlovu", status: "Documents uploaded", votesFor: 9, totalVotes: 24 },
];

export const userGuideSteps = [
  { step: "01", title: "Complete approval and accept terms", description: "A new member first waits for admin approval, then accepts the stokvel terms before full access is enabled." },
  { step: "02", title: "Add beneficiaries carefully", description: "Members can register up to 15 beneficiaries with names, ID numbers, and relationships." },
  { step: "03", title: "Stay current on R380 payments", description: "The app reminds members of monthly contributions and flags the fine rule after repeated missed months." },
  { step: "04", title: "Use the right support channel", description: "Members can request funeral claim support, loans, transportation, charity items, or counselling resources from the same app." },
];
