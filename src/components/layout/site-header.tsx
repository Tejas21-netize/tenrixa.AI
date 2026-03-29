import Link from "next/link";
import { BrandLockup } from "@/components/brand/logo";

const DEFAULT_SUBTITLE = "Smart AI for Safer Bidding";

type SiteHeaderProps = {
  /** Shown under “Tenrixa” in the lockup; omit to hide the second line. */
  subtitle?: string;
  showSubtitle?: boolean;
  /** Primary nav button (e.g. Get Started vs Create account on auth pages). */
  ctaHref?: string;
  ctaLabel?: string;
};

export function SiteHeader({
  subtitle = DEFAULT_SUBTITLE,
  showSubtitle = true,
  ctaHref = "/login",
  ctaLabel = "Get Started",
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4">
        <BrandLockup
          subtitle={showSubtitle ? subtitle : undefined}
          className="min-w-0 flex-1"
          logoHeightPx={40}
          priority
        />
        <nav
          className="flex shrink-0 items-center gap-2 text-sm sm:gap-4"
          aria-label="Main"
        >
          <Link
            className="text-muted-foreground transition hover:text-foreground"
            href="/pricing"
          >
            Pricing
          </Link>
          <Link
            className="rounded-full bg-primary px-3 py-2 text-primary-foreground shadow-sm transition hover:opacity-95 sm:px-4"
            href={ctaHref}
          >
            {ctaLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}
