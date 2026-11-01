import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { AuthService } from '../../core/auth.service';
import { ShortDatePipe, ShortMoneyPipe, TimeAgoPipe, whatsappLink } from '../../core/format';
import { JobPost, PortfolioItem, WorkerDetail } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { CoverComponent } from '../../shared/cover.component';
import { EmptyComponent } from '../../shared/empty.component';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';
import { StarsComponent } from '../../shared/stars.component';

@Component({
  selector: 'app-worker-detail',
  imports: [FormsModule, RouterLink, AvatarComponent, IconComponent, StarsComponent, CoverComponent, ModalComponent, EmptyComponent,
    ShortMoneyPipe, ShortDatePipe, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './worker-detail.page.html',
  styleUrl: './worker-detail.page.scss',
})
export class WorkerDetailPage {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly id = input.required<string>();
  readonly data = signal<WorkerDetail | null>(null);
  readonly notFound = signal(false);

  // Galería
  readonly viewing = signal<PortfolioItem | null>(null);
  readonly photoIdx = signal(0);

  // Invitar
  readonly inviteOpen = signal(false);
  readonly myJobs = signal<JobPost[] | null>(null);
  inviteJob: number | null = null;
  inviteMsg = '';
  readonly sending = signal(false);

  // Reportar
  readonly reportOpen = signal(false);
  reportReason = '';

  readonly w = computed(() => this.data()?.worker ?? null);
  readonly rating = computed(() => Number(this.w()?.rating_avg ?? 0));
  readonly ratingText = computed(() => this.rating().toFixed(1).replace('.', ','));
  readonly isMe = computed(() => !!this.w() && this.auth.user()?.id === this.w()!.user_id);
  readonly totalReviews = computed(() => this.data()?.reviews.length ?? 0);
  readonly wa = computed(() => whatsappLink(this.w()?.user?.phone, `Hola ${this.w()?.user?.name?.split(' ')[0]}, te escribo desde ObraConecta.`));
  readonly mainIcon = computed(() => this.w()?.specialties?.[0]?.icon ?? 'hardhat');

  constructor() {
    effect(() => {
      const id = Number(this.id());
      this.data.set(null);
      this.notFound.set(false);
      this.api.worker(id).subscribe({ next: (d) => this.data.set(d), error: () => this.notFound.set(true) });
    });
  }

  bar(star: number): number {
    const total = this.totalReviews();
    return total ? Math.round(((this.data()?.rating_distribution[star] ?? 0) / total) * 100) : 0;
  }

  open(item: PortfolioItem): void {
    this.viewing.set(item);
    this.photoIdx.set(0);
  }

  move(step: number): void {
    const n = this.viewing()?.photos?.length ?? 0;
    if (n) this.photoIdx.set((this.photoIdx() + step + n) % n);
  }

  openInvite(): void {
    this.inviteOpen.set(true);
    this.inviteMsg = `Hola ${this.w()?.user?.name?.split(' ')[0]}, vi tu perfil y me gustaría que trabajaras en mi obra.`;
    if (!this.myJobs()) {
      this.api.myJobs().subscribe({
        next: (jobs) => {
          const open = jobs.filter((j) => j.status === 'open');
          this.myJobs.set(open);
          this.inviteJob = open[0]?.id ?? null;
        },
        error: () => this.myJobs.set([]),
      });
    }
  }

  sendInvite(): void {
    if (!this.inviteJob) return;
    this.sending.set(true);
    this.api.invite(this.w()!.id, { job_post_id: this.inviteJob, message: this.inviteMsg }).subscribe({
      next: () => {
        this.sending.set(false);
        this.inviteOpen.set(false);
        this.toast.success('Invitación enviada. Te avisamos cuando responda.');
      },
      error: (e) => { this.sending.set(false); this.toast.error(errorMessage(e)); },
    });
  }

  sendReport(): void {
    this.api.report({ target_type: 'user', target_id: this.w()!.user_id, reason: this.reportReason }).subscribe({
      next: () => { this.reportOpen.set(false); this.reportReason = ''; this.toast.success('Reporte enviado. El equipo lo revisará.'); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
