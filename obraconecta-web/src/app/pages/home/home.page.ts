import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CatalogService } from '../../core/catalog.service';
import { JobPost, PublicStats, WorkerProfile } from '../../core/models';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';
import { JobCardComponent } from '../../shared/job-card.component';
import { StarsComponent } from '../../shared/stars.component';
import { WorkerCardComponent } from '../../shared/worker-card.component';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink, IconComponent, AvatarComponent, StarsComponent, WorkerCardComponent, JobCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  readonly auth = inject(AuthService);
  readonly catalog = inject(CatalogService);

  readonly workers = signal<WorkerProfile[] | null>(null);
  readonly jobs = signal<JobPost[] | null>(null);
  readonly stats = signal<PublicStats | null>(null);

  specialtyId: number | '' = '';
  cityId: number | '' = '';

  /** El maestro que se dibuja sobre el plano de la portada. */
  readonly featured = computed(() => this.workers()?.[0] ?? null);
  readonly featuredRating = computed(() => Number(this.featured()?.rating_avg ?? 0).toFixed(1).replace('.', ','));

  ngOnInit(): void {
    this.api.workers({ per_page: 5, sort: 'rating' }).subscribe({ next: (r) => this.workers.set(r.data), error: () => this.workers.set([]) });
    this.api.jobs({ per_page: 4 }).subscribe({ next: (r) => this.jobs.set(r.data), error: () => this.jobs.set([]) });
    this.api.stats().subscribe({ next: (s) => this.stats.set(s), error: () => {} });
  }

  search(): void {
    this.router.navigate(['/maestros'], {
      queryParams: { especialidad: this.specialtyId || null, ciudad: this.cityId || null },
    });
  }
}
