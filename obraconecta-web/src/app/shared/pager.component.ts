import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-pager',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (last() > 1) {
      <nav class="pager" aria-label="Paginación">
        <button type="button" class="btn btn-sm" [disabled]="page() <= 1" (click)="go.emit(page() - 1)" aria-label="Página anterior"><app-icon name="chevron-left" [size]="18" /></button>
        @for (p of pages(); track $index) {
          @if (p === 0) { <span class="gap">…</span> }
          @else { <button type="button" class="btn btn-sm" [class.on]="p === page()" [attr.aria-current]="p === page() ? 'page' : null" (click)="go.emit(p)">{{ p }}</button> }
        }
        <button type="button" class="btn btn-sm" [disabled]="page() >= last()" (click)="go.emit(page() + 1)" aria-label="Página siguiente"><app-icon name="chevron-right" [size]="18" /></button>
      </nav>
    }
  `,
  styles: [`
    .pager { display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 28px; flex-wrap: wrap; }
    .btn { min-width: 40px; padding: 0 10px; }
    .btn.on { background: var(--ink); color: #fff; border-color: var(--ink); }
    .gap { color: var(--ink-3); padding: 0 4px; }
  `],
})
export class PagerComponent {
  readonly page = input(1);
  readonly last = input(1);
  readonly go = output<number>();
  readonly pages = computed(() => {
    const cur = this.page(), last = this.last();
    const set = new Set([1, last, cur - 1, cur, cur + 1].filter((p) => p >= 1 && p <= last));
    const sorted = [...set].sort((a, b) => a - b);
    const out: number[] = [];
    sorted.forEach((p, i) => { if (i && p - sorted[i - 1] > 1) out.push(0); out.push(p); });
    return out;
  });
}
