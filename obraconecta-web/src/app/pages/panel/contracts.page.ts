import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { AuthService } from '../../core/auth.service';
import { MoneyPipe, ShortDatePipe, whatsappLink } from '../../core/format';
import { Contract, User } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { EmptyComponent } from '../../shared/empty.component';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';
import { StarsComponent } from '../../shared/stars.component';

const LABEL = { active: 'En curso', finished: 'Terminado', cancelled: 'Cancelado' } as const;

@Component({
  selector: 'app-contracts',
  imports: [FormsModule, RouterLink, IconComponent, AvatarComponent, StarsComponent, ModalComponent, EmptyComponent, MoneyPipe, ShortDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div>
        <h1>Contrataciones</h1>
        <p>{{ auth.role() === 'worker' ? 'Los trabajos en los que te contrataron.' : 'Los maestros que contrataste.' }} Al terminar, califiquen el trabajo.</p>
      </div>
    </div>

    @if (list() === null) {
      <div class="list">@for (i of [1,2]; track i) { <div class="sk" style="height:170px;border-radius:16px"></div> }</div>
    } @else if (list()!.length) {
      @if (toReview() > 0) {
        <div class="notice"><app-icon name="star" [size]="18" />Tienes {{ toReview() }} {{ toReview() === 1 ? 'trabajo terminado' : 'trabajos terminados' }} por calificar.</div>
      }
      <div class="list">
        @for (c of list(); track c.id) {
          <article class="ct card" [attr.data-s]="c.status">
            <header>
              <div>
                <a [routerLink]="['/trabajos', c.application?.job_post_id]" class="title">{{ c.application?.job_post?.title }}</a>
                <p class="meta">{{ c.application?.job_post?.specialty?.name }}, {{ c.application?.job_post?.city?.name }}</p>
              </div>
              <span class="st" [attr.data-s]="c.status">{{ label[c.status] }}</span>
            </header>

            <div class="body">
              <div class="party">
                <app-avatar [name]="other(c)?.name" [src]="other(c)?.photo_url" [size]="48" [verified]="!!other(c)?.is_verified" />
                <div>
                  <span class="small muted">{{ auth.role() === 'worker' ? 'Te contrató' : 'Maestro' }}</span>
                  @if (auth.role() === 'client') {
                    <a [routerLink]="['/maestros', c.application?.worker_profile_id]" class="pname">{{ other(c)?.name }}</a>
                  } @else {
                    <strong class="pname">{{ c.application?.job_post?.client?.business_name || other(c)?.name }}</strong>
                  }
                  @if (other(c)?.phone) { <span class="phone num"><app-icon name="phone" [size]="14" />{{ other(c)?.phone }}</span> }
                </div>
              </div>
              <dl>
                <div><dt>Valor acordado</dt><dd class="num">{{ c.agreed_value | money }}</dd></div>
                <div><dt>Inicio</dt><dd>{{ c.start_date | shortDate }}</dd></div>
                <div><dt>{{ c.status === 'active' ? 'Estado' : 'Fin' }}</dt><dd>{{ c.status === 'active' ? 'En obra' : (c.end_date | shortDate) }}</dd></div>
              </dl>
            </div>

            @if (c.status === 'finished') {
              <div class="reviews">
                <div class="rv">
                  <span class="small muted">Tu calificación</span>
                  @if (c.my_review; as r) {
                    <app-stars [rating]="r.rating" [size]="15" />
                    @if (r.comment) { <p>"{{ r.comment }}"</p> }
                  } @else {
                    <button type="button" class="btn btn-accent btn-sm" (click)="openReview(c)"><app-icon name="star" [size]="16" />Calificar a {{ firstName(c) }}</button>
                  }
                </div>
                <div class="rv">
                  <span class="small muted">Te calificó</span>
                  @if (c.their_review; as r) {
                    <app-stars [rating]="r.rating" [size]="15" />
                    @if (r.comment) { <p>"{{ r.comment }}"</p> }
                  } @else { <span class="small muted">Aún no</span> }
                </div>
              </div>
            }

            <footer>
              @if (wa(c); as link) {
                <a [href]="link" target="_blank" rel="noopener" class="btn btn-ok btn-sm"><app-icon name="whatsapp" [size]="18" />WhatsApp</a>
              }
              @if (c.status === 'active') {
                <button type="button" class="btn btn-primary btn-sm" (click)="confirm.set({ c, action: 'finish' })"><app-icon name="check" [size]="18" />Marcar como terminado</button>
                <button type="button" class="btn btn-ghost btn-sm" (click)="confirm.set({ c, action: 'cancel' })">Cancelar contratación</button>
              }
            </footer>
          </article>
        }
      </div>
    } @else {
      <app-empty icon="briefcase" title="Aún no tienes contrataciones"
        [text]="auth.role() === 'worker' ? 'Cuando un contratante acepte tu postulación, la verás aquí con su WhatsApp.' : 'Cuando aceptes a un maestro, la contratación aparecerá aquí.'">
        <a [routerLink]="auth.role() === 'worker' ? '/trabajos' : '/panel/mis-trabajos'" class="btn btn-primary">{{ auth.role() === 'worker' ? 'Buscar trabajos' : 'Ver mis trabajos' }}</a>
      </app-empty>
    }

    <app-modal [open]="!!reviewing()" [title]="'Califica a ' + (reviewing() ? firstName(reviewing()!) : '')" (closed)="reviewing.set(null)">
      <form class="stack" (ngSubmit)="sendReview()">
        <p class="muted">Tu calificación aparece en su perfil y ayuda a otros a decidir.</p>
        <app-stars [editable]="true" [(value)]="stars" />
        <div class="field">
          <label for="cm">Comentario (opcional)</label>
          <textarea id="cm" class="textarea" name="comment" [(ngModel)]="comment" maxlength="1000"
            [placeholder]="auth.role() === 'client' ? '¿Cumplió los tiempos? ¿Cómo quedó el acabado?' : '¿Pagó a tiempo? ¿Fue claro con lo que necesitaba?'"></textarea>
        </div>
        <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="!stars() || sending()">Publicar calificación</button>
      </form>
    </app-modal>

    <app-modal [open]="!!confirm()" [title]="confirm()?.action === 'finish' ? '¿El trabajo está terminado?' : '¿Cancelar esta contratación?'" (closed)="confirm.set(null)">
      <p>{{ confirm()?.action === 'finish' ? 'Al marcarlo como terminado, ambos podrán calificarse. Esto suma un trabajo al historial del maestro.' : 'La contratación quedará cancelada y no se podrá calificar.' }}</p>
      <div class="confirm">
        <button type="button" class="btn" (click)="confirm.set(null)">Volver</button>
        <button type="button" class="btn" [class.btn-primary]="confirm()?.action === 'finish'" [class.btn-dark]="confirm()?.action === 'cancel'" (click)="doConfirm()">
          {{ confirm()?.action === 'finish' ? 'Sí, está terminado' : 'Cancelar contratación' }}
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .notice { display: flex; gap: 8px; align-items: center; padding: 12px 16px; background: var(--accent-soft); border-radius: var(--r); font-weight: 600; margin-bottom: 14px; }
    .list { display: flex; flex-direction: column; gap: 14px; }
    .ct { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .ct[data-s='cancelled'] { opacity: .7; }
    header { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .title { font-family: var(--font-display); font-weight: 600; font-size: 1.15rem; color: var(--ink); text-decoration: none; }
    .title:hover { color: var(--primary); text-decoration: underline; }
    .meta { margin: 2px 0 0; font-size: .88rem; color: var(--ink-2); }
    .st { font-weight: 700; font-size: .8rem; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
    .st[data-s='active'] { background: var(--primary-soft); color: var(--primary); }
    .st[data-s='finished'] { background: var(--ok-soft); color: var(--ok); }
    .st[data-s='cancelled'] { background: var(--surface-2); color: var(--ink-2); }
    .body { display: grid; gap: 16px; }
    @media (min-width: 720px) { .body { grid-template-columns: 1fr 1.2fr; align-items: center; } }
    .party { display: flex; gap: 12px; align-items: center; }
    .party div { display: flex; flex-direction: column; }
    .pname { font-weight: 700; color: var(--ink); }
    .phone { display: inline-flex; gap: 4px; align-items: center; font-size: .88rem; color: var(--ok); font-weight: 600; }
    dl { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px dashed var(--line); border-radius: 10px; }
    dl div { padding: 10px 12px; }
    dl div + div { border-left: 1px dashed var(--line); }
    dt { font-size: .76rem; color: var(--ink-3); }
    dd { margin: 0; font-weight: 700; font-size: .95rem; }
    .reviews { display: grid; gap: 10px; grid-template-columns: 1fr; }
    @media (min-width: 640px) { .reviews { grid-template-columns: 1fr 1fr; } }
    .rv { background: var(--surface-2); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
    .rv p { margin: 2px 0 0; font-size: .9rem; font-style: italic; color: var(--ink-2); }
    footer { display: flex; flex-wrap: wrap; gap: 8px; border-top: 1px solid var(--line-soft); padding-top: 14px; }
    footer:empty { display: none; }
    .confirm { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `],
})
export class ContractsPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly list = signal<Contract[] | null>(null);
  readonly reviewing = signal<Contract | null>(null);
  readonly confirm = signal<{ c: Contract; action: 'finish' | 'cancel' } | null>(null);
  readonly stars = signal(0);
  readonly sending = signal(false);
  readonly label = LABEL;
  comment = '';

  readonly toReview = computed(() => (this.list() ?? []).filter((c) => c.status === 'finished' && !c.my_review).length);

  ngOnInit(): void {
    this.api.myContracts().subscribe({ next: (l) => this.list.set(l), error: () => this.list.set([]) });
  }

  other(c: Contract): User | undefined {
    return this.auth.role() === 'worker' ? c.application?.job_post?.client?.user : c.application?.worker?.user;
  }

  firstName(c: Contract): string {
    const o = this.other(c);
    return this.auth.role() === 'worker' ? (c.application?.job_post?.client?.business_name || o?.name?.split(' ')[0] || '') : (o?.name?.split(' ')[0] ?? '');
  }

  wa(c: Contract): string | null {
    return whatsappLink(this.other(c)?.phone, `Hola, te escribo por el trabajo "${c.application?.job_post?.title}" de ObraConecta.`);
  }

  openReview(c: Contract): void {
    this.stars.set(0);
    this.comment = '';
    this.reviewing.set(c);
  }

  sendReview(): void {
    const c = this.reviewing();
    if (!c) return;
    this.sending.set(true);
    this.api.review(c.id, { rating: this.stars(), comment: this.comment }).subscribe({
      next: (r) => {
        this.sending.set(false);
        this.reviewing.set(null);
        this.list.update((l) => (l ?? []).map((x) => (x.id === c.id ? { ...x, my_review: r } : x)));
        this.toast.success('Calificación publicada. Gracias por ayudar a la comunidad.');
      },
      error: (e) => { this.sending.set(false); this.toast.error(errorMessage(e)); },
    });
  }

  doConfirm(): void {
    const cf = this.confirm();
    if (!cf) return;
    const req = cf.action === 'finish' ? this.api.finishContract(cf.c.id) : this.api.cancelContract(cf.c.id);
    req.subscribe({
      next: (upd) => {
        this.confirm.set(null);
        this.list.update((l) => (l ?? []).map((x) => (x.id === upd.id ? { ...x, status: upd.status, end_date: upd.end_date } : x)));
        if (cf.action === 'finish') {
          this.toast.success('Trabajo terminado. Ahora califica cómo te fue.');
          this.openReview({ ...cf.c, status: 'finished' });
        } else {
          this.toast.info('Contratación cancelada.');
        }
      },
      error: (e) => { this.confirm.set(null); this.toast.error(errorMessage(e)); },
    });
  }
}
