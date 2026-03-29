import { SignupForm } from "@/components/auth/signup-form";
import { SiteHeader } from "@/components/layout/site-header";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader ctaHref="/login" ctaLabel="Log in" />
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-10">
        <div className="w-full rounded-3xl border border-border/60 bg-card/50 p-6 shadow-sm sm:p-10">
          <div>
            <div className="text-2xl font-semibold">Create your Tenrixa account</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Start with a limited free quota, upgrade anytime.
            </div>
          </div>

          <div className="mt-8">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}

