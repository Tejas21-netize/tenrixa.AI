import Image from "next/image";
import Link from "next/link";

/** Public URL for the Tenrixa logo (also used for favicon in layout metadata). */
export const LOGO_SRC = "/logo.png" as const;

/** Intrinsic dimensions for next/image (square asset; display size is CSS-controlled). */
const LOGO_WIDTH = 512;
const LOGO_HEIGHT = 512;

export function LogoMark({
  heightPx = 40,
  className,
  priority,
  alt = "Tenrixa",
}: {
  /** Fixed display height; width follows image aspect ratio. Navbar uses 40. */
  heightPx?: number;
  className?: string;
  priority?: boolean;
  /** Use empty string when the mark is decorative next to the wordmark or a labeled control. */
  alt?: string;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center self-center"
      style={{ height: heightPx }}
    >
      <Image
        src={LOGO_SRC}
        alt={alt}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className={[
          "h-full w-auto max-w-[min(140px,42vw)] object-contain object-left sm:max-w-[180px]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        priority={priority}
        sizes="(max-width: 480px) 38vw, 180px"
      />
    </span>
  );
}

/** Logo linking to home; use in app surfaces where the full wordmark would duplicate page titles. */
export function LogoHomeLink({
  heightPx = 40,
  className,
}: {
  heightPx?: number;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={[
        "inline-flex shrink-0 items-center rounded-lg outline-offset-2 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Tenrixa home"
    >
      <LogoMark heightPx={heightPx} alt="" />
    </Link>
  );
}

export function BrandLockup({
  href = "/",
  logoHeightPx = 40,
  subtitle,
  className,
  priority = false,
}: {
  href?: string;
  /** Fixed logo height in px (navbar default 40). */
  logoHeightPx?: number;
  subtitle?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex min-w-0 max-w-full items-center gap-3 sm:gap-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <LogoMark heightPx={logoHeightPx} priority={priority} alt="" />
      <div className="min-w-0 flex flex-col justify-center leading-tight">
        <div className="truncate text-sm font-semibold sm:text-base">Tenrixa</div>
        {subtitle ? (
          <div className="line-clamp-1 text-[11px] text-muted-foreground sm:text-xs">
            {subtitle}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
