import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';

interface Tab { label: string; icon: string; link: string; }

@Component({
  selector: 'app-panel-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page">
      <div class="layout">
        <aside class="side">
          <div class="me">
            <app-avatar [name]="auth.user()?.name" [src]="auth.user()?.photo_url" [size]="48" [verified]="!!auth.user()?.is_verified" />
            <div>
              <strong>{{ auth.user()?.name }}</strong>
              <span>{{ auth.role() === 'worker' ? 'Maestro' : (auth.user()?.client_profile?.business_name || 'Contratante') }}</span>
            </div>
          </div>

          @if (auth.role() === 'worker') {
            <a routerLink="/panel/perfil" class="meter" [class.full]="completeness() === 100">
              <div class="m-top"><span>Perfil completo</span><strong class="num">{{ completeness() }}%</strong></div>
              <div class="m-bar"><span [style.width.%]="completeness()"></span></div>
              @if (completeness() < 100) { <small>Un perfil completo aparece más arriba en las búsquedas.</small> }
            </a>
          }

          <nav aria-label="Panel">
            @for (t of tabs(); track t.link) {
              <a [routerLink]="t.link" routerLinkActive="on"><app-icon [name]="t.icon" [size]="20" />{{ t.label }}</a>
            }
          </nav>
        </aside>
        <section class="content"><router-outlet /></section>
      </div>
    </div>
  `,
  styles: [`
    .layout { display: grid; gap: 20px; }
    @media (min-width: 1000px) { .layout { grid-template-columns: 260px 1fr; gap: 32px; align-items: start; } }
    .side { display: flex; flex-direction: column; gap: 14px; }
    @media (min-width: 1000px) { .side { position: sticky; top: calc(var(--header-h) + 20px); } }
    .me { display: none; align-items: center; gap: 12px; }
    @media (min-width: 1000px) { .me { display: flex; } }
    .me div { display: flex; flex-direction: column; min-width: 0; }
    .me strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .me span { font-size: .85rem; color: var(--ink-3); }
    .meter { display: flex; flex-direction: column; gap: 6px; padding: 14px; border-radius: var(--r); background: var(--accent-soft); color: var(--ink); text-decoration: none; }
    .meter.full { background: var(--ok-soft); }
    .m-top { display: flex; justify-content: space-between; font-size: .88rem; font-weight: 600; }
    .m-bar { height: 6px; border-radius: 3px; background: rgb(29 35 42 / .1); overflow: hidden; }
    .m-bar span { display: block; height: 100%; background: var(--ink); border-radius: 3px; transition: width .5s; }
    .meter.full .m-bar span { background: var(--ok); }
    .meter small { color: var(--ink-2); line-height: 1.35; }
    nav { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 0 16px; }
    nav::-webkit-scrollbar { display: none; }
    @media (min-width: 1000px) { nav { flex-direction: column; margin: 0; padding: 0; } }
    nav a { display: inline-flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; text-decoration: none; color: var(--ink-2);
      font-weight: 600; white-space: nowrap; border: 1px solid var(--line); background: var(--surface); font-size: .93rem; }
    @media (min-width: 1000px) { nav a { border-color: transparent; background: none; } }
    nav a:hover { background: var(--surface-2); color: var(--ink); }
    nav a.on { background: var(--ink); color: #fff; border-color: var(--ink); }
    .content { min-width: 0; }
  `],
})
export class PanelLayout {
  readonly auth = inject(AuthService);

  readonly tabs = computed<Tab[]>(() =>
    this.auth.role() === 'worker'
      ? [
          { label: 'Mis postulaciones', icon: 'send', link: '/panel/postulaciones' },
          { label: 'Contrataciones', icon: 'briefcase', link: '/panel/contratos' },
          { label: 'Mi perfil', icon: 'user', link: '/panel/perfil' },
          { label: 'Mis obras', icon: 'image', link: '/panel/portafolio' },
          { label: 'Verificación', icon: 'shield', link: '/panel/verificacion' },
        ]
      : [
          { label: 'Mis trabajos', icon: 'layers', link: '/panel/mis-trabajos' },
          { label: 'Contrataciones', icon: 'briefcase', link: '/panel/contratos' },
          { label: 'Mi perfil', icon: 'user', link: '/panel/perfil' },
          { label: 'Verificación', icon: 'shield', link: '/panel/verificacion' },
        ],
  );

  /** Qué tan completo está el perfil del maestro (foto, oficios, bio, tarifa, celular, zonas). */
  readonly completeness = computed(() => {
    const u = this.auth.user();
    const w = u?.worker_profile;
    if (!u || !w) return 0;
    const checks = [!!u.photo_url, !!w.specialties?.length, (w.bio?.length ?? 0) >= 40, !!w.daily_rate, !!u.phone, !!w.work_zones, !!u.city_id, u.is_verified];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  });
}
