"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function CharityCart() {
  const [cart, setCart] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const availableItems = useMemo(() => [], []);

  const toggleCart = (title: string) => {
    setMessage(null);
    setCart((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title],
    );
  };

  const checkout = async () => {
    if (!cart.length) {
      setMessage("Add at least one available item to the free cart before checkout.");
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/notifications/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "+27...",
          message: `Charity checkout prepared for ${cart.length} item(s).`,
        }),
      });
      const data = (await response.json()) as { message?: string };
      setMessage(
        data.message ??
          `Free checkout prepared for ${cart.length} item(s).`,
      );
    } catch {
      setMessage("Checkout created, but SMS notifications could not be queued yet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-[32px]">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Free checkout cart</p>
        <div className="mt-5 rounded-[24px] border border-zinc-200 bg-white p-4">
          <p className="font-semibold text-zinc-950">Charity coming soon</p>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            The charity storefront is paused for now. Items will appear here once enabled.
          </p>
        </div>
      </Card>

      <Card className="rounded-[32px]">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Checkout summary</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-950">
          {cart.length} item{cart.length === 1 ? "" : "s"} selected
        </h3>
        <div className="mt-5 space-y-3">
          {cart.length ? (
            cart.map((item) => (
              <div key={item} className="rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
                {item}
              </div>
            ))
          ) : (
            <p className="text-sm leading-7 text-zinc-600">
              Select donated items to build a free checkout basket.
            </p>
          )}
        </div>
        <Button className="mt-6 w-full" onClick={checkout} disabled={isLoading}>
          {isLoading ? "Processing..." : "Complete free checkout"}
        </Button>
        {message ? <p className="mt-4 text-sm leading-7 text-zinc-600">{message}</p> : null}
      </Card>
    </div>
  );
}
