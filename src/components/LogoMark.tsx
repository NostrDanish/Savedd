import { cn } from '@/lib/utils';

/**
 * SAVEDD mark — a magnifying glass whose lens holds a Latin cross of light.
 * Search as seeking; the cross as what the seeking is toward.
 * Renders in currentColor so it follows theme and accent.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn('text-primary', className)}
    >
      <circle cx="27.5" cy="27.5" r="17.25" stroke="currentColor" strokeWidth="3.1" />
      <line
        x1="40.4"
        y1="40.4"
        x2="53.2"
        y2="53.2"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* Latin cross of light inside the lens */}
      <rect x="25.35" y="16.8" width="4.3" height="21.4" rx="1.15" fill="currentColor" />
      <rect x="18.9" y="22.15" width="17.2" height="4.15" rx="1.15" fill="currentColor" />
      <circle cx="27.5" cy="27.5" r="11.4" stroke="currentColor" strokeWidth="0.9" opacity="0.28" />
    </svg>
  );
}
