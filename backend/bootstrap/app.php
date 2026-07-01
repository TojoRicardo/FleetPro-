<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Support\ApiErrorCode;
use App\Support\ApiExceptionRenderer;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api_v2.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'force.json' => \App\Http\Middleware\ForceJsonResponse::class,
            'security.headers' => \App\Http\Middleware\SecurityHeaders::class,
            'token.can' => \App\Http\Middleware\EnsureTokenCanAccess::class,
            'resolve.tenant' => \App\Http\Middleware\ResolveTenant::class,
            'tenant.scope' => \App\Http\Middleware\EnforceTenantScope::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'plan.limit' => \App\Http\Middleware\EnforcePlanLimits::class,
            'super.admin' => \App\Http\Middleware\EnsureSuperAdmin::class,
            'request.log' => \App\Http\Middleware\RequestLogging::class,
        ]);

        // Bearer token auth — no CSRF/session middleware on API routes
        $middleware->throttleApi('api');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, Request $request) {
            if (ApiExceptionRenderer::shouldRenderApi($request)) {
                return ApiExceptionRenderer::json('Validation failed.', 422, ApiErrorCode::ValidationFailed, $e->errors());
            }
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if (ApiExceptionRenderer::shouldRenderApi($request)) {
                return ApiExceptionRenderer::json('Unauthenticated.', 401, ApiErrorCode::Unauthenticated);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, Request $request) {
            if (ApiExceptionRenderer::shouldRenderApi($request)) {
                return ApiExceptionRenderer::json($e->getMessage() ?: 'Forbidden.', 403, ApiErrorCode::Forbidden);
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, Request $request) {
            if (ApiExceptionRenderer::shouldRenderApi($request)) {
                return ApiExceptionRenderer::json('Resource not found.', 404, ApiErrorCode::NotFound);
            }
        });

        $exceptions->render(function (\Illuminate\Http\Exceptions\ThrottleRequestsException $e, Request $request) {
            if (ApiExceptionRenderer::shouldRenderApi($request)) {
                return ApiExceptionRenderer::json('Too many requests. Please slow down.', 429, ApiErrorCode::RateLimited);
            }
        });

        $exceptions->render(function (\Illuminate\Database\QueryException $e, Request $request) {
            if (ApiExceptionRenderer::shouldRenderApi($request)) {
                $message = str_contains(strtolower($e->getMessage()), 'foreign key')
                    ? 'Cannot delete this record because it is linked to other data.'
                    : (config('app.debug') ? $e->getMessage() : 'A database error occurred.');

                return ApiExceptionRenderer::json($message, 500, ApiErrorCode::DatabaseError);
            }
        });

        $exceptions->report(function (\Throwable $e) {
            logger()->error('exception.unhandled', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
        });

        $exceptions->render(function (\Throwable $e, Request $request) {
            if (ApiExceptionRenderer::shouldRenderApi($request)
                && ! $e instanceof \Illuminate\Validation\ValidationException
                && ! $e instanceof \Illuminate\Auth\AuthenticationException
                && ! $e instanceof \Illuminate\Auth\Access\AuthorizationException
                && ! $e instanceof \Symfony\Component\HttpKernel\Exception\HttpException
            ) {
                $message = config('app.debug') ? $e->getMessage() : 'Internal server error.';

                return ApiExceptionRenderer::json($message, 500, ApiErrorCode::InternalError);
            }
        });
    })->create();
