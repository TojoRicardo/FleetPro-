import { randomBytes } from 'crypto';
import prisma from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { serializePayment, serializeInvoice, decimalToNumber } from '../utils/serializers.js';

const PAYABLE_STATUSES = ['open', 'overdue'];
const ALLOWED_METHODS = ['cash', 'mobile_money', 'card'];

export async function payInvoice({
  companyId,
  invoiceId,
  method,
  amount,
  idempotencyKey,
  ipAddress,
  userAgent,
}) {
  if (!ALLOWED_METHODS.includes(method)) {
    throw new AppError(
      'Payment method must be cash, mobile_money, or card.',
      422,
      'INVALID_METHOD',
    );
  }

  const existingByKey = idempotencyKey
    ? await prisma.payment.findFirst({
        where: { tenantId: companyId, idempotencyKey },
        include: { invoice: { include: { company: true, payments: true } } },
      })
    : null;

  if (existingByKey) {
    if (existingByKey.invoiceId !== invoiceId) {
      throw new AppError(
        'Idempotency key already used for a different invoice.',
        409,
        'IDEMPOTENCY_CONFLICT',
      );
    }
    if (existingByKey.status === 'completed') {
      return {
        payment: serializePayment(existingByKey),
        invoice: serializeInvoice(existingByKey.invoice),
        replayed: true,
      };
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM invoices WHERE id = ${invoiceId} AND tenant_id = ${companyId} FOR UPDATE`;

      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, tenantId: companyId },
      });

      if (!invoice) {
        await logAttempt(tx, {
          companyId,
          invoiceId,
          method,
          amount: amount ?? 0,
          idempotencyKey,
          status: 'rejected',
          errorCode: 'INVOICE_NOT_FOUND',
          errorMessage: 'Invoice not found.',
          ipAddress,
          userAgent,
        });
        throw new AppError('Invoice not found.', 404, 'INVOICE_NOT_FOUND');
      }

      const invoiceAmount = decimalToNumber(invoice.amount);

      if (!PAYABLE_STATUSES.includes(invoice.status)) {
        await logAttempt(tx, {
          companyId,
          invoiceId,
          method,
          amount: invoiceAmount,
          idempotencyKey,
          status: 'rejected',
          errorCode: 'INVALID_STATUS',
          errorMessage: `Invoice status '${invoice.status}' is not payable.`,
          ipAddress,
          userAgent,
        });
        throw new AppError(
          `Invoice cannot be paid. Current status: ${invoice.status}.`,
          409,
          'INVALID_STATUS',
        );
      }

      if (amount != null && Math.abs(Number(amount) - invoiceAmount) > 0.01) {
        await logAttempt(tx, {
          companyId,
          invoiceId,
          method,
          amount: Number(amount),
          idempotencyKey,
          status: 'rejected',
          errorCode: 'AMOUNT_MISMATCH',
          errorMessage: 'Payment amount does not match invoice total.',
          ipAddress,
          userAgent,
        });
        throw new AppError(
          `Payment amount must equal invoice total (${invoiceAmount}).`,
          422,
          'AMOUNT_MISMATCH',
        );
      }

      const completedExists = await tx.payment.findFirst({
        where: { invoiceId, status: 'completed' },
      });

      if (completedExists) {
        await logAttempt(tx, {
          companyId,
          invoiceId,
          method,
          amount: invoiceAmount,
          idempotencyKey,
          status: 'rejected',
          errorCode: 'ALREADY_PAID',
          errorMessage: 'Invoice already paid.',
          ipAddress,
          userAgent,
        });
        throw new AppError('This invoice has already been paid.', 409, 'ALREADY_PAID');
      }

      const attempt = await logAttempt(tx, {
        companyId,
        invoiceId,
        method,
        amount: invoiceAmount,
        idempotencyKey,
        status: 'started',
        ipAddress,
        userAgent,
      });

      const payment = await tx.payment.create({
        data: {
          tenantId: companyId,
          invoiceId,
          amount: invoice.amount,
          currency: invoice.currency,
          status: 'completed',
          paymentMethod: method,
          idempotencyKey,
          metadata: { processed_at: new Date().toISOString() },
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
        include: {
          company: { select: { id: true, name: true } },
          payments: true,
        },
      });

      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: { paymentId: payment.id, status: 'succeeded' },
      });

      return {
        payment: serializePayment(payment),
        invoice: serializeInvoice(updatedInvoice),
        replayed: false,
      };
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error.code === 'P2002') {
      const replay = idempotencyKey
        ? await prisma.payment.findFirst({
            where: { tenantId: companyId, idempotencyKey, invoiceId, status: 'completed' },
            include: { invoice: { include: { company: true, payments: true } } },
          })
        : null;

      if (replay) {
        return {
          payment: serializePayment(replay),
          invoice: serializeInvoice(replay.invoice),
          replayed: true,
        };
      }

      throw new AppError(
        'Payment conflict — invoice may already be paid.',
        409,
        'DUPLICATE_PAYMENT',
      );
    }

    await logAttempt(prisma, {
      companyId,
      invoiceId,
      method,
      amount: amount ?? 0,
      idempotencyKey,
      status: 'failed',
      errorCode: 'DB_ERROR',
      errorMessage: error.message,
      ipAddress,
      userAgent,
    });

    throw error;
  }
}

async function logAttempt(client, data) {
  return client.paymentAttempt.create({
    data: {
      tenantId: data.companyId,
      invoiceId: data.invoiceId,
      idempotencyKey: data.idempotencyKey,
      paymentMethod: data.method,
      amount: data.amount,
      status: data.status,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
}
