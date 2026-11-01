import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { AuthService } from '../../core/auth.service';
import { APP_STATUS, BUDGET_SUFFIX, JOB_STATUS, MoneyPipe, ShortDatePipe, TimeAgoPipe } from '../../core/format';
import { JobDetail } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { EmptyComponent } from '../../shared/empty.component';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';

@Component({
  selector: 'app-job-detail',
  imports: [FormsModule, RouterLink, IconComponent, AvatarComponent, ModalComponent, EmptyComponent, MoneyPipe, ShortDatePipe, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-detail.page.html',
  styleUrl: './job-detail.page.scss',
})
export class JobDetailPage {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  readonly auth = inject(AuthService);

  readonly id = input.required<string>();
  readonly data = signal<JobDetail | null>(null);
  readonly notFound = signal(false);
  readonly applyOpen = signal(false);
  readonly sending = signal(false);
  readonly reportOpen = signal(false);
  applyMsg = '';
  applyRate: number | null = null;
  reportReason = '';

  readonly APP_STATUS = APP_STATUS;
  readonly JOB_STATUS = JOB_STATUS;
  readonly job = computed(() => this.data()?.job ?? null);
  readonly suffix = computed(() => (this.job()?.budget ? BUDGET_SUFFIX[this.job()!.budget_type] : ''));
  readonly endDate = computed(() => {
    const j = this.job();
    if (!j?.start_date || !j.days) return null;
    const [y, m, d] = j.start_date.slice(0, 10).split('-').map(Number);
    const end = new Date(y, m - 1, d + j.days - 1);
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  });
  readonly clientName = computed(() => this.job()?.client?.business_name || this.job()?.client?.user?.name || 'Contratante');

  constructor() {
    effect(() => {
      const id = Number(this.id());
      this.data.set(null);
      this.notFound.set(false);
      this.api.job(id).subscribe({ next: (d) => this.data.set(d), error: () => this.notFound.set(true) });
    });
  }

  openApply(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/ingresar'], { queryParams: { volver: `/trabajos/${this.id()}` } });
      return;
    }
    const j = this.job()!;
    this.applyRate = j.budget;
    this.applyMsg = `Hola, me interesa este trabajo. Tengo experiencia en ${j.specialty?.name?.toLowerCase()} y puedo empezar en la fecha indicada.`;
    this.applyOpen.set(true);
  }

  apply(): void {
    this.sending.set(true);
    this.api.apply(this.job()!.id, { message: this.applyMsg, rate: this.applyRate }).subscribe({
      next: (a) => {
        this.sending.set(false);
        this.applyOpen.set(false);
        this.data.update((d) => (d ? { ...d, my_application: a, job: { ...d.job, applications_count: (d.job.applications_count ?? 0) + 1 } } : d));
        this.toast.success('Postulación enviada. Te avisamos cuando el contratante responda.');
      },
      error: (e) => { this.sending.set(false); this.toast.error(errorMessage(e)); },
    });
  }

  respondInvitation(status: 'accepted' | 'rejected'): void {
    const app = this.data()?.my_application;
    if (!app) return;
    this.api.setApplicationStatus(app.id, status).subscribe({
      next: (a) => {
        this.data.update((d) => (d ? { ...d, my_application: a } : d));
        this.toast.success(status === 'accepted' ? 'Aceptaste la invitación. Ya puedes escribirle al contratante desde Contrataciones.' : 'Invitación rechazada.');
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  share(): void {
    const url = location.href;
    if (navigator.share) {
      navigator.share({ title: this.job()?.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => this.toast.success('Enlace copiado.'));
    }
  }

  sendReport(): void {
    this.api.report({ target_type: 'job_post', target_id: this.job()!.id, reason: this.reportReason }).subscribe({
      next: () => { this.reportOpen.set(false); this.reportReason = ''; this.toast.success('Reporte enviado. El equipo lo revisará.'); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
