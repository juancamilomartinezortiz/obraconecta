import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, tap, catchError, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CatalogService } from '../../core/catalog.service';
import { Paginated, WorkerProfile } from '../../core/models';
import { EmptyComponent } from '../../shared/empty.component';
import { IconComponent } from '../../shared/icon.component';
import { PagerComponent } from '../../shared/pager.component';
import { WorkerCardComponent } from '../../shared/worker-card.component';

interface Filters {
  q: string;
  especialidad: number | null;
  ciudad: number | null;
  min: number | null;
  verificados: boolean;
  disponibles: boolean;
  orden: string;
  pagina: number;
}

@Component({
  selector: 'app-workers',
  imports: [FormsModule, IconComponent, WorkerCardComponent, EmptyComponent, PagerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workers.page.html',
  styleUrl: './listing.scss',
})
export class WorkersPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  readonly catalog = inject(CatalogService);

  readonly result = signal<Paginated<WorkerProfile> | null>(null);
  readonly loading = signal(true);
  readonly filters = signal<Filters>(this.empty());
  readonly drawer = signal(false);
  qText = '';
  private typing = new Subject<string>();

  readonly activeCount = computed(() => {
    const f = this.filters();
    return [f.especialidad, f.ciudad, f.min, f.verificados || null, f.disponibles || null].filter(Boolean).length;
  });

  readonly specialtyName = computed(() => this.catalog.specialties().find((s) => s.id === this.filters().especialidad)?.name);
  readonly cityName = computed(() => this.catalog.cities().find((c) => c.id === this.filters().ciudad)?.name);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(
      tap((p) => {
        const num = (k: string) => (p.get(k) ? Number(p.get(k)) : null);
        const f: Filters = {
          q: p.get('q') ?? '',
          especialidad: num('especialidad'),
          ciudad: num('ciudad'),
          min: num('min'),
          verificados: p.get('verificados') === '1',
          disponibles: p.get('disponibles') === '1',
          orden: p.get('orden') ?? 'rating',
          pagina: num('pagina') ?? 1,
        };
        this.filters.set(f);
        this.qText = f.q;
        this.loading.set(true);
      }),
      switchMap(() => {
        const f = this.filters();
        return this.api.workers({
          q: f.q, specialty_id: f.especialidad, city_id: f.ciudad, min_rating: f.min,
          verified: f.verificados ? 1 : null, available: f.disponibles ? 1 : null, sort: f.orden, page: f.pagina,
        }).pipe(catchError(() => of(null)));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((r) => {
      this.result.set(r ?? { data: [], current_page: 1, last_page: 1, per_page: 12, total: 0 });
      this.loading.set(false);
    });

    this.typing.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => this.set({ q }));
  }

  onType(q: string): void { this.typing.next(q.trim()); }

  set(patch: Partial<Filters>): void {
    const f = { ...this.filters(), ...patch, pagina: patch.pagina ?? 1 };
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        q: f.q || null, especialidad: f.especialidad, ciudad: f.ciudad, min: f.min,
        verificados: f.verificados ? 1 : null, disponibles: f.disponibles ? 1 : null,
        orden: f.orden !== 'rating' ? f.orden : null, pagina: f.pagina > 1 ? f.pagina : null,
      },
    });
  }

  toggleSpecialty(id: number): void {
    this.set({ especialidad: this.filters().especialidad === id ? null : id });
  }

  page(p: number): void {
    this.set({ pagina: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clear(): void {
    this.qText = '';
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  private empty(): Filters {
    return { q: '', especialidad: null, ciudad: null, min: null, verificados: false, disponibles: false, orden: 'rating', pagina: 1 };
  }
}
