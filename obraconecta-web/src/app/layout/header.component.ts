import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { AvatarComponent } from '../shared/avatar.component';
import { IconComponent } from '../shared/icon.component';
import { LogoComponent } from './logo.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LogoComponent, AvatarComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header [class.scrolled]="scrolled()">
      <div class="container bar">
        <a routerLink="/" class="brand" aria-label="ObraConecta, inicio"><app-logo /></a>

        <nav class="links" aria-label="Principal">
          <a routerLink="/maestros" routerLinkActive="on">Buscar maestros</a>
          <a routerLink="/trabajos" routerLinkActive="on">Trabajos</a>
          @if (auth.role() === 'client') {
            <a routerLink="/panel/mis-trabajos" routerLinkActive="on">Mis trabajos</a>
          }
          @if (auth.role() === 'worker') {
            <a routerLink="/panel/postulaciones" routerLinkActive="on">Mis postulaciones</a>
          }
          @if (auth.role() === 'admin') {
            <a routerLink="/admin" routerLinkActive="on">Administración</a>
          }
        </nav>

        <div class="right">
          @if (auth.isLoggedIn()) {
            @if (auth.role() === 'client') {
              <a routerLink="/publicar" class="btn btn-accent btn-sm publish"><app-icon name="plus" [size]="18" />Publicar trabajo</a>
            }
            <div class="menu-wrap">
              <button type="button" class="who" (click)="toggleMenu($event)" [attr.aria-expanded]="menu()" aria-haspopup="menu">
                <app-avatar [name]="auth.user()?.name" [src]="auth.user()?.photo_url" [size]="36" [verified]="!!auth.user()?.is_verified" />
                <span class="who-name">{{ auth.firstName() }}</span>
                <app-icon name="chevron-down" [size]="16" />
              </button>
              @if (menu()) {
                <div class="menu" role="menu" (click)="$event.stopPropagation()">
                  <div class="menu-head">
                    <strong>{{ auth.user()?.name }}</strong>
                    <span>{{ roleLabel() }}</span>
                  </div>
                  <a role="menuitem" [routerLink]="auth.homeRoute()" (click)="menu.set(false)"><app-icon name="layers" [size]="18" />Mi panel</a>
                  @if (auth.role() !== 'admin') {
                    <a role="menuitem" routerLink="/panel/perfil" (click)="menu.set(false)"><app-icon name="user" [size]="18" />Mi perfil</a>
                    <a role="menuitem" routerLink="/panel/contratos" (click)="menu.set(false)"><app-icon name="briefcase" [size]="18" />Contrataciones</a>
                    <a role="menuitem" routerLink="/panel/verificacion" (click)="menu.set(false)"><app-icon name="shield" [size]="18" />Verificar identidad</a>
                  }
                  @if (auth.role() === 'worker') {
                    <a role="menuitem" [routerLink]="['/maestros', auth.user()?.worker_profile?.id]" (click)="menu.set(false)"><app-icon name="eye" [size]="18" />Ver mi perfil público</a>
                  }
                  <button role="menuitem" type="button" (click)="logout()"><app-icon name="logout" [size]="18" />Cerrar sesión</button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/ingresar" class="btn btn-ghost btn-sm login">Ingresar</a>
            <a routerLink="/registro" class="btn btn-primary btn-sm">Crear cuenta</a>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    header { position: sticky; top: 0; z-index: 50; background: rgb(246 247 245 / .86); backdrop-filter: saturate(1.4) blur(12px);
      border-bottom: 1px solid transparent; transition: border-color .2s, background .2s; }
    header.scrolled { border-bottom-color: var(--line); background: rgb(255 255 255 / .92); }
    .bar { height: var(--header-h); display: flex; align-items: center; gap: 28px; }
    .brand { text-decoration: none; display: inline-flex; }
    .links { display: none; gap: 4px; flex: 1; }
    .links a { padding: 8px 12px; border-radius: 10px; color: var(--ink-2); font-weight: 600; text-decoration: none; font-size: .95rem; }
    .links a:hover { color: var(--ink); background: var(--surface-2); }
    .links a.on { color: var(--primary); background: var(--primary-soft); }
    .right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
    .publish, .login { display: none; }
    .who { display: inline-flex; align-items: center; gap: 8px; padding: 4px 8px 4px 4px; border-radius: 999px; border: 1px solid var(--line);
      background: var(--surface); cursor: pointer; min-height: 44px; }
    .who:hover { border-color: #BFC6C2; }
    .who-name { font-weight: 600; font-size: .92rem; display: none; }
    .menu-wrap { position: relative; }
    .menu { position: absolute; right: 0; top: calc(100% + 8px); width: 260px; background: var(--surface); border: 1px solid var(--line);
      border-radius: var(--r); box-shadow: var(--shadow-lg); padding: 6px; animation: drop .16s ease-out; }
    @keyframes drop { from { opacity: 0; transform: translateY(-6px); } }
    .menu-head { padding: 10px 12px 12px; border-bottom: 1px solid var(--line-soft); margin-bottom: 6px; display: flex; flex-direction: column; }
    .menu-head span { font-size: .84rem; color: var(--ink-3); }
    .menu a, .menu button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border-radius: 8px; border: 0; background: none;
      text-decoration: none; color: var(--ink); font-weight: 500; font-size: .94rem; cursor: pointer; text-align: left; }
    .menu a:hover, .menu button:hover { background: var(--surface-2); }
    .menu app-icon { color: var(--ink-3); }
    @media (min-width: 640px) { .login { display: inline-flex; } .who-name { display: inline; } }
    @media (min-width: 900px) { .links { display: flex; } .publish { display: inline-flex; } }
  `],
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  readonly menu = signal(false);
  readonly scrolled = signal(false);
  readonly roleLabel = computed(() =>
    ({ worker: 'Maestro / trabajador', client: 'Contratante', admin: 'Administrador' } as const)[this.auth.role() ?? 'worker'],
  );

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.menu.set(false));
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  @HostListener('document:click')
  closeMenu(): void {
    if (this.menu()) this.menu.set(false);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.menu.set(false);
  }

  toggleMenu(e: Event): void {
    e.stopPropagation();
    this.menu.update((v) => !v);
  }

  logout(): void {
    this.menu.set(false);
    this.auth.logout();
  }
}
