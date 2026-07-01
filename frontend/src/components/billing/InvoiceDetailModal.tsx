import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';
import type { BillingInvoice } from '@/types/billing';

interface InvoiceDetailModalProps {
  open: boolean;
  onClose: () => void;
  invoice: BillingInvoice | null;
  loading?: boolean;
}

export default function InvoiceDetailModal({
  open,
  onClose,
  invoice,
  loading,
}: InvoiceDetailModalProps) {
  const isOpen = open && !!invoice;
  const lineItems = invoice?.line_items ?? [];

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={invoice ? `Facture ${invoice.number}` : 'Facture'}
      size="lg"
    >
      {!invoice ? null : loading ? (
        <CardSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={invoice.status}>{invoice.status}</Badge>
            <span className="text-2xl font-bold">
              {formatCurrency(invoice.total_amount, invoice.currency)}
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[var(--color-text-secondary)]">Entreprise</dt>
              <dd className="font-medium">{invoice.company?.name ?? `#${invoice.company_id}`}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-secondary)]">Véhicules</dt>
              <dd className="font-medium">{invoice.number_of_vehicles}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-secondary)]">Prix unitaire</dt>
              <dd className="font-medium">{formatCurrency(invoice.unit_price, invoice.currency)}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-secondary)]">Échéance</dt>
              <dd className="font-medium">{invoice.due_date ? formatDate(invoice.due_date) : '—'}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-secondary)]">Créée le</dt>
              <dd className="font-medium">{formatDateTime(invoice.created_at)}</dd>
            </div>
            {invoice.paid_at && (
              <div>
                <dt className="text-[var(--color-text-secondary)]">Payée le</dt>
                <dd className="font-medium">{formatDateTime(invoice.paid_at)}</dd>
              </div>
            )}
          </dl>

          {lineItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Détails</h3>
              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-surface-secondary)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Description</th>
                      <th className="px-4 py-2 text-right font-medium">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, i) => (
                      <tr key={i} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(Number(item.amount), invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {invoice.payments && invoice.payments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Paiements</h3>
              <ul className="space-y-2">
                {invoice.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex justify-between rounded-lg bg-[var(--color-surface-secondary)] px-4 py-2 text-sm"
                  >
                    <span className="capitalize">
                      {payment.method?.replace(/_/g, ' ') ?? 'Paiement'}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
