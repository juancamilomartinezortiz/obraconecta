import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { IconComponent } from '../shared/icon.component';

interface Item { label: string; icon: string; link: string; exact?: boolean; }

/** Navegación inferior para celular (la que más usan los maestros). */
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Navegación rápida">
      @for (it of items(); track it.link) {
        <a [routerLink]="it.link" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: !!it.exact }">
          <app-icon [name]="it.icon" [size]="22" />
          <span>{{ it.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    nav { position: fixed; z-index: 60; left: 0; right: 0; bottom: 0; height: calc(68px + env(safe-area-inset-bottom));
      padding-bottom: env(safe-area-inset-bottom); background: var(--surface); border-top: 1px solid var(--line);
      display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    a { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; text-decoration: none;
      color: var(--ink-3); font-size: .72rem; font-weight: 600; position: relative; }
    a.on { color: var(--primary); }
    a.on::before { content: ''; position: absolute; top: 0; left: 28%; right: 28%; height: 3px; border-radius: 0 0 3px 3px; background: var(--accent); }
    @media (min-width: 900px) { nav { display: none; } }
  `],
})
export class BottomNavComponent {
  private auth = inject(AuthService);

  readonly items = computed<Item[]>(() => {
    switch (this.auth.role()) {
      case 'worker':
        return [
          { label: 'Trabajos', icon: 'search', link: '/trabajos' },
          { label: 'Postulaciones', icon: 'send', link: '/panel/postulaciones' },
          { label: 'Contratos', icon: 'briefcase', link: '/panel/contratos' },
          { label: 'Mi perfil', icon: 'user', link: '/panel/perfil' },
        ];
      case 'client':
        return [
          { label: 'Maestros', icon: 'search', link: '/maestros' },
          { label: 'Publicar', icon: 'plus', link: '/publicar' },
          { label: 'Mis trabajos', icon: 'users', link: '/panel/mis-trabajos' },
          { label: 'Contratos', icon: 'briefcase', link: '/panel/contratos' },
        ];
      case 'admin':
        return [
          { label: 'Inicio', icon: 'roof', link: '/', exact: true },
          { label: 'Admin', icon: 'chart', link: '/admin' },
          { label: 'Maestros', icon: 'users', link: '/maestros' },
          { label: 'Trabajos', icon: 'briefcase', link: '/trabajos' },
        ];
      default:
        return [
          { label: 'Inicio', icon: 'roof', link: '/', exact: true },
          { label: 'Maestros', icon: 'users', link: '/maestros' },
          { label: 'Trabajos', icon: 'briefcase', link: '/trabajos' },
          { label: 'Ingresar', icon: 'user', link: '/ingresar' },
        ];
    }
  });
}
