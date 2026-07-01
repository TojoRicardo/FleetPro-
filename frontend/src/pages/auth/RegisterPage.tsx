import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import AuthLayout, { AuthFooterLink, AuthTrustNote } from '@/layouts/AuthLayout';
import Button from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/FormFields';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/constants';
import { getPostAuthRedirect } from '@/routes/navigation';
import { getApiErrorMessage } from '@/utils';

const perks = [
  { icon: Zap, text: '14-day free trial' },
  { icon: ShieldCheck, text: 'No credit card required' },
  { icon: Sparkles, text: 'Setup in under a minute' },
] as const;

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', company_name: '' });
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const { register, registerLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      setRedirecting(true);
      navigate(getPostAuthRedirect(null), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please check your details.'));
    }
  };

  return (
    <AuthLayout
      wide
      title="Start your free trial"
      subtitle="Create your organization and invite your team in minutes"
      footer={<AuthFooterLink text="Already have an account?" linkText="Sign in" to={ROUTES.LOGIN} />}
    >
      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {perks.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/90 px-3 py-2.5">
            <Icon className="h-4 w-4 shrink-0 text-primary-600" />
            <span className="text-xs font-medium leading-tight text-slate-600">{text}</span>
          </div>
        ))}
      </div>

      {error ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 toast-enter" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Company name"
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          placeholder="Acme Logistics"
          required
        />
        <Input
          label="Your full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Jane Smith"
          required
        />
        <Input
          label="Work email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@company.com"
          required
          autoComplete="email"
        />
        <PasswordInput
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Min. 8 characters"
          required
          autoComplete="new-password"
        />
        <PasswordInput
          label="Confirm password"
          value={form.password_confirmation}
          onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
          required
          autoComplete="new-password"
        />

        <Button type="submit" layout="horizontal" loading={registerLoading || redirecting} className="w-full shadow-lg shadow-primary-600/20" size="lg">
          Create organization
        </Button>

        <AuthTrustNote>
          By creating an account, you agree to our terms of service and privacy policy.
        </AuthTrustNote>
      </form>
    </AuthLayout>
  );
}
