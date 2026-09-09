import { verseForDate } from '@/lib/engine/scripture';
import { cn } from '@/lib/utils';

interface ScriptureVerseProps {
  className?: string;
  /** Override the date (tests / previews). Defaults to today. */
  date?: Date;
}

/**
 * Daily rotating Scripture under the search box.
 * Local data, KJV, deterministic per calendar day, no network.
 */
export function ScriptureVerse({ className, date }: ScriptureVerseProps) {
  const verse = verseForDate(date);

  return (
    <figure
      className={cn('max-w-xl mx-auto text-center px-2', className)}
      aria-label={`Scripture: ${verse.reference}, ${verse.translation}`}
    >
      <blockquote className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground font-serif italic">
        <p>&ldquo;{verse.text}&rdquo;</p>
      </blockquote>
      <figcaption className="mt-2 text-xs tracking-wide text-muted-foreground/80">
        <cite className="not-italic font-medium text-foreground/70">{verse.reference}</cite>
        <span className="mx-1.5 text-border" aria-hidden="true">·</span>
        <span>{verse.translation}</span>
      </figcaption>
    </figure>
  );
}
