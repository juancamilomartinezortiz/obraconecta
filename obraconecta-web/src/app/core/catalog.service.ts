import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { City, Specialty } from './models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private api = inject(ApiService);
  private loaded = false;

  readonly cities = signal<City[]>([]);
  readonly specialties = signal<Specialty[]>([]);
  readonly ready = signal(false);

  readonly cityName = computed(() => {
    const map = new Map(this.cities().map((c) => [c.id, c.name]));
    return (id: number | null | undefined) => (id ? map.get(id) ?? '' : '');
  });

  load(force = false): void {
    if (this.loaded && !force) return;
    this.loaded = true;
    this.api.catalogs().subscribe({
      next: (r) => {
        this.cities.set(r.cities);
        this.specialties.set(r.specialties);
        this.ready.set(true);
      },
      error: () => { this.loaded = false; },
    });
  }
}
