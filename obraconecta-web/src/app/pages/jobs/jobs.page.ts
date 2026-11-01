import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CatalogService } from '../../core/catalog.service';
import { JobPost, Paginated } from '../../core/models';
import { EmptyComponent } from '../../shared/empty.component';
import { IconComponent } from '../../shared/icon.component';
import { JobCardComponent } from '../../shared/job-card.component';
import { PagerComponent } from '../../shared/pager.component';

interface Filters { q: string; especialidad: number | null; ciudad: number | null; minimo: number | null; orden: string; pagina: number; }

@Component({
  selector: 'app-jobs',
  imports: [FormsModule, RouterLink, IconComponent, JobCardComponent, EmptyComponent, PagerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../workers/listing.scss',
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h1>{{ specialtyName() ? 'Trabajos de ' + specialtyName().toLowerCase() : 'Trabajos disponibles' }}{{ cityName() ? ' en ' + cityName() : '' }}</h1>
          <p>@if (result(); as r) { {{ r.total }} {{ r.total === 1 ? 'oferta abierta' : 'ofertas abiertas' }} } @else { Buscando ofertas }</p>
        </div>
        @if (auth.role() === 'client') {
          <a routerLink="/publicar" class="btn btn-accent"><app-icon name="plus" />Publicar trabajo</a>
        } @else if (!auth.isLoggedIn()) {
          <a routerLink="/registro" [queryParams]="{ rol: 'worker' }" class="btn btn-primary">Crear perfil para postularme</a>
        }
      </div>

      <div class="searchbar">
        <label class="sbox">
          <app-icon name="search" />
          <span class="sr-only">Buscar trabajos</span>
          <input type="search" class="input" placeholder="Busca por palabra: baño, placa, fachada..." [(ngModel)]="qText" (ngModelChange)="typing.next($event.trim())" />
        </label>
        <select class="select sort" aria-label="Ordenar" [ngModel]="filters().orden" (ngModelChange)="set({ orden: $event })">
          <option value="recent">Más recientes</option>
          <option value="start">Empiezan pronto</option>
          <option value="budget">Mayor presupuesto</option>
        </select>
        <button type="button" class="btn filters-btn" (click)="drawer.set(true)">
          <app-icon name="sliders" />Filtros
          @if (activeCount()) { <span class="count">{{ activeCount() }}</span> }
        </button>
      </div>

      <div class="chips scroll trades-row" role="group" aria-label="Oficio">
        <button type="button" class="chip" [class.on]="!filters().especialidad" (click)="set({ especialidad: null })">Todos</button>
        @for (s of catalog.specialties(); track s.id) {
          <button type="button" class="chip" [class.on]="filters().especialidad === s.id" (click)="set({ especialidad: filters().especialidad === s.id ? null : s.id })">
            <app-icon [name]="s.icon || 'hardhat'" [size]="16" />{{ s.name }}
          </button>
        }
      </div>

      <div class="layout">
        <aside class="filters" [class.open]="drawer()" aria-label="Filtros">
          <div class="f-head">
            <h2>Filtros</h2>
            <button type="button" class="btn-icon close" aria-label="Cerrar filtros" (click)="drawer.set(false)"><app-icon name="x" /></button>
          </div>
          <div class="field">
            <label for="j-city">Ciudad</label>
            <select id="j-city" class="select" [ngModel]="filters().ciudad" (ngModelChange)="set({ ciudad: $event })">
              <option [ngValue]="null">Todas</option>
              @for (c of catalog.cities(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select>
          </div>
          <div class="field">
            <label for="j-min">Presupuesto mínimo</label>
            <select id="j-min" class="select" [ngModel]="filters().minimo" (ngModelChange)="set({ minimo: $event })">
              <option [ngValue]="null">Cualquiera</option>
              <option [ngValue]="500000">Desde $500 mil</option>
              <option [ngValue]="1000000">Desde $1 millón</option>
              <option [ngValue]="3000000">Desde $3 millones</option>
            </select>
            <span class="hint">Los pagos por día o por m² se comparan por su valor.</span>
          </div>
          <div class="f-actions">
            <button type="button" class="btn btn-ghost" (click)="clear()" [disabled]="!activeCount() && !filters().q">Limpiar filtros</button>
            <button type="button" class="btn btn-primary show-results" (click)="drawer.set(false)">Ver {{ result()?.total ?? '' }} resultados</button>
          </div>
        </aside>
        @if (drawer()) { <div class="scrim" (click)="drawer.set(false)"></div> }

        <section class="results" [class.dim]="loading() && result()">
          @if (!result()) {
            <div class="list">@for (i of [1,2,3,4]; track i) { <div class="sk" style="height:150px;border-radius:18px"></div> }</div>
          } @else if (result()!.data.length) {
            <div class="list">@for (j of result()!.data; track j.id) { <app-job-card [j]="j" /> }</div>
            <app-pager [page]="result()!.current_page" [last]="result()!.last_page" (go)="set({ pagina: $event }); scrollTop()" />
          } @else {
            <app-empty icon="briefcase" title="No hay trabajos con esos filtros" text="Quita algún filtro o vuelve más tarde: cada día se publican trabajos nuevos.">
              <button type="button" class="btn btn-primary" (click)="clear()">Quitar filtros</button>
            </app-empty>
          }
        </section>
      </div>
    </div>
  `,
})
export class JobsPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly catalog = inject(CatalogService);

  readonly result = signal<Paginated<JobPost> | null>(null);
  readonly loading = signal(true);
  readonly drawer = signal(false);
  readonly filters = signal<Filters>({ q: '', especialidad: null, ciudad: null, minimo: null, orden: 'recent', pagina: 1 });
  readonly typing = new Subject<string>();
  qText = '';

  readonly activeCount = computed(() => [this.filters().especialidad, this.filters().ciudad, this.filters().minimo].filter(Boolean).length);
  readonly specialtyName = computed(() => this.catalog.specialties().find((s) => s.id === this.filters().especialidad)?.name ?? '');
  readonly cityName = computed(() => this.catalog.cities().find((c) => c.id === this.filters().ciudad)?.name ?? '');

  ngOnInit(): void {
    this.route.queryParamMap.pipe(
      tap((p) => {
        const num = (k: string) => (p.get(k) ? Number(p.get(k)) : null);
        this.filters.set({ q: p.get('q') ?? '', especialidad: num('especialidad'), ciudad: num('ciudad'), minimo: num('minimo'), orden: p.get('orden') ?? 'recent', pagina: num('pagina') ?? 1 });
        this.qText = this.filters().q;
        this.loading.set(true);
      }),
      switchMap(() => {
        const f = this.filters();
        return this.api.jobs({ q: f.q, specialty_id: f.especialidad, city_id: f.ciudad, min_budget: f.minimo, sort: f.orden, page: f.pagina })
          .pipe(catchError(() => of(null)));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((r) => {
      this.result.set(r ?? { data: [], current_page: 1, last_page: 1, per_page: 12, total: 0 });
      this.loading.set(false);
    });

    this.typing.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe((q) => this.set({ q }));
  }

  set(patch: Partial<Filters>): void {
    const f = { ...this.filters(), ...patch, pagina: patch.pagina ?? 1 };
    this.router.navigate([], {
      relativeTo: this.route, replaceUrl: true,
      queryParams: { q: f.q || null, especialidad: f.especialidad, ciudad: f.ciudad, minimo: f.minimo, orden: f.orden !== 'recent' ? f.orden : null, pagina: f.pagina > 1 ? f.pagina : null },
    });
  }

  clear(): void {
    this.qText = '';
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  scrollTop(): void { window.scrollTo({ top: 0, behavior: 'smooth' }); }
}
