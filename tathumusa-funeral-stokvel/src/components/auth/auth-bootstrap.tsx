"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function AuthBootstrap() {
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }
    fetch("/api/users/register", { method: "POST" }).catch(() => {
      // registration will retry on next navigation
    });
  }, [isSignedIn]);

  return null;
}
