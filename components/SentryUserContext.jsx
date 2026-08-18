"use client";

// Attaches the authenticated user's identity to all Sentry error reports.
// Renders nothing — exists solely to keep Sentry's user scope in sync with
// the next-auth session.
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import * as Sentry from "@sentry/nextjs";

export default function SentryUserContext() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      Sentry.setUser({ username: session.user.name, role: session.user.role });
    } else {
      Sentry.setUser(null);
    }
  }, [session]);

  return null;
}
