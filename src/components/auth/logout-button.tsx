"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        router.push("/logout");
      }}
      className="rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary/60"
    >
      Logout
    </button>
  );
}

