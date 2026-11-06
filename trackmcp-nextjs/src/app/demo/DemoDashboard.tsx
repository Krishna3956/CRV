"use client";

import { DashboardApp } from "@/components/dashboard/DashboardApp";

export default function DemoDashboard() {
  return (
    <DashboardApp
      displayName=""
      workspace={{
        id: "trackmcp-public-example",
        name: "Sample finance workspace",
        slug: "sample-finance",
      }}
      workspaces={[]}
      keys={[]}
      analytics={null}
      toolQuality={null}
      newKey=""
      working={false}
      error=""
      sampleOnly
      onGenerateKey={() => {}}
      onRevokeKey={() => {}}
      onRotateKey={() => {}}
      onDismissKey={() => {}}
      onRefresh={() => {}}
      onCreateWorkspace={() => {}}
      onSelectWorkspace={() => {}}
      onSignOut={() => {}}
    />
  );
}
