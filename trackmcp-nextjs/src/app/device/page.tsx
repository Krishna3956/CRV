import type { Metadata } from "next";
import { DeviceApprovalClient } from "@/components/DeviceApprovalClient";

export const metadata: Metadata = {
  title: "Approve TrackMCP device connection",
  robots: { index: false, follow: false },
};

export default async function DevicePage({ searchParams }: { searchParams: Promise<{ user_code?: string }> }) {
  const params = await searchParams;
  return <DeviceApprovalClient userCode={params.user_code || null} />;
}
