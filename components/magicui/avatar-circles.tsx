import { cn } from "@/lib/utils";

interface Avatar {
  imageUrl: string;
  profileUrl?: string;
  name?: string;
}

interface AvatarCirclesProps {
  className?: string;
  /** Rendered as a trailing "+N" bubble. Omit or pass 0 to hide it. */
  numPeople?: number;
  avatarUrls: Avatar[];
}

/**
 * Overlapping avatar row.
 *
 * The upstream Magic UI version overlaps with `-space-x-4 rtl:space-x-reverse`,
 * which needs a `dir` attribute Tailwind can match. This app sets its direction
 * in CSS instead, so the overlap uses the logical `margin-inline-end` — that
 * leans the stack the right way in both directions with no extra markup.
 */
export const AvatarCircles = ({
  numPeople,
  className,
  avatarUrls,
}: AvatarCirclesProps) => (
  <div className={cn("z-10 flex items-center", className)}>
    {avatarUrls.map((avatar, index) => {
      const image = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar.imageUrl}
          alt={avatar.name ?? `طالب ${index + 1}`}
          width={40}
          height={40}
          loading="lazy"
          className="h-10 w-10 rounded-full border-2 border-white object-cover dark:border-slate-900"
        />
      );

      return (
        <span
          key={avatar.imageUrl}
          className="-me-3 last:me-0"
          style={{ zIndex: avatarUrls.length - index }}
        >
          {avatar.profileUrl ? (
            <a href={avatar.profileUrl} target="_blank" rel="noopener noreferrer">
              {image}
            </a>
          ) : (
            image
          )}
        </span>
      );
    })}

    {Boolean(numPeople) && (
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-center text-xs font-bold text-white dark:border-slate-900 dark:bg-white dark:text-slate-900"
        aria-label={`و${numPeople} آخرين`}
      >
        +{numPeople}
      </span>
    )}
  </div>
);

export default AvatarCircles;
