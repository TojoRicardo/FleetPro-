import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/constants';
import {
  AlertTriangle,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  RefreshCw,
  Tag,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import PaymentModal, { type PaymentMethod } from '@/components/billing/PaymentModal';
import InvoiceDetailModal from '@/components/billing/InvoiceDetailModal';
import {
  getAllInvoices,
  getInvoiceById,
  payInvoice,
  getBillingErrorMessage,
} from '@/api/billing';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/utils';
import { BILLING_COPY } from '@/i18n/fr';
import type { BillingInvoice, InvoiceStatusFilter } from '@/types/billing';

const statusTabs: { key: InvoiceStatusFilter; label: string; apiStatus?: 'pending' | 'paid' | 'overdue' }[] = [
  { key: 'all', label: BILLING_COPY.invoices.tabs.all },
  { key: 'pending', label: BILLING_COPY.invoices.tabs.pending, apiStatus: 'pending' },
  { key: 'paid', label: BILLING_COPY.invoices.tabs.paid, apiStatus: 'paid' },
  { key: 'overdue', label: BILLING_COPY.invoices.tabs.overdue, apiStatus: 'overdue' },
];

function idempotencyKey(invoiceId: number) {
  return `pay-${invoiceId}-${crypto.randomUUID()}`;
}

export default function BillingPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin');
  const location = useLocation();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all');
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [summary, setSummary] = useState({
    total_revenue: 0,
    pending_amount: 0,
    overdue_amount: 0,
    currency: 'USD',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<BillingInvoice | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<BillingInvoice | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const activeTab = statusTabs.find((t) => t.key === statusFilter)!;

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllInvoices(
        activeTab.apiStatus ? { status: activeTab.apiStatus } : undefined,
      );
      setInvoices(data.invoices);
      setSummary(data.summary);
    } catch (err) {
      setError(getBillingErrorMessage(err, BILLING_COPY.errors.load));
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab.apiStatus]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    const state = location.state as {
      pendingInvoice?: BillingInvoice | null;
      openPayment?: boolean;
    } | null;

    if (!state?.pendingInvoice) return;

    if (state.openPayment) {
      setPayTarget(state.pendingInvoice);
      setPayError(null);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const openDetails = async (invoice: BillingInvoice) => {
    setDetailInvoice(invoice);
    setDetailLoading(true);
    try {
      const fresh = await getInvoiceById(invoice.id);
      setDetailInvoice(fresh);
    } catch (err) {
      setError(getBillingErrorMessage(err, BILLING_COPY.errors.details));
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePay = async (method: PaymentMethod) => {
    if (!payTarget) return;
    setPaying(true);
    setPayError(null);
    try {
      await payInvoice({
        invoiceId: payTarget.id,
        method,
        amount: payTarget.total_amount,
        idempotencyKey: idempotencyKey(payTarget.id),
      });
      setPayTarget(null);
      await loadInvoices();
    } catch (err) {
      setPayError(getBillingErrorMessage(err, BILLING_COPY.errors.pay));
    } finally {
      setPaying(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'ID',
        render: (row: BillingInvoice) => (
          <span className="font-mono text-sm text-slate-500">#{row.id}</span>
        ),
      },
      {
        key: 'company',
        label: 'Entreprise',
        render: (row: BillingInvoice) => (
          <span className="font-medium">{row.company?.name ?? `Company #${row.company_id}`}</span>
        ),
      },
      {
        key: 'number',
        label: 'Facture',
        render: (row: BillingInvoice) => <span className="font-mono text-sm">{row.number}</span>,
      },
      {
        key: 'amount',
        label: 'Montant',
        render: (row: BillingInvoice) => (
          <span className="font-semibold">{formatCurrency(row.total_amount, row.currency)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Statut',
        render: (row: BillingInvoice) => (
          <Badge variant={row.status}>{row.status}</Badge>
        ),
      },
      {
        key: 'due_date',
        label: 'Échéance',
        render: (row: BillingInvoice) => (
          <span className="text-slate-500">
            {row.due_date ? formatDate(row.due_date) : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '',
        render: (row: BillingInvoice) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => openDetails(row)}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              <span>Voir</span>
            </Button>
            {canManage && (row.status === 'pending' || row.status === 'overdue') && (
              <Button size="sm" disabled={paying} onClick={() => setPayTarget(row)}>
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                <span>{BILLING_COPY.invoices.pay}</span>
              </Button>
            )}
          </div>
        ),
      },
    ],
    [paying, canManage],
  );

  if (loading && invoices.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={ROUTES.PRICING}>
            <Button variant="outline" size="sm">
              <Tag className="h-4 w-4" aria-hidden="true" />
              <span>{BILLING_COPY.invoices.viewPricing}</span>
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={loadInvoices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{BILLING_COPY.refresh}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title={BILLING_COPY.stats.revenue}
            value={formatCurrency(summary.total_revenue, summary.currency)}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title={BILLING_COPY.stats.pending}
            value={formatCurrency(summary.pending_amount, summary.currency)}
            icon={Clock}
            color="amber"
          />
          <StatCard
            title={BILLING_COPY.stats.overdue}
            value={formatCurrency(summary.overdue_amount, summary.currency)}
            icon={AlertTriangle}
            color="red"
          />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-base font-semibold text-[var(--text)]">{BILLING_COPY.invoices.title}</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                statusFilter === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <CardSkeleton />
        ) : invoices.length === 0 ? (
          <EmptyState
            title={BILLING_COPY.invoices.emptyTitle}
            description={error ?? BILLING_COPY.invoices.emptyDescription}
            icon={CreditCard}
          />
        ) : (
          <DataTable columns={columns} data={invoices} />
        )}
      </div>

      <PaymentModal
        open={!!payTarget}
        onClose={() => {
          setPayTarget(null);
          setPayError(null);
        }}
        invoice={payTarget}
        onPay={handlePay}
        loading={paying}
        error={payError}
      />

      <InvoiceDetailModal
        open={!!detailInvoice}
        onClose={() => setDetailInvoice(null)}
        invoice={detailInvoice}
        loading={detailLoading}
      />
    </div>
  );
}
