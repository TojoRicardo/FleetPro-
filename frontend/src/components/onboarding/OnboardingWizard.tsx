import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Users, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useUIStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/constants';

const STEPS = [
  {
    id: 'welcome',
    title: 'Bienvenue sur FleetPro',
    description: 'Configurez votre flotte en quelques étapes.',
  },
  {
    id: 'vehicle',
    title: 'Ajoutez votre premier véhicule',
    description: 'Enregistrez un véhicule pour commencer le suivi.',
    action: { label: 'Ajouter un véhicule', to: ROUTES.VEHICLES },
    icon: Car,
  },
  {
    id: 'team',
    title: 'Invitez votre équipe',
    description: 'Ajoutez des conducteurs et assignez-les à vos véhicules.',
    action: { label: 'Gérer les conducteurs', to: ROUTES.DRIVERS },
    icon: Users,
  },
  {
    id: 'done',
    title: 'Tout est prêt !',
    description: 'Explorez le tableau de bord et les analytiques.',
    icon: CheckCircle2,
  },
] as const;

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const dismissed = useUIStore((s) => s.dismissedTips.includes('onboarding-wizard'));
  const dismissTip = useUIStore((s) => s.dismissTip);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (dismissed || !user) return null;

  const current = STEPS[step];
  const Icon = 'icon' in current ? current.icon : Sparkles;
  const isLast = step === STEPS.length - 1;

  const close = () => dismissTip('onboarding-wizard');

  const next = () => {
    if (isLast) {
      close();
      return;
    }
    setStep((s) => s + 1);
  };

  const handleAction = () => {
    if ('action' in current && current.action) {
      close();
      navigate(current.action.to);
    } else {
      next();
    }
  };

  return (
    <Modal open={true} title="" onClose={close} size="md">
      <div className="space-y-6" role="dialog" aria-labelledby="onboarding-title">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Étape {step + 1} / {STEPS.length}</p>
            <h2 id="onboarding-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              {current.title}
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400">{current.description}</p>

        <div className="flex justify-between gap-3">
          <Button layout="horizontal" variant="ghost" onClick={close} aria-label="Passer l'introduction">
            Passer
          </Button>
          <Button layout="horizontal" onClick={'action' in current && current.action ? handleAction : next}>
            {'action' in current && current.action ? current.action.label : isLast ? 'Commencer' : 'Suivant'}
            {!isLast && !('action' in current && current.action) && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
