import { useState, useEffect } from 'react';
import { Banknote, CreditCard, Smartphone } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { cn, formatCurrency } from '@/utils';
import type { BillingInvoice } from '@/types/billing';

export type PaymentMethod = 'cash' | 'mobile_money' | 'card';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoice: BillingInvoice | null;
  onPay: (method: PaymentMethod) => void;
  loading?: boolean;
  error?: string | null;
  /** Étape initiale : choix du moyen ou confirmation directe */
  initialStep?: 'method' | 'confirm';
}

function StepBadge({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <span
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
        done && 'bg-emerald-600 text-white',
        !done && active && 'bg-primary-600 text-white',
        !done && !active && 'bg-slate-200 text-slate-500',
      )}
      aria-hidden
    >
      {done ? '✓' : label}
    </span>
  );
}

const methods: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: typeof CreditCard;
}[] = [
  { id: 'cash', label: 'Espèces', description: 'Paiement en cash sur place', icon: Banknote },
  { id: 'mobile_money', label: 'Mobile Money', description: 'M-Pesa, Orange Money, MVola…', icon: Smartphone },
  { id: 'card', label: 'Carte bancaire', description: 'Visa, Mastercard, débit', icon: CreditCard },
];

export default function PaymentModal({
  open,
  onClose,
  invoice,
  onPay,
  loading,
  error,
  initialStep = 'method',
}: PaymentModalProps) {
  const [step, setStep] = useState<'method' | 'confirm'>(initialStep);
  const [selected, setSelected] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setSelected(null);
    }
  }, [open, invoice?.id, initialStep]);

  const selectedMethod = methods.find((m) => m.id === selected);

  const reset = () => {
    setStep(initialStep);
    setSelected(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isOpen = open && !!invoice;

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={
        !invoice
          ? 'Paiement'
          : step === 'method'
            ? 'Choisir le mode de paiement'
            : 'Confirmer le paiement'
      }
      description={
        invoice && step === 'method'
          ? `Facture ${invoice.number} — ${formatCurrency(invoice.total_amount, invoice.currency)}`
          : undefined
      }
      size="md"
    >
      {invoice ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'flex items-center gap-1 font-medium',
                step === 'method' ? 'text-primary-600' : 'text-emerald-600',
              )}
            >
              <StepBadge done={step === 'confirm'} active={step === 'method'} label="1" />
              Mode de paiement
            </span>
            <span className="text-[var(--color-text-secondary)]">→</span>
            <span
              className={cn(
                'flex items-center gap-1 font-medium',
                step === 'confirm' ? 'text-primary-600' : 'text-[var(--color-text-secondary)]',
              )}
            >
              <StepBadge done={false} active={step === 'confirm'} label="2" />
              Confirmation
            </span>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div key={step}>
            {step === 'method' ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  {methods.map(({ id, label, description, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      disabled={loading}
                      onClick={() => setSelected(id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                        selected === id
                          ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500/30'
                          : 'border-[var(--border)] hover:border-primary-300',
                        loading && 'opacity-50',
                      )}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100">
                        <Icon className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button layout="horizontal" variant="secondary" size="sm" onClick={handleClose} disabled={loading}>
                    Annuler
                  </Button>
                  <Button
                    layout="horizontal"
                    size="sm"
                    disabled={!selected || loading}
                    onClick={() => setStep('confirm')}
                  >
                    Continuer
                  </Button>
                </div>
              </div>
            ) : selectedMethod ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--color-surface-secondary)] p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Facture</span>
                    <span className="font-mono">{invoice.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Mode</span>
                    <span className="font-medium">{selectedMethod.label}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border)] pt-2">
                    <span className="font-medium">Total à payer</span>
                    <span className="text-lg font-bold text-primary-600">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button layout="horizontal" variant="secondary" size="sm" onClick={() => setStep('method')} disabled={loading}>
                    Retour
                  </Button>
                  <Button
                    layout="horizontal"
                    size="sm"
                    loading={loading}
                    onClick={() => onPay(selected!)}
                  >
                    Confirmer le paiement
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
