import { Link } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ROUTES } from '@/routes/constants';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="flex max-w-md flex-col items-center py-16 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
          <ShieldOff className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-lg font-semibold text-[var(--text)]">Accès refusé</h1>
        <p className="mt-2 max-w-xs text-sm text-[var(--color-text-secondary)]">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <Link to={ROUTES.DASHBOARD} className="mt-6">
          <Button>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Retour au tableau de bord</span>
          </Button>
        </Link>
      </Card>
    </div>
  );
}
