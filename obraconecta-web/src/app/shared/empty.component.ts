import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-empty',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <span class="ic"><app-icon [name]="icon()" [size]="28" [stroke]="1.5" /></span>
      <h3>{{ title() }}</h3>
      @if (text()) { <p>{{ text() }}</p> }
      <ng-content />
    </div>
  `,
  styles: [`
    .empty { text-align: center; padding: 48px 20px; border: 1.5px dashed var(--line); border-radius: var(--r-lg); background: var(--surface); }
    .ic { width: 60px; height: 60px; border-radius: 50%; background: var(--primary-soft); color: var(--primary); display: inline-grid; place-items: center; margin-bottom: 12px; }
    h3 { margin: 0 0 6px; font-family: var(--font-display); font-size: 1.15rem; }
    p { margin: 0 auto 16px; color: var(--ink-2); max-width: 42ch; }
  `],
})
export class EmptyComponent {
  readonly icon = input('inbox');
  readonly title = input('');
  readonly text = input('');
}
