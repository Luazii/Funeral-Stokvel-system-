/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as attendance from "../attendance.js";
import type * as beneficiaries from "../beneficiaries.js";
import type * as claims from "../claims.js";
import type * as contributions from "../contributions.js";
import type * as decisions from "../decisions.js";
import type * as loans from "../loans.js";
import type * as meetings from "../meetings.js";
import type * as rentals from "../rentals.js";
import type * as supportRequests from "../supportRequests.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  attendance: typeof attendance;
  beneficiaries: typeof beneficiaries;
  claims: typeof claims;
  contributions: typeof contributions;
  decisions: typeof decisions;
  loans: typeof loans;
  meetings: typeof meetings;
  rentals: typeof rentals;
  supportRequests: typeof supportRequests;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
