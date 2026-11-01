import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { IconComponent } from './icon.component';

/** Diálogo nativo <dialog>: maneja el foco, Escape y el fondo por nosotros. */
@Component({
  selector: 'app-modal',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dlg (close)="closed.emit()" (click)="backdrop($event)" [class.wide]="wide()" [attr.aria-labelledby]="'mt-' + uid">
      <div class="box">
        <header>
          <h2 [id]="'mt-' + uid">{{ title() }}</h2>
          <button type="button" class="btn-icon" aria-label="Cerrar" (click)="close()"><app-icon name="x" /></button>
        </header>
        <div class="body"><ng-content /></div>
        <ng-content select="[modal-footer]" />
      </div>
    </dialog>
  `,
  styles: [`
    dialog { border: 0; padding: 0; border-radius: var(--r-lg); width: min(560px, calc(100vw - 24px)); max-height: calc(100dvh - 32px);
      background: var(--surface); color: var(--ink); box-shadow: var(--shadow-lg); }
    dialog.wide { width: min(880px, calc(100vw - 24px)); }
    dialog::backdrop { background: rgb(20 28 38 / .55); backdrop-filter: blur(2px); }
    dialog[open] { animation: pop .22s cubic-bezier(.2,.9,.3,1.2); }
    @keyframes pop { from { opacity: 0; transform: translateY(12px) scale(.98); } }
    .box { display: flex; flex-direction: column; max-height: calc(100dvh - 32px); }
    header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px 6px 24px; }
    h2 { margin: 0; font-family: var(--font-display); font-size: 1.3rem; letter-spacing: -.01em; }
    .body { padding: 8px 24px 24px; overflow: auto; }
    @media (prefers-reduced-motion: reduce) { dialog[open] { animation: none; } }
  `],
})
export class ModalComponent {
  readonly title = input('');
  readonly open = input(false);
  readonly wide = input(false);
  readonly closed = output<void>();
  readonly uid = Math.random().toString(36).slice(2, 8);
  private dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    effect(() => {
      const d = this.dlg().nativeElement;
      if (this.open() && !d.open) d.showModal();
      if (!this.open() && d.open) d.close();
    });
  }

  close(): void {
    this.dlg().nativeElement.close();
  }

  backdrop(e: MouseEvent): void {
    if (e.target === this.dlg().nativeElement) this.close();
  }
}
