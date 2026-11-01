import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" [attr.fill]="light() ? '#fff' : '#1F4E8C'" />
      <path d="M14 42h36v-4a2 2 0 0 0-2-2H16a2 2 0 0 0-2 2v4z" fill="#F2B705" />
      <path d="M18 36a14 14 0 0 1 28 0" fill="none" stroke="#F2B705" stroke-width="5" />
      <path d="M28 22v-5h8v5" fill="none" stroke="#F2B705" stroke-width="4" />
    </svg>
    <span class="word" [class.light]="light()">Obra<b>Conecta</b></span>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; gap: 10px; }
    .word { font-family: var(--font-display); font-weight: 600; font-size: 1.28rem; letter-spacing: -.03em; color: var(--ink); }
    .word b { font-weight: 800; color: var(--primary); }
    .word.light, .word.light b { color: #fff; }
  `],
})
export class LogoComponent {
  readonly size = input(34);
  readonly light = input(false);
}
