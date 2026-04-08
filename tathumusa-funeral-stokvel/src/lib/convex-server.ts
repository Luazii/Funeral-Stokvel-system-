import { ConvexHttpClient } from "convex/browser";

export function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return null;
  }
  return new ConvexHttpClient(url);
}

export async function callMutation<TArgs, TResult>(
  client: ConvexHttpClient,
  name: string,
  args: TArgs,
) {
  return (client as unknown as { mutation: (n: string, a: TArgs) => Promise<TResult> }).mutation(
    name,
    args,
  );
}

export async function callQuery<TArgs, TResult>(
  client: ConvexHttpClient,
  name: string,
  args: TArgs,
) {
  return (client as unknown as { query: (n: string, a: TArgs) => Promise<TResult> }).query(
    name,
    args,
  );
}
