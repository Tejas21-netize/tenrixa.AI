"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignupValues) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;

      toast.success("Account created. Please verify your email if required.");
      router.push("/login");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Unable to sign up");
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
          autoComplete="new-password"
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
        {submitting ? "Creating account..." : "Create account"}
      </button>

      <div className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-semibold text-primary hover:underline" href="/login">
          Log in
        </Link>
      </div>
    </form>
  );
}

