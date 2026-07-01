import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import AuthLayout, { AuthFooterLink } from '@/layouts/AuthLayout';
import Button from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/FormFields';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/constants';
import { getPostAuthRedirect } from '@/routes/navigation';
import { getApiErrorMessage } from '@/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const { login, loginLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      setRedirecting(true);
      navigate(getPostAuthRedirect(location.state), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid email or password. Please try again.'));
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your FleetPro workspace"
      footer={<AuthFooterLink text="Don't have an account?" linkText="Create organization" to={ROUTES.REGISTER} />}
    >
      {error ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 toast-enter" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          autoComplete="email"
        />
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />
        <Button type="submit" layout="horizontal" loading={loginLoading || redirecting} className="w-full shadow-lg shadow-primary-600/20" size="lg">
          Sign in to FleetPro
        </Button>
      </form>
    </AuthLayout>
  );
}
