import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '@/components/ui/BrandLogo';
import AuthHero from '@/layouts/auth/AuthHero';
import { AUTH_BACKGROUND } from '@/layouts/auth/constants';
import { cn } from '@/utils';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  backgroundImage?: string;
  wide?: boolean;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  backgroundImage = AUTH_BACKGROUND,
  wide = false,
}: AuthLayoutProps) {
  return (
    <div className="auth-shell auth-with-image relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/40" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(255_255_255/0.35),transparent_55%)]" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <AuthHero />

        <div
          className={cn(
            'auth-form-panel flex w-full flex-col justify-center px-5 py-8 sm:px-8 lg:min-h-screen',
            'lg:w-[min(100%,30rem)] lg:shrink-0 lg:px-10 lg:py-12',
            wide && 'xl:w-[34rem]',
          )}
        >
          <div className={cn('mx-auto w-full auth-fade-in', wide ? 'max-w-lg' : 'max-w-md')}>
            <BrandLogo size="md" variant="glass" className="mb-7 w-fit lg:hidden" />

            <div className="auth-form-card">
              <header className="auth-form-header">
                <h1 className="text-[1.625rem] font-bold tracking-[-0.03em] text-slate-900">{title}</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>
              </header>

              <div className="auth-form-body">{children}</div>
            </div>

            {footer ? <div className="auth-form-footer">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthFooterLink({ text, linkText, to }: { text: string; linkText: string; to: string }) {
  return (
    <p>
      {text}{' '}
      <Link to={to} className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
        {linkText}
      </Link>
    </p>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="auth-divider" role="separator">
      <span>{label}</span>
    </div>
  );
}

export function AuthTrustNote({ children }: { children: ReactNode }) {
  return <p className="auth-trust-note">{children}</p>;
}
