"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { error } = await supabase.auth.signOut();
      if (error) toast.error(error.message);
      else toast.success("Logged out");
      router.push("/");
    })();
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center px-4 py-10 text-muted-foreground">
      Logging out...
    </div>
  );
}

