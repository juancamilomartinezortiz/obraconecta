import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-host',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" role="status" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="'toast ' + t.kind">
          <app-icon [name]="t.kind === 'success' ? 'check-circle' : t.kind === 'error' ? 'x' : 'bell'" [size]="18" />
          <span>{{ t.text }}</span>
          <button type="button" aria-label="Cerrar aviso" (click)="toast.dismiss(t.id)"><app-icon name="x" [size]="16" /></button>
        </div>
      }
    </div>
  `,
  styles: [`
    .stack { position: fixed; z-index: 1000; left: 50%; bottom: 88px; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px;
      width: min(440px, calc(100vw - 32px)); pointer-events: none; }
    @media (min-width: 900px) { .stack { bottom: 28px; } }
    .toast { pointer-events: auto; display: flex; align-items: flex-start; gap: 10px; padding: 12px 10px 12px 14px; border-radius: 12px;
      background: var(--ink); color: #fff; box-shadow: var(--shadow-lg); font-size: .95rem; line-height: 1.4; animation: up .25s ease-out; }
    .toast span { flex: 1; padding-top: 1px; }
    .toast.success app-icon { color: #7FD6A3; }
    .toast.error { background: #7A1F1F; }
    .toast.info app-icon { color: var(--accent); }
    button { background: none; border: 0; color: inherit; opacity: .7; cursor: pointer; padding: 2px; border-radius: 6px; }
    button:hover { opacity: 1; }
    @keyframes up { from { opacity: 0; transform: translateY(10px); } }
    @media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
  `],
})
export class ToastHostComponent {
  readonly toast = inject(ToastService);
}
