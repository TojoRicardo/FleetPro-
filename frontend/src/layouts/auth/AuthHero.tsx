import { Check, Sparkles } from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo';
import { AUTH_HERO } from '@/layouts/auth/constants';

export default function AuthHero() {
  return (
    <div className="auth-hero-panel hidden flex-1 flex-col justify-between p-8 lg:flex lg:p-12 xl:p-16">
      <BrandLogo size="lg" variant="glass" showTagline className="auth-fade-in w-fit" />

      <div className="auth-fade-in auth-fade-in-delay max-w-xl">
        <div className="auth-hero-badge mb-8 inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-600" />
          {AUTH_HERO.badge}
        </div>

        <h2 className="text-[2rem] font-bold leading-[1.12] tracking-[-0.03em] text-slate-900 xl:text-[2.75rem]">
          {AUTH_HERO.title}
        </h2>

        <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 xl:text-lg">
          {AUTH_HERO.subtitle}
        </p>

        <ul className="mt-8 space-y-3">
          {AUTH_HERO.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-slate-700 xl:text-[0.9375rem]">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600/10 text-primary-600">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="auth-fade-in auth-fade-in-delay-2 space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{AUTH_HERO.trust}</p>
        <p className="text-sm text-slate-500">{AUTH_HERO.copyright}</p>
      </div>
    </div>
  );
}
