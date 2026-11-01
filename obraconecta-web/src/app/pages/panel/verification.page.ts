import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { AuthService } from '../../core/auth.service';
import { TimeAgoPipe } from '../../core/format';
import { Verification } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-verification',
  imports: [FormsModule, IconComponent, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div>
        <h1>Verificación</h1>
        <p>Los perfiles verificados muestran una insignia verde y aparecen con el filtro "Solo identidad verificada".</p>
      </div>
    </div>

    <section class="status panel" [class.ok]="auth.user()?.is_verified">
      <span class="ic"><app-icon [name]="auth.user()?.is_verified ? 'shield' : 'clock'" [size]="28" /></span>
      <div>
        @if (auth.user()?.is_verified) {
          <h2>Tu identidad está verificada</h2>
          <p>Ya tienes la insignia en tu perfil. Puedes subir certificados (SENA, alturas) para sumar confianza.</p>
        } @else if (hasPending()) {
          <h2>Estamos revisando tus documentos</h2>
          <p>El equipo suele responder en uno o dos días hábiles.</p>
        } @else {
          <h2>Tu identidad aún no está verificada</h2>
          <p>Sube una foto de tu cédula por ambos lados. Solo la ve el equipo de ObraConecta.</p>
        }
      </div>
    </section>

    <div class="cols">
      <form class="panel stack" (ngSubmit)="send()">
        <h2 class="h">Enviar documento</h2>
        <div class="seg" role="radiogroup" aria-label="Tipo de documento">
          <button type="button" [class.on]="type === 'id_card'" (click)="type = 'id_card'">Cédula</button>
          <button type="button" [class.on]="type === 'certificate'" (click)="type = 'certificate'">Certificado</button>
        </div>
        @if (type === 'certificate') {
          <div class="field">
            <label for="ti">Nombre del certificado</label>
            <input id="ti" class="input" name="ti" [(ngModel)]="title" placeholder="Ej: Trabajo seguro en alturas, SENA" />
          </div>
        }
        <label class="drop" [class.has]="file()">
          <app-icon [name]="file() ? 'file' : 'upload'" [size]="26" />
          <strong>{{ file()?.name || 'Elegir archivo' }}</strong>
          <span class="muted small">JPG, PNG o PDF, máximo 5 MB</span>
          <input type="file" accept="image/*,application/pdf" hidden (change)="pick($event)" />
        </label>
        <button class="btn btn-primary btn-lg" type="submit" [disabled]="!file() || sending()">
          @if (sending()) { <span class="spinner"></span> } Enviar a revisión
        </button>
        <p class="small muted"><app-icon name="shield" [size]="14" /> Tus documentos se guardan en un espacio privado y nunca se muestran en tu perfil.</p>
      </form>

      <section class="panel">
        <h2 class="h">Tus envíos</h2>
        @if (list() === null) {
          <div class="sk" style="height:80px"></div>
        } @else if (list()!.length) {
          <ul class="sent">
            @for (v of list(); track v.id) {
              <li>
                <app-icon name="file" [size]="20" />
                <div>
                  <strong>{{ v.type === 'id_card' ? 'Cédula' : (v.title || 'Certificado') }}</strong>
                  <span class="muted small">Enviado {{ v.created_at | timeAgo }}</span>
                  @if (v.status === 'rejected' && v.rejection_reason) { <span class="reason">{{ v.rejection_reason }}</span> }
                </div>
                <span class="tag" [class.ok]="v.status === 'approved'" [class.danger]="v.status === 'rejected'" [class.yellow]="v.status === 'pending'">
                  {{ v.status === 'approved' ? 'Aprobado' : v.status === 'rejected' ? 'Rechazado' : 'En revisión' }}
                </span>
              </li>
            }
          </ul>
        } @else {
          <p class="muted">Todavía no has enviado documentos.</p>
        }
      </section>
    </div>
  `,
  styles: [`
    .h { font-size: 1.15rem; margin: 0 0 4px; }
    .status { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 18px; background: var(--accent-soft); border-color: var(--accent); }
    .status.ok { background: var(--ok-soft); border-color: var(--ok); }
    .status h2 { font-size: 1.2rem; margin: 0 0 4px; }
    .status p { margin: 0; color: var(--ink-2); }
    .ic { width: 52px; height: 52px; border-radius: 50%; background: var(--surface); display: grid; place-items: center; color: var(--accent-ink); flex: none; }
    .status.ok .ic { color: var(--ok); }
    .cols { display: grid; gap: 18px; }
    @media (min-width: 900px) { .cols { grid-template-columns: 1fr 1fr; align-items: start; } }
    .seg { display: grid; grid-template-columns: 1fr 1fr; background: var(--surface-2); padding: 4px; border-radius: var(--r); }
    .seg button { min-height: 40px; border: 0; border-radius: 9px; background: transparent; font-weight: 600; color: var(--ink-2); cursor: pointer; }
    .seg button.on { background: var(--surface); color: var(--ink); box-shadow: var(--shadow); }
    .drop { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 24px; border: 2px dashed var(--line); border-radius: var(--r-lg); cursor: pointer; color: var(--primary); text-align: center; }
    .drop strong { color: var(--ink); word-break: break-all; }
    .drop:hover, .drop.has { border-color: var(--primary); background: var(--primary-soft); }
    .small app-icon { vertical-align: -2px; }
    .sent { list-style: none; padding: 0; margin: 8px 0 0; display: flex; flex-direction: column; }
    .sent li { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line-soft); }
    .sent li:last-child { border-bottom: 0; }
    .sent li > app-icon { color: var(--ink-3); }
    .sent div { display: flex; flex-direction: column; }
    .reason { font-size: .84rem; color: var(--danger); }
  `],
})
export class VerificationPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly list = signal<Verification[] | null>(null);
  readonly file = signal<File | null>(null);
  readonly sending = signal(false);
  type: 'id_card' | 'certificate' = 'id_card';
  title = '';

  ngOnInit(): void {
    this.api.myVerifications().subscribe({ next: (l) => this.list.set(l), error: () => this.list.set([]) });
    this.auth.refresh();
  }

  hasPending(): boolean { return (this.list() ?? []).some((v) => v.status === 'pending'); }

  pick(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null;
    if (f && f.size > 5 * 1024 * 1024) { this.toast.error('El archivo pesa más de 5 MB.'); return; }
    this.file.set(f);
  }

  send(): void {
    const f = this.file();
    if (!f) return;
    const fd = new FormData();
    fd.append('type', this.type);
    if (this.type === 'certificate' && this.title) fd.append('title', this.title);
    fd.append('document', f);
    this.sending.set(true);
    this.api.sendVerification(fd).subscribe({
      next: (v) => {
        this.sending.set(false);
        this.file.set(null);
        this.title = '';
        this.list.update((l) => [v, ...(l ?? [])]);
        this.toast.success('Documento enviado. Te avisamos cuando lo revisemos.');
      },
      error: (e) => { this.sending.set(false); this.toast.error(errorMessage(e)); },
    });
  }
}
