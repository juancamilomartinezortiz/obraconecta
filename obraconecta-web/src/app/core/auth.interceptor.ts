import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const token = auth.token();

  const request = req.clone({
    setHeaders: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && token) {
        auth.clear();
        toast.info('Tu sesión terminó. Vuelve a ingresar.');
        router.navigate(['/ingresar'], { queryParams: { volver: router.url } });
      } else if (err.status === 0) {
        toast.error('No hay conexión con el servidor. Revisa que Laravel esté corriendo (php artisan serve).');
      } else if (err.status >= 500) {
        toast.error('El servidor tuvo un problema. Intenta de nuevo en un momento.');
      }
      return throwError(() => err);
    }),
  );
};

/** Extrae el primer mensaje de error legible de una respuesta de Laravel. */
export function errorMessage(err: unknown, fallback = 'No se pudo completar la acción.'): string {
  const e = err as HttpErrorResponse;
  const body = e?.error as { message?: string; errors?: Record<string, string[]> } | null;
  if (body?.errors) {
    const first = Object.values(body.errors)[0];
    if (first?.length) return first[0];
  }
  return body?.message || fallback;
}

/** Errores de validación por campo: { email: 'Ya existe...' } */
export function fieldErrors(err: unknown): Record<string, string> {
  const body = (err as HttpErrorResponse)?.error as { errors?: Record<string, string[]> } | null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(body?.errors ?? {})) out[k] = v[0];
  return out;
}
