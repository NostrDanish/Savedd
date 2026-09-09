import { cn } from '@/lib/utils';

/**
 * SAVEDD mark — a magnifying glass with a four-pointed star of light in
 * the lens. Search revealing truth. Renders in `currentColor` so it
 * follows the theme and accent.
 *
 * Geometry is independent of the Dsearch D-network mark.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn('text-primary', className)}
    >
      {/* Lens */}
      <circle cx="28" cy="28" r="16.5" stroke="currentColor" strokeWidth="3.2" />
      {/* Handle */}
      <line
        x1="40.2"
        y1="40.2"
        x2="52"
        y2="52"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* Four-pointed star of light */}
      <path
        d="M28 16.5 L29.6 25.6 L38.5 28 L29.6 30.4 L28 39.5 L26.4 30.4 L17.5 28 L26.4 25.6 Z"
        fill="currentColor"
      />
      {/* Soft inner ring */}
      <circle cx="28" cy="28" r="11" stroke="currentColor" strokeWidth="1" opacity="0.35" />
    </svg>
  );
}
