import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage, fieldErrors } from '../../core/auth.interceptor';
import { AuthService } from '../../core/auth.service';
import { CatalogService } from '../../core/catalog.service';
import { BUDGET_SUFFIX, money } from '../../core/format';
import { BudgetType, JobPost } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { IconComponent } from '../../shared/icon.component';
import { JobCardComponent } from '../../shared/job-card.component';

interface Draft {
  title: string;
  specialty_id: number | null;
  city_id: number | null;
  address: string;
  budget: number | null;
  budget_type: BudgetType;
  start_date: string;
  days: number | null;
  workers_needed: number;
  description: string;
}

const DRAFT_KEY = 'oc_job_draft';

@Component({
  selector: 'app-job-form',
  imports: [FormsModule, RouterLink, IconComponent, JobCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-form.page.html',
  styleUrl: './job-form.page.scss',
})
export class JobFormPage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  readonly catalog = inject(CatalogService);

  /** Si viene, se edita esa oferta. */
  readonly id = input<string>();

  readonly step = signal(1);
  readonly saving = signal(false);
  readonly loadingJob = signal(false);
  readonly errs = signal<Record<string, string>>({});
  readonly tick = signal(0); // fuerza el recálculo de la vista previa al escribir

  d: Draft = this.blank();

  readonly editing = computed(() => !!this.id());
  readonly today = new Date().toISOString().slice(0, 10);
  readonly budgetTypes: { v: BudgetType; label: string }[] = [
    { v: 'total', label: 'Total' }, { v: 'daily', label: 'Por día' }, { v: 'm2', label: 'Por m²' },
  ];
  readonly ideas = [
    'Enchape de baño completo', 'Pintura de casa por dentro', 'Arreglo de fuga en el baño',
    'Construcción de muro', 'Instalación eléctrica de local', 'Cocina integral a la medida',
  ];

  readonly preview = computed<JobPost>(() => {
    this.tick();
    const spec = this.catalog.specialties().find((s) => s.id === this.d.specialty_id);
    const city = this.catalog.cities().find((c) => c.id === this.d.city_id);
    const u = this.auth.user();
    return {
      id: 0, client_profile_id: 0, specialty_id: this.d.specialty_id ?? 0, city_id: this.d.city_id ?? 0,
      title: this.d.title || 'Título de tu trabajo', description: this.d.description, address: this.d.address || null,
      budget: this.d.budget, budget_type: this.d.budget_type, start_date: this.d.start_date || null, days: this.d.days,
      workers_needed: this.d.workers_needed, status: 'open', created_at: new Date().toISOString(), applications_count: 0,
      specialty: spec ?? { id: 0, name: 'Oficio', icon: 'hardhat' }, city: city ?? { id: 0, name: 'Ciudad', department: '' },
      client: { id: 0, user_id: u?.id ?? 0, type: u?.client_profile?.type ?? 'person', business_name: u?.client_profile?.business_name ?? null, nit: null, logo_url: null, description: null, user: u ?? undefined },
    };
  });

  readonly step1Valid = computed(() => {
    this.tick();
    return this.d.title.trim().length >= 5 && !!this.d.specialty_id && !!this.d.city_id;
  });

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.loadingJob.set(true);
      this.api.job(Number(id)).subscribe({
        next: ({ job, is_owner }) => {
          if (!is_owner) { this.router.navigateByUrl('/panel/mis-trabajos'); return; }
          this.d = {
            title: job.title, specialty_id: job.specialty_id, city_id: job.city_id, address: job.address ?? '',
            budget: job.budget, budget_type: job.budget_type, start_date: job.start_date?.slice(0, 10) ?? '',
            days: job.days, workers_needed: job.workers_needed, description: job.description,
          };
          this.loadingJob.set(false);
          this.touch();
        },
        error: () => this.router.navigateByUrl('/panel/mis-trabajos'),
      });
    } else {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) this.d = { ...this.d, ...JSON.parse(raw) };
      } catch { /* sin borrador */ }
      if (!this.d.city_id) this.d.city_id = this.auth.user()?.city_id ?? null;
      this.touch();
    }
  }

  touch(): void {
    this.tick.update((n) => n + 1);
    if (!this.editing()) {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(this.d)); } catch { /* sin almacenamiento */ }
    }
  }

  pickIdea(t: string): void { this.d.title = t; this.touch(); }
  pickSpecialty(id: number): void { this.d.specialty_id = id; this.touch(); }
  setType(t: BudgetType): void { this.d.budget_type = t; this.touch(); }
  people(delta: number): void { this.d.workers_needed = Math.min(50, Math.max(1, this.d.workers_needed + delta)); this.touch(); }

  budgetHint(): string {
    if (!this.d.budget) return 'Si no lo sabes, déjalo vacío y aparecerá "A convenir".';
    return `${money(this.d.budget)} ${BUDGET_SUFFIX[this.d.budget_type]}`;
  }

  next(): void {
    if (this.step1Valid()) { this.step.set(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  save(): void {
    if (this.d.description.trim().length < 20) {
      this.errs.set({ description: 'Describe el trabajo con al menos 20 caracteres para que los maestros entiendan qué necesitas.' });
      return;
    }
    this.saving.set(true);
    this.errs.set({});
    const body = { ...this.d, start_date: this.d.start_date || null, address: this.d.address || null } as unknown as Partial<JobPost>;
    const req = this.editing() ? this.api.updateJob(Number(this.id()), body) : this.api.createJob(body);
    req.subscribe({
      next: (job) => {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* sin almacenamiento */ }
        this.toast.success(this.editing() ? 'Cambios guardados.' : 'Trabajo publicado. Ya lo pueden ver los maestros de tu zona.');
        this.router.navigate(['/trabajos', job.id]);
      },
      error: (e) => {
        this.saving.set(false);
        this.errs.set(fieldErrors(e));
        this.toast.error(errorMessage(e));
      },
    });
  }

  private blank(): Draft {
    return { title: '', specialty_id: null, city_id: null, address: '', budget: null, budget_type: 'total', start_date: '', days: null, workers_needed: 1, description: '' };
  }
}
