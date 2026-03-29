"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) throw error;
      toast.success("Logged in successfully");
      router.push("/dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Unable to log in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/60"
          placeholder="you@example.com"
          autoComplete="email"
          {...form.register("email")}
        />
        {form.formState.errors.email?.message ? (
          <div className="mt-1 text-xs text-destructive">
            {form.formState.errors.email.message}
          </div>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/60"
          autoComplete="current-password"
          {...form.register("password")}
        />
        {form.formState.errors.password?.message ? (
          <div className="mt-1 text-xs text-destructive">
            {form.formState.errors.password.message}
          </div>
        ) : null}
      </div>

      <button
        disabled={submitting}
        className="rounded-full bg-gradient-to-br from-blue-600 to-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Logging in..." : "Log in"}
      </button>

      <div className="text-center text-xs text-muted-foreground">
        New to Tenrixa?{" "}
        <Link className="font-semibold text-primary hover:underline" href="/signup">
          Create an account
        </Link>
      </div>
    </form>
  );
}

