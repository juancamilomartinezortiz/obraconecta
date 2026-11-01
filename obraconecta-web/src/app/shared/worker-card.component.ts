import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShortMoneyPipe } from '../core/format';
import { WorkerProfile } from '../core/models';
import { AvatarComponent } from './avatar.component';
import { IconComponent } from './icon.component';
import { StarsComponent } from './stars.component';

@Component({
  selector: 'app-worker-card',
  imports: [RouterLink, AvatarComponent, IconComponent, StarsComponent, ShortMoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="wc" [routerLink]="['/maestros', w().id]">
      <div class="top">
        <app-avatar [name]="w().user?.name" [src]="w().user?.photo_url" [size]="56" [verified]="!!w().user?.is_verified" />
        <div class="id">
          <h3>{{ w().user?.name }}</h3>
          <p class="role">{{ headline() }}</p>
          <div class="rate">
            @if (rating() > 0) {
              <app-stars [rating]="rating()" [size]="14" />
              <strong class="num">{{ ratingText() }}</strong>
              <span class="muted small">({{ w().jobs_done }} {{ w().jobs_done === 1 ? 'trabajo' : 'trabajos' }})</span>
            } @else {
              <span class="tag">Nuevo en ObraConecta</span>
            }
          </div>
        </div>
      </div>

      @if (w().specialties?.length) {
        <div class="specs">
          @for (s of w().specialties!.slice(0, 3); track s.id) {
            <span class="spec"><app-icon [name]="s.icon || 'hardhat'" [size]="15" />{{ s.name }}</span>
          }
        </div>
      }

      <dl class="facts">
        <div><dt>Experiencia</dt><dd class="num">{{ w().years_experience }} años</dd></div>
        <div><dt>Tarifa día</dt><dd class="num">{{ w().daily_rate | shortMoney }}</dd></div>
        <div><dt>Ciudad</dt><dd>{{ w().user?.city?.name || 'Cauca' }}</dd></div>
      </dl>

      <div class="foot">
        @if (w().availability === 'available') {
          <span class="tag ok"><span class="dot"></span>Disponible</span>
        } @else {
          <span class="tag warn"><span class="dot"></span>Ocupado</span>
        }
        <span class="see">Ver perfil <app-icon name="chevron-right" [size]="16" /></span>
      </div>
    </a>
  `,
  styles: [`
    .wc { display: flex; flex-direction: column; gap: 14px; height: 100%; padding: 18px; background: var(--surface); border: 1px solid var(--line);
      border-radius: var(--r-lg); color: var(--ink); text-decoration: none; transition: border-color .15s, box-shadow .2s, transform .2s; }
    .wc:hover { border-color: var(--primary); box-shadow: 0 10px 30px -14px rgb(31 78 140 / .45); transform: translateY(-2px); color: var(--ink); }
    .top { display: flex; gap: 14px; align-items: flex-start; }
    .id { min-width: 0; }
    h3 { margin: 0; font-size: 1.08rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .role { margin: 1px 0 4px; color: var(--ink-2); font-size: .9rem; }
    .rate { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: .9rem; }
    .specs { display: flex; flex-wrap: wrap; gap: 6px; }
    .spec { display: inline-flex; align-items: center; gap: 5px; font-size: .82rem; font-weight: 600; color: var(--primary); background: var(--primary-soft);
      padding: 4px 10px 4px 8px; border-radius: 8px; }
    .facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 0; border-top: 1px dashed var(--line); border-bottom: 1px dashed var(--line); padding: 10px 0; }
    .facts div + div { border-left: 1px dashed var(--line); padding-left: 10px; }
    dt { font-size: .74rem; color: var(--ink-3); }
    dd { margin: 0; font-weight: 700; font-size: .92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .foot { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
    .see { display: inline-flex; align-items: center; gap: 2px; font-weight: 600; font-size: .9rem; color: var(--primary); }
  `],
})
export class WorkerCardComponent {
  readonly w = input.required<WorkerProfile>();
  readonly rating = computed(() => Number(this.w().rating_avg || 0));
  readonly ratingText = computed(() => this.rating().toFixed(1).replace('.', ','));
  readonly headline = computed(() => {
    const y = this.w().years_experience;
    const main = this.w().specialties?.[0]?.name;
    return main ? `${main}${y >= 10 ? ', maestro con trayectoria' : ''}` : 'Trabajador de construcción';
  });
}
