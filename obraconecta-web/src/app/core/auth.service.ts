import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Role, User } from './models';

const TOKEN_KEY = 'oc_token';
const USER_KEY = 'oc_user';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private _token = signal<string | null>(read(TOKEN_KEY));
  private _user = signal<User | null>(this.restoreUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token() && !!this._user());
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);
  readonly firstName = computed(() => (this._user()?.name ?? '').split(' ')[0]);

  /** Ruta de inicio del panel según el rol. */
  readonly homeRoute = computed(() => {
    switch (this.role()) {
      case 'admin': return '/admin';
      case 'client': return '/panel/mis-trabajos';
      case 'worker': return '/panel/postulaciones';
      default: return '/';
    }
  });

  login(email: string, password: string): Observable<unknown> {
    return this.api.login(email, password).pipe(tap((r) => this.setSession(r.token, r.user)));
  }

  register(body: Record<string, unknown>): Observable<unknown> {
    return this.api.register(body).pipe(tap((r) => this.setSession(r.token, r.user)));
  }

  /** Vuelve a pedir el usuario al backend (después de editar perfil, etc.). */
  refresh(): void {
    if (!this._token()) return;
    this.api.me().subscribe({ next: (u) => this.setUser(u), error: () => {} });
  }

  setUser(user: User): void {
    this._user.set(user);
    try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* sin almacenamiento */ }
  }

  logout(redirect = true): void {
    if (this._token()) {
      this.api.logout().subscribe({ error: () => {} });
    }
    this.clear();
    if (redirect) this.router.navigateByUrl('/');
  }

  /** Limpia la sesión sin llamar al backend (token vencido). */
  clear(): void {
    this._token.set(null);
    this._user.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch { /* sin almacenamiento */ }
  }

  private setSession(token: string, user: User): void {
    this._token.set(token);
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* sin almacenamiento */ }
    this.setUser(user);
  }

  private restoreUser(): User | null {
    const raw = read(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  }
}
