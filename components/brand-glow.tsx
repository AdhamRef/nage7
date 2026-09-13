import { cn } from "@/lib/utils";

/**
 * The blurred emerald/teal orbs from the auth screens, over a grid that fades
 * out at the edges. Purely decorative, and softened in light mode so it reads
 * as a tint rather than a glow.
 */
export const BrandGlow = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
  >
    <div className="absolute inset-0 bg-grid-fade" />
    <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-brand/10 blur-3xl dark:bg-brand/20" />
    <div className="absolute top-1/3 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-teal/10 blur-3xl dark:bg-brand-teal/15" />
    <div className="absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-brand-deep/10 blur-3xl dark:bg-brand-deep/15" />
  </div>
);

export default BrandGlow;
