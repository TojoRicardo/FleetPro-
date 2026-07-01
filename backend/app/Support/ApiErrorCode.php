<?php

namespace App\Support;

enum ApiErrorCode: string
{
    case Success = 'SUCCESS';
    case ValidationFailed = 'VALIDATION_FAILED';
    case Unauthenticated = 'UNAUTHENTICATED';
    case Forbidden = 'FORBIDDEN';
    case NotFound = 'NOT_FOUND';
    case RateLimited = 'RATE_LIMITED';
    case DatabaseError = 'DATABASE_ERROR';
    case InternalError = 'INTERNAL_ERROR';
    case PlanLimitExceeded = 'PLAN_LIMIT_EXCEEDED';
    case PaymentFailed = 'PAYMENT_FAILED';
    case TenantSuspended = 'TENANT_SUSPENDED';
    case InvalidToken = 'INVALID_TOKEN';
    case TokenExpired = 'TOKEN_EXPIRED';
}
