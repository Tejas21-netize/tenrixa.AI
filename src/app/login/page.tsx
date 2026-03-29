import { LoginForm } from "@/components/auth/login-form";
import { SiteHeader } from "@/components/layout/site-header";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader ctaHref="/signup" ctaLabel="Create account" />
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-10">
        <div className="w-full rounded-3xl border border-border/60 bg-card/50 p-6 shadow-sm sm:p-10">
          <div>
            <div className="text-2xl font-semibold">Welcome back</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Log in to Tenrixa to analyze tenders.
            </div>
          </div> 

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

