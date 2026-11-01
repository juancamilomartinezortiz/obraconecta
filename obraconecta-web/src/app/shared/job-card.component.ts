import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUDGET_SUFFIX, ShortDatePipe, ShortMoneyPipe, TimeAgoPipe } from '../core/format';
import { JobPost } from '../core/models';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-job-card',
  imports: [RouterLink, IconComponent, ShortMoneyPipe, ShortDatePipe, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="jc" [routerLink]="['/trabajos', j().id]">
      <span class="ic"><app-icon [name]="j().specialty?.icon || 'hardhat'" [size]="24" /></span>
      <div class="main">
        <div class="meta">
          <span>{{ j().specialty?.name }}</span>
          <span class="sep"></span>
          <span>{{ j().created_at | timeAgo }}</span>
          @if (j().has_applied) { <span class="tag ok">Ya te postulaste</span> }
        </div>
        <h3>{{ j().title }}</h3>
        <p class="who">
          {{ j().client?.business_name || j().client?.user?.name }}
          @if (j().client?.user?.is_verified) { <app-icon name="shield" [size]="15" class="ver" /> }
        </p>
        <ul class="facts">
          <li><app-icon name="map-pin" [size]="16" />{{ j().city?.name }}@if (j().address) {, {{ j().address }}}</li>
          <li><app-icon name="calendar" [size]="16" />Inicia {{ j().start_date | shortDate }}</li>
          @if (j().days) { <li><app-icon name="clock" [size]="16" />{{ j().days }} días</li> }
          <li><app-icon name="users" [size]="16" />{{ j().workers_needed }} {{ j().workers_needed === 1 ? 'persona' : 'personas' }}</li>
        </ul>
      </div>
      <div class="pay">
        <strong class="num">{{ j().budget | shortMoney }}</strong>
        <span>{{ suffix() }}</span>
        <span class="apps">{{ j().applications_count ?? 0 }} {{ (j().applications_count ?? 0) === 1 ? 'postulado' : 'postulados' }}</span>
      </div>
    </a>
  `,
  styles: [`
    :host { display: block; container-type: inline-size; }
    .jc { display: grid; grid-template-columns: auto 1fr; gap: 14px; padding: 18px; background: var(--surface); border: 1px solid var(--line);
      border-radius: var(--r-lg); color: var(--ink); text-decoration: none; transition: border-color .15s, box-shadow .2s; }
    .jc:hover { border-color: var(--primary); box-shadow: 0 10px 30px -16px rgb(31 78 140 / .45); color: var(--ink); }
    @container (min-width: 560px) { .jc { grid-template-columns: auto 1fr auto; gap: 18px; } }
    .ic { width: 48px; height: 48px; border-radius: 12px; background: var(--primary-soft); color: var(--primary); display: grid; place-items: center; }
    .main { min-width: 0; }
    .meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: .82rem; color: var(--ink-3); font-weight: 600; }
    .sep { width: 3px; height: 3px; border-radius: 50%; background: currentColor; }
    h3 { margin: 4px 0 2px; font-size: 1.12rem; }
    .who { margin: 0 0 10px; color: var(--ink-2); font-size: .92rem; display: flex; align-items: center; gap: 4px; }
    .ver { color: var(--ok); }
    .facts { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: .88rem; color: var(--ink-2); }
    .facts li { display: inline-flex; align-items: center; gap: 5px; }
    .facts app-icon { color: var(--ink-3); }
    .pay { grid-column: 1 / -1; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; border-top: 1px dashed var(--line); padding-top: 12px; }
    @container (min-width: 560px) { .pay { grid-column: auto; flex-direction: column; align-items: flex-end; gap: 0; border: 0; padding: 0; text-align: right; } }
    .pay strong { font-family: var(--font-display); font-size: 1.35rem; letter-spacing: -.02em; }
    .pay span { font-size: .84rem; color: var(--ink-3); }
    .apps { margin-left: auto; }
    @container (min-width: 560px) { .apps { margin: 10px 0 0; } }
  `],
})
export class JobCardComponent {
  readonly j = input.required<JobPost>();
  readonly suffix = computed(() => (this.j().budget ? BUDGET_SUFFIX[this.j().budget_type] : ''));
}
