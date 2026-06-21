import type { Metadata } from "next";
import { Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings · Admin",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-brand" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Site-wide admin settings are scoped to a later milestone and aren&apos;t
        built yet.
      </p>
    </div>
  );
}
