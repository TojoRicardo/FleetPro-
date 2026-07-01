import prisma from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import {
  mapInvoiceStatusFromApi,
  serializeInvoice,
  decimalToNumber,
} from '../utils/serializers.js';

const invoiceInclude = {
  company: { select: { id: true, name: true } },
  payments: { orderBy: { createdAt: 'desc' } },
  subscription: {
    include: { plan: true },
  },
};

export async function listInvoices(companyId, { status, page = 1, limit = 20 }) {
  const where = { tenantId: companyId };

  if (status) {
    where.status = mapInvoiceStatusFromApi(status);
  }

  const [invoices, total, revenueAgg, pendingAgg, overdueAgg] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where: { tenantId: companyId, status: 'paid' },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { tenantId: companyId, status: 'open' },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { tenantId: companyId, status: 'overdue' },
      _sum: { amount: true },
    }),
  ]);

  return {
    invoices: invoices.map(serializeInvoice),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit) || 1,
    },
    summary: {
      total_revenue: decimalToNumber(revenueAgg._sum.amount),
      pending_amount: decimalToNumber(pendingAgg._sum.amount),
      overdue_amount: decimalToNumber(overdueAgg._sum.amount),
      currency: 'USD',
    },
  };
}

export async function getInvoiceById(companyId, invoiceId) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: companyId },
    include: {
      ...invoiceInclude,
      paymentAttempts: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!invoice) {
    throw new AppError('Invoice not found.', 404, 'INVOICE_NOT_FOUND');
  }

  return serializeInvoice(invoice);
}

export async function markOverdueInvoices() {
  const result = await prisma.invoice.updateMany({
    where: {
      status: 'open',
      dueDate: { lt: new Date() },
    },
    data: { status: 'overdue' },
  });
  return result.count;
}
