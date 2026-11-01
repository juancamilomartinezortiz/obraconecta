import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

/** Estrellas de solo lectura (con medias estrellas) o editable con `editable`. */
@Component({
  selector: 'app-stars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (editable()) {
      <div class="pick" role="radiogroup" aria-label="Calificación" (mouseleave)="hover.set(0)">
        @for (s of five; track s) {
          <button type="button" role="radio" [attr.aria-checked]="value() === s" [attr.aria-label]="s + (s === 1 ? ' estrella' : ' estrellas')"
            [class.on]="(hover() || value()) >= s" (mouseenter)="hover.set(s)" (click)="value.set(s)">
            <svg viewBox="0 0 24 24"><path d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.1 6.4 20l1.1-6.2L3 9.4l6.2-.9L12 2.8z"/></svg>
          </button>
        }
        <span class="hint">{{ labels[(hover() || value())] }}</span>
      </div>
    } @else {
      <span class="row" [attr.aria-label]="'Calificación ' + rounded() + ' de 5'" role="img">
        @for (s of five; track s) {
          <svg viewBox="0 0 24 24" [style.width.px]="size()" [style.height.px]="size()">
            <defs><linearGradient [attr.id]="gid + s"><stop [attr.offset]="fill(s)" stop-color="var(--star)"/><stop [attr.offset]="fill(s)" stop-color="var(--star-off)"/></linearGradient></defs>
            <path [attr.fill]="'url(#' + gid + s + ')'" d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.1 6.4 20l1.1-6.2L3 9.4l6.2-.9L12 2.8z"/>
          </svg>
        }
      </span>
    }
  `,
  styles: [`
    :host { display: inline-flex; }
    .row { display: inline-flex; gap: 1px; }
    .pick { display: flex; align-items: center; gap: 4px; }
    .pick button { background: none; border: 0; padding: 2px; cursor: pointer; width: 44px; height: 44px; border-radius: 10px; display: grid; place-items: center; }
    .pick button svg { width: 34px; height: 34px; fill: var(--star-off); transition: transform .15s, fill .15s; }
    .pick button.on svg { fill: var(--star); }
    .pick button:hover svg { transform: scale(1.12); }
    .hint { margin-left: 8px; font-weight: 600; color: var(--ink-2); min-width: 90px; }
  `],
})
export class StarsComponent {
  readonly rating = input<number | string>(0);
  readonly size = input(16);
  readonly editable = input(false);
  readonly value = model(0);
  readonly hover = signal(0);
  readonly five = [1, 2, 3, 4, 5];
  readonly labels = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];
  readonly gid = 'st' + Math.random().toString(36).slice(2, 8);
  readonly rounded = computed(() => Number(this.rating() || 0).toFixed(1));

  fill(s: number): string {
    const r = Number(this.rating() || 0);
    const pct = Math.max(0, Math.min(1, r - (s - 1)));
    return `${Math.round(pct * 100)}%`;
  }
}
