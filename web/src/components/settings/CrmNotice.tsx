"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Banner } from "@/components/feedback/Banner";
import { useToast } from "@/components/feedback/Toaster";
import type { CrmNoticeData } from "./crm-notice";

/** Toasts a successful sign-in once, keeps problems on screen, and cleans the URL. */
export function CrmNotice({ notice }: { notice?: CrmNoticeData }) {
  const router = useRouter();
  const { show } = useToast();
  const handled = useRef(false);
  const [problem] = useState(notice?.kind === "cancelled" || notice?.kind === "failed" ? notice : null);

  useEffect(() => {
    if (!notice || handled.current) return;
    handled.current = true;
    if (notice.kind === "connected") show({ tone: "ok", title: "Connected HubSpot", detail: "Pulling contacts and deals. Analytics switches to HubSpot attribution when the first sync finishes." });
    if (notice.kind === "reconnected") show({ tone: "ok", title: "Reconnected HubSpot", detail: "Syncing resumed." });
    router.replace("/settings?tab=crm", { scroll: false });
  }, [notice, router, show]);

  if (problem?.kind === "cancelled") return <Banner><strong>HubSpot wasn&apos;t connected.</strong> You cancelled at the HubSpot sign-in.</Banner>;
  if (problem?.kind === "failed") return <Banner tone="failed"><strong>HubSpot wasn&apos;t connected.</strong> {problem.reason}</Banner>;
  return null;
}
