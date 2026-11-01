import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { APP_STATUS, BUDGET_SUFFIX, JOB_STATUS, ShortDatePipe, ShortMoneyPipe, TimeAgoPipe, whatsappLink } from '../../core/format';
import { Application, JobPost, JobStatus } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { EmptyComponent } from '../../shared/empty.component';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';
import { StarsComponent } from '../../shared/stars.component';

@Component({
  selector: 'app-my-jobs',
  imports: [RouterLink, IconComponent, EmptyComponent, ModalComponent, AvatarComponent, StarsComponent, ShortDatePipe, ShortMoneyPipe, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-jobs.page.html',
  styleUrl: './my-jobs.page.scss',
})
export class MyJobsPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  /** ?ver=ID abre directamente las postulaciones de esa oferta. */
  readonly ver = input<string>();

  readonly jobs = signal<JobPost[] | null>(null);
  readonly selected = signal<JobPost | null>(null);
  readonly apps = signal<Application[] | null>(null);
  readonly busy = signal<number | null>(null);
  readonly confirmDelete = signal<JobPost | null>(null);

  readonly JOB_STATUS = JOB_STATUS;
  readonly APP_STATUS = APP_STATUS;

  readonly totals = computed(() => {
    const l = this.jobs() ?? [];
    return {
      open: l.filter((j) => j.status === 'open').length,
      pending: l.reduce((n, j) => n + (j.new_applications_count ?? 0), 0),
      hired: l.reduce((n, j) => n + (j.accepted_count ?? 0), 0),
    };
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.myJobs().subscribe({
      next: (l) => {
        this.jobs.set(l);
        const v = Number(this.ver());
        if (v && !this.selected()) {
          const j = l.find((x) => x.id === v);
          if (j) this.openApps(j);
        }
      },
      error: () => this.jobs.set([]),
    });
  }

  toNum(v: string | number | null | undefined): number { return Number(v ?? 0); }

  suffix(j: JobPost | null | undefined): string { return j ? BUDGET_SUFFIX[j.budget_type] : ''; }

  openApps(j: JobPost): void {
    this.selected.set(j);
    this.apps.set(null);
    this.api.jobApplications(j.id).subscribe({
      next: (l) => {
        this.apps.set(l);
        this.jobs.update((list) => (list ?? []).map((x) => (x.id === j.id ? { ...x, new_applications_count: 0 } : x)));
      },
      error: () => this.apps.set([]),
    });
  }

  decide(a: Application, status: 'accepted' | 'rejected'): void {
    this.busy.set(a.id);
    this.api.setApplicationStatus(a.id, status).subscribe({
      next: (upd) => {
        this.busy.set(null);
        this.apps.update((l) => (l ?? []).map((x) => (x.id === a.id ? { ...x, status: upd.status, contract: upd.contract, worker: upd.worker ?? x.worker } : x)));
        if (status === 'accepted') {
          this.jobs.update((list) => (list ?? []).map((x) => (x.id === a.job_post_id ? { ...x, accepted_count: (x.accepted_count ?? 0) + 1 } : x)));
          this.toast.success('Postulación aceptada. Ya puedes escribirle por WhatsApp.');
        } else {
          this.toast.info('Postulación descartada.');
        }
      },
      error: (e) => { this.busy.set(null); this.toast.error(errorMessage(e)); },
    });
  }

  setStatus(j: JobPost, status: JobStatus): void {
    this.api.setJobStatus(j.id, status).subscribe({
      next: () => {
        this.jobs.update((l) => (l ?? []).map((x) => (x.id === j.id ? { ...x, status } : x)));
        this.toast.success(status === 'open' ? 'La oferta está abierta otra vez.' : status === 'paused' ? 'Oferta pausada. No recibirá postulaciones.' : 'Oferta cerrada.');
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  remove(): void {
    const j = this.confirmDelete();
    if (!j) return;
    this.api.deleteJob(j.id).subscribe({
      next: () => {
        this.jobs.update((l) => (l ?? []).filter((x) => x.id !== j.id));
        this.confirmDelete.set(null);
        this.toast.success('Oferta eliminada.');
      },
      error: (e) => { this.confirmDelete.set(null); this.toast.error(errorMessage(e)); },
    });
  }

  wa(a: Application): string | null {
    return whatsappLink(a.worker?.user?.phone, `Hola ${a.worker?.user?.name?.split(' ')[0]}, acepté tu postulación en ObraConecta para "${this.selected()?.title}".`);
  }
}
