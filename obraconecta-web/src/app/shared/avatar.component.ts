import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { initials } from '../core/format';

/** Foto de perfil o iniciales sobre un tono estable derivado del nombre. */
const TONES = [
  ['#DCE6F3', '#1F4E8C'], ['#F7E7B4', '#6B5100'], ['#DDEBE2', '#1E6A43'],
  ['#EADFF0', '#5B3A75'], ['#E4E7EA', '#3A4148'], ['#F3DED6', '#7A3720'],
];

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src()) {
      <img [src]="src()" [alt]="'Foto de ' + name()" [style.width.px]="size()" [style.height.px]="size()" loading="lazy" />
    } @else {
      <span class="ini" [style.width.px]="size()" [style.height.px]="size()" [style.font-size.px]="size() * 0.38"
        [style.background]="tone()[0]" [style.color]="tone()[1]" aria-hidden="true">{{ letters() }}</span>
    }
    @if (verified()) {
      <span class="badge" title="Identidad verificada" [style.width.px]="size() * 0.34" [style.height.px]="size() * 0.34">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 12.5 4 4L18 8"/></svg>
      </span>
    }
  `,
  styles: [`
    :host { position: relative; display: inline-flex; flex: none; }
    img, .ini { border-radius: 50%; object-fit: cover; display: inline-flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-weight: 700; letter-spacing: -.02em; }
    .badge { position: absolute; right: -2px; bottom: -2px; min-width: 16px; min-height: 16px; border-radius: 50%;
      background: var(--ok); border: 2px solid var(--surface); display: flex; align-items: center; justify-content: center; }
    .badge svg { width: 62%; height: 62%; }
  `],
})
export class AvatarComponent {
  readonly name = input<string | null | undefined>('');
  readonly src = input<string | null | undefined>(null);
  readonly size = input(44);
  readonly verified = input(false);
  readonly letters = computed(() => initials(this.name()));
  readonly tone = computed(() => {
    const n = this.name() ?? '';
    let h = 0;
    for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return TONES[h % TONES.length];
  });
}
