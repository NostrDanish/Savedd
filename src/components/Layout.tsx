import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Settings, PlusCircle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LoginArea } from '@/components/auth/LoginArea';
import { LogoMark } from '@/components/LogoMark';
import { SubmitToIndex } from '@/components/SubmitToIndex';
import { ENGINE_PROFILE } from '@/lib/engine/profile';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  /** When true, the layout uses a minimal header (for the home search page). */
  minimal?: boolean;
}

const engine = ENGINE_PROFILE;

const MOBILE_LINKS = [
  { to: '/', label: 'Search' },
  ...engine.ui.navLinks,
  ...engine.ui.footerLinks.filter((l) => !engine.ui.navLinks.some((n) => n.to === l.to)),
] as const;

export function Layout({ children, minimal = false }: LayoutProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [submitOpen, setSubmitOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none"
      >
        Skip to content
      </a>

      <header className={cn(
        'sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl bg-background/80',
        minimal && 'border-transparent bg-transparent backdrop-blur-none',
      )}>
        <div className="container flex items-center justify-between h-14 gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group" aria-label={`${engine.branding.name} home`}>
            <LogoMark className="w-8 h-8 rounded-lg group-hover:scale-105 transition-transform" />
            <span className="font-semibold text-lg tracking-[0.18em] font-serif">
              {engine.branding.wordmark}
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1" aria-label="Primary">
            {engine.ui.navLinks.map((link) => (
              <Button
                key={link.to}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  'text-muted-foreground hover:text-foreground',
                  location.pathname.startsWith(link.to) && 'text-foreground bg-accent/50',
                )}
              >
                <Link to={link.to}>{link.label}</Link>
              </Button>
            ))}
          </nav>

          <nav className="flex items-center gap-1" aria-label="App">
            {!isHome && (
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/">
                  <Search className="w-4 h-4 mr-1.5" />
                  Search
                </Link>
              </Button>
            )}
            {engine.ui.showSubmit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSubmitOpen(true)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Submit a link to the community index"
              >
                <PlusCircle className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Submit</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Link to="/settings" aria-label="Settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>

            {engine.ui.showLogin && <LoginArea className="max-w-48" />}

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:hidden text-muted-foreground hover:text-foreground"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <LogoMark className="w-6 h-6 rounded-md" />
                    <span className="font-serif tracking-[0.16em]">{engine.branding.wordmark}</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4 pb-6" aria-label="Mobile">
                  {MOBILE_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        'px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors',
                        (link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to)) &&
                          'text-foreground bg-accent/50 font-medium',
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <footer className="border-t border-border/50 py-6">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="font-semibold font-serif tracking-[0.14em] text-foreground/80">{engine.branding.wordmark}</span>
            <span className="text-border">|</span>
            <span>{engine.ui.footerTagline}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {engine.ui.footerLinks.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
            <a
              href="https://shakespeare.diy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Vibed with Shakespeare
            </a>
          </div>
        </div>
      </footer>

      {engine.ui.showSubmit && (
        <SubmitToIndex open={submitOpen} onOpenChange={setSubmitOpen} />
      )}
    </div>
  );
}
