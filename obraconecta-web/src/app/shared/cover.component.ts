import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from './icon.component';

/**
 * Portada ilustrada para obras sin foto: un pliego de plano con la herramienta del oficio
 * y cotas, con un tono distinto por especialidad.
 */
const PALETTES: Record<string, [string, string]> = {
  brick: ['#F3DED6', '#8A3B1E'], trowel: ['#E4E7EA', '#3A4148'], bolt: ['#F7E7B4', '#6B5100'],
  pipe: ['#DCE6F3', '#1F4E8C'], roller: ['#EADFF0', '#5B3A75'], tiles: ['#DDEBE2', '#1E6A43'],
  saw: ['#EFE3D3', '#6B4A22'], beam: ['#E4E7EA', '#24292E'], flame: ['#F6DFD3', '#8A3B1E'], roof: ['#DCE6F3', '#1F4E8C'],
};

@Component({
  selector: 'app-cover',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src()) {
      <img [src]="src()" [alt]="alt()" loading="lazy" />
    } @else {
      <div class="art" [style.background-color]="pal()[0]" [style.color]="pal()[1]">
        <svg class="grid" viewBox="0 0 200 150" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern [attr.id]="pid" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M12 0H0V12" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width=".6"/>
            </pattern>
          </defs>
          <rect width="200" height="150" [attr.fill]="'url(#' + pid + ')'"/>
          <path d="M24 122h152M24 118v8M176 118v8" stroke="currentColor" stroke-opacity=".45" stroke-width="1"/>
          <path d="M178 24v86M174 24h8M174 110h8" stroke="currentColor" stroke-opacity=".45" stroke-width="1"/>
        </svg>
        <app-icon [name]="icon() || 'hardhat'" [size]="iconSize()" [stroke]="1.4" />
      </div>
    }
  `,
  styles: [`
    :host { display: block; overflow: hidden; background: var(--line-soft); }
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .art { position: relative; width: 100%; height: 100%; display: grid; place-items: center; }
    .grid { position: absolute; inset: 0; width: 100%; height: 100%; }
    app-icon { position: relative; opacity: .85; }
  `],
})
export class CoverComponent {
  readonly src = input<string | null | undefined>(null);
  readonly icon = input<string | null | undefined>('hardhat');
  readonly alt = input('');
  readonly iconSize = input(44);
  readonly pid = 'pg' + Math.random().toString(36).slice(2, 8);
  readonly pal = computed(() => PALETTES[this.icon() ?? ''] ?? ['#E8ECF1', '#1F4E8C']);
}
