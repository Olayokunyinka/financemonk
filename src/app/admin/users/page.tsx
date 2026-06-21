import type { Metadata } from "next";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Users · Admin",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6 text-brand" />
        <h1 className="text-2xl font-bold">Users</h1>
      </div>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        User administration (roles, suspensions, audit) is scoped to a later
        admin milestone and isn&apos;t built yet.
      </p>
    </div>
  );
}
