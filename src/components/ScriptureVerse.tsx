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
      className={cn('max-w-xl mx-auto text-center px-3', className)}
      aria-label={`Scripture: ${verse.reference}, ${verse.translation}`}
    >
      <div className="mx-auto mb-3 h-px w-16 bg-primary/30" aria-hidden="true" />
      <blockquote className="font-display italic text-[15px] sm:text-base leading-relaxed text-foreground/80">
        <p>&ldquo;{verse.text}&rdquo;</p>
      </blockquote>
      <figcaption className="mt-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        <cite className="not-italic text-foreground/70">{verse.reference}</cite>
        <span className="mx-2 text-primary/50" aria-hidden="true">·</span>
        <span>{verse.translation}</span>
      </figcaption>
    </figure>
  );
}
