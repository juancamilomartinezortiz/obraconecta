import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { APP_STATUS, BUDGET_SUFFIX, ShortDatePipe, ShortMoneyPipe, TimeAgoPipe, whatsappLink } from '../../core/format';
import { Application } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { EmptyComponent } from '../../shared/empty.component';
import { IconComponent } from '../../shared/icon.component';

type Tab = 'all' | 'invites' | 'active' | 'closed';

@Component({
  selector: 'app-my-applications',
  imports: [RouterLink, IconComponent, EmptyComponent, ShortDatePipe, ShortMoneyPipe, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div>
        <h1>Mis postulaciones</h1>
        <p>Sigue el estado de cada trabajo al que te postulaste o te invitaron.</p>
      </div>
      <a routerLink="/trabajos" class="btn btn-primary"><app-icon name="search" />Buscar trabajos</a>
    </div>

    <div class="chips tabs" role="tablist">
      @for (t of tabs; track t.v) {
        <button type="button" role="tab" class="chip" [class.on]="tab() === t.v" [attr.aria-selected]="tab() === t.v" (click)="tab.set(t.v)">
          {{ t.label }} <span class="n num">{{ count(t.v) }}</span>
        </button>
      }
    </div>

    @if (list() === null) {
      <div class="rows">@for (i of [1,2,3]; track i) { <div class="sk" style="height:132px;border-radius:16px"></div> }</div>
    } @else if (filtered().length) {
      <div class="rows">
        @for (a of filtered(); track a.id) {
          <article class="row card" [class.invite]="a.is_invitation && isPending(a)">
            @if (a.is_invitation && isPending(a)) {
              <p class="inv-flag"><app-icon name="bell" [size]="16" />{{ a.job_post?.client?.business_name || a.job_post?.client?.user?.name }} te invitó a este trabajo</p>
            }
            <div class="r-main">
              <span class="ic"><app-icon [name]="a.job_post?.specialty?.icon || 'hardhat'" [size]="22" /></span>
              <div class="r-text">
                <a [routerLink]="['/trabajos', a.job_post_id]" class="r-title">{{ a.job_post?.title }}</a>
                <p class="r-meta">
                  {{ a.job_post?.city?.name }}, inicia {{ a.job_post?.start_date | shortDate }}.
                  {{ a.is_invitation ? 'Invitación recibida' : 'Te postulaste' }} {{ a.created_at | timeAgo }}.
                </p>
                <p class="r-pay">
                  @if (a.rate) { Tu propuesta: <strong class="num">{{ a.rate | shortMoney }}</strong> {{ suffix(a) }} }
                  @else { Presupuesto: <strong class="num">{{ a.job_post?.budget | shortMoney }}</strong> {{ suffix(a) }} }
                </p>
              </div>
              <span class="status" [attr.data-s]="a.status">{{ statusLabel(a) }}</span>
            </div>

            <!-- Línea de avance: enviada, vista, respuesta -->
            <ol class="track" aria-label="Avance">
              <li class="done">Enviada</li>
              <li [class.done]="a.status !== 'sent'">Vista</li>
              <li [class.done]="a.status === 'accepted'" [class.bad]="a.status === 'rejected'">{{ a.status === 'rejected' ? 'No seleccionada' : 'Aceptada' }}</li>
            </ol>

            @if (a.is_invitation && isPending(a)) {
              <div class="r-actions">
                <button type="button" class="btn btn-ok" (click)="respond(a, 'accepted')" [disabled]="busy() === a.id"><app-icon name="check" />Aceptar invitación</button>
                <button type="button" class="btn btn-danger" (click)="respond(a, 'rejected')" [disabled]="busy() === a.id">Rechazar</button>
              </div>
            } @else if (a.status === 'accepted') {
              <div class="r-actions">
                @if (wa(a); as link) {
                  <a [href]="link" target="_blank" rel="noopener" class="btn btn-ok"><app-icon name="whatsapp" />Escribir al contratante</a>
                }
                <a routerLink="/panel/contratos" class="btn">Ver contratación</a>
              </div>
            }
          </article>
        }
      </div>
    } @else {
      <app-empty icon="send" [title]="tab() === 'invites' ? 'No tienes invitaciones pendientes' : 'Todavía no hay postulaciones aquí'"
        text="Busca trabajos de tu oficio y postúlate. Un perfil completo con fotos de tus obras recibe más invitaciones.">
        <a routerLink="/trabajos" class="btn btn-primary">Buscar trabajos</a>
      </app-empty>
    }
  `,
  styleUrl: './rows.scss',
})
export class MyApplicationsPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly list = signal<Application[] | null>(null);
  readonly tab = signal<Tab>('all');
  readonly busy = signal<number | null>(null);
  readonly tabs: { v: Tab; label: string }[] = [
    { v: 'all', label: 'Todas' }, { v: 'invites', label: 'Invitaciones' }, { v: 'active', label: 'En espera' }, { v: 'closed', label: 'Respondidas' },
  ];

  readonly filtered = computed(() => (this.list() ?? []).filter((a) => this.match(a, this.tab())));

  ngOnInit(): void {
    this.api.myApplications().subscribe({ next: (l) => this.list.set(l), error: () => this.list.set([]) });
  }

  isPending(a: Application): boolean { return a.status === 'sent' || a.status === 'seen'; }

  match(a: Application, t: Tab): boolean {
    switch (t) {
      case 'invites': return a.is_invitation && this.isPending(a);
      case 'active': return !a.is_invitation && this.isPending(a);
      case 'closed': return !this.isPending(a);
      default: return true;
    }
  }

  count(t: Tab): number { return (this.list() ?? []).filter((a) => this.match(a, t)).length; }

  statusLabel(a: Application): string {
    if (a.is_invitation && this.isPending(a)) return 'Te invitaron';
    return APP_STATUS[a.status];
  }

  suffix(a: Application): string { return a.job_post ? BUDGET_SUFFIX[a.job_post.budget_type] : ''; }

  wa(a: Application): string | null {
    return whatsappLink(a.job_post?.client?.user?.phone, `Hola, soy el maestro que aceptaron en ObraConecta para "${a.job_post?.title}".`);
  }

  respond(a: Application, status: 'accepted' | 'rejected'): void {
    this.busy.set(a.id);
    this.api.setApplicationStatus(a.id, status).subscribe({
      next: (upd) => {
        this.busy.set(null);
        this.list.update((l) => (l ?? []).map((x) => (x.id === a.id ? { ...x, status: upd.status, contract: upd.contract, job_post: upd.job_post ?? x.job_post } : x)));
        this.toast.success(status === 'accepted' ? 'Invitación aceptada. Escríbele al contratante para cuadrar detalles.' : 'Invitación rechazada.');
      },
      error: (e) => { this.busy.set(null); this.toast.error(errorMessage(e)); },
    });
  }
}
