import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { AuthService } from '../../core/auth.service';
import { CatalogService } from '../../core/catalog.service';
import { ShortDatePipe } from '../../core/format';
import { PortfolioItem } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { CoverComponent } from '../../shared/cover.component';
import { EmptyComponent } from '../../shared/empty.component';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';

interface Pending { file: File; url: string; }

@Component({
  selector: 'app-portfolio',
  imports: [FormsModule, IconComponent, CoverComponent, ModalComponent, EmptyComponent, ShortDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div>
        <h1>Mis obras</h1>
        <p>Las fotos de tu trabajo son lo primero que miran los contratantes.</p>
      </div>
      <button type="button" class="btn btn-primary" (click)="openNew()"><app-icon name="plus" />Agregar obra</button>
    </div>

    @if (items() === null) {
      <div class="grid">@for (i of [1,2,3]; track i) { <div class="sk" style="height:260px;border-radius:16px"></div> }</div>
    } @else if (items()!.length) {
      <div class="grid">
        @for (p of items(); track p.id) {
          <article class="item card">
            <app-cover [src]="p.photos?.[0]?.url" [icon]="icon()" [alt]="p.title" />
            @if ((p.photos?.length ?? 0) > 1) { <span class="count"><app-icon name="image" [size]="14" />{{ p.photos!.length }}</span> }
            <div class="info">
              <h3>{{ p.title }}</h3>
              <p class="muted small">{{ p.city?.name || 'Sin ciudad' }}@if (p.work_date) {, {{ p.work_date | shortDate: true }}}</p>
              @if (p.description) { <p class="desc">{{ p.description }}</p> }
            </div>
            <button type="button" class="btn btn-ghost btn-sm del" (click)="toDelete.set(p)"><app-icon name="trash" [size]="16" />Eliminar</button>
          </article>
        }
      </div>
    } @else {
      <app-empty icon="image" title="Sube tu primera obra" text="Con 2 o 3 obras con fotos, tu perfil genera mucha más confianza.">
        <button type="button" class="btn btn-primary" (click)="openNew()">Agregar obra</button>
      </app-empty>
    }

    <app-modal [open]="adding()" title="Agregar obra" [wide]="true" (closed)="adding.set(false)">
      <form class="stack" (ngSubmit)="save()">
        <label class="drop" [class.over]="over()" (dragover)="$event.preventDefault(); over.set(true)" (dragleave)="over.set(false)" (drop)="onDrop($event)">
          <app-icon name="upload" [size]="28" />
          <strong>Arrastra las fotos aquí o toca para elegirlas</strong>
          <span class="muted small">Hasta 10 fotos, máximo 4 MB cada una</span>
          <input type="file" accept="image/*" multiple hidden (change)="onFiles($event)" />
        </label>
        @if (files().length) {
          <div class="thumbs">
            @for (f of files(); track f.url; let i = $index) {
              <div class="thumb">
                <img [src]="f.url" [alt]="'Foto ' + (i + 1)" />
                @if (i === 0) { <span class="cover-tag">Portada</span> }
                <button type="button" aria-label="Quitar foto" (click)="removeFile(i)"><app-icon name="x" [size]="14" /></button>
              </div>
            }
          </div>
        }
        <div class="field">
          <label for="t">Nombre de la obra</label>
          <input id="t" class="input" name="t" [(ngModel)]="form.title" required maxlength="140" placeholder="Ej: Casa de 2 pisos en Bello Horizonte" />
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="c">Ciudad</label>
            <select id="c" class="select" name="c" [(ngModel)]="form.city_id">
              <option [ngValue]="null">Selecciona</option>
              @for (c of catalog.cities(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select>
          </div>
          <div class="field">
            <label for="d">Fecha en que la terminaste</label>
            <input id="d" class="input" type="date" name="d" [(ngModel)]="form.work_date" />
          </div>
        </div>
        <div class="field">
          <label for="ds">¿Qué hiciste?</label>
          <textarea id="ds" class="textarea" name="ds" [(ngModel)]="form.description" maxlength="2000" placeholder="Ej: Construcción desde cimentación hasta obra gris, 120 m²."></textarea>
        </div>
        <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="saving() || form.title.trim().length < 3">
          @if (saving()) { <span class="spinner"></span>Subiendo obra } @else { Guardar obra }
        </button>
      </form>
    </app-modal>

    <app-modal [open]="!!toDelete()" title="¿Eliminar esta obra?" (closed)="toDelete.set(null)">
      <p>Se borrarán <strong>{{ toDelete()?.title }}</strong> y sus fotos.</p>
      <div class="confirm">
        <button type="button" class="btn" (click)="toDelete.set(null)">Cancelar</button>
        <button type="button" class="btn btn-dark" (click)="remove()">Eliminar obra</button>
      </div>
    </app-modal>
  `,
  styles: [`
    .grid { display: grid; gap: 14px; grid-template-columns: 1fr; }
    @media (min-width: 600px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1200px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .item { overflow: hidden; display: flex; flex-direction: column; position: relative; }
    .item app-cover { aspect-ratio: 4 / 3; }
    .count { position: absolute; top: 10px; right: 10px; display: inline-flex; gap: 4px; align-items: center; background: rgb(29 35 42 / .75); color: #fff; font-size: .75rem; font-weight: 600; padding: 3px 8px; border-radius: 999px; }
    .info { padding: 14px 16px 6px; flex: 1; }
    .info h3 { margin: 0; font-size: 1.02rem; }
    .info p { margin: 2px 0 0; }
    .desc { font-size: .88rem; color: var(--ink-2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 6px !important; }
    .del { align-self: flex-start; margin: 0 8px 8px; color: var(--danger); }
    .drop { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; padding: 28px 16px; border: 2px dashed var(--line); border-radius: var(--r-lg); cursor: pointer; color: var(--primary); transition: all .15s; }
    .drop strong { color: var(--ink); }
    .drop:hover, .drop.over { border-color: var(--primary); background: var(--primary-soft); }
    .thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
    .thumb { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }
    .thumb button { position: absolute; top: 4px; right: 4px; width: 26px; height: 26px; border-radius: 50%; border: 0; background: rgb(29 35 42 / .8); color: #fff; display: grid; place-items: center; cursor: pointer; }
    .cover-tag { position: absolute; left: 4px; bottom: 4px; background: var(--accent); color: var(--ink); font-size: .7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
    .confirm { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `],
})
export class PortfolioPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  readonly catalog = inject(CatalogService);

  readonly items = signal<PortfolioItem[] | null>(null);
  readonly adding = signal(false);
  readonly saving = signal(false);
  readonly over = signal(false);
  readonly files = signal<Pending[]>([]);
  readonly toDelete = signal<PortfolioItem | null>(null);
  form = { title: '', city_id: null as number | null, work_date: '', description: '' };

  icon(): string { return this.auth.user()?.worker_profile?.specialties?.[0]?.icon ?? 'hardhat'; }

  ngOnInit(): void {
    this.api.portfolio().subscribe({ next: (l) => this.items.set(l), error: () => this.items.set([]) });
  }

  openNew(): void {
    this.form = { title: '', city_id: this.auth.user()?.city_id ?? null, work_date: '', description: '' };
    this.files().forEach((f) => URL.revokeObjectURL(f.url));
    this.files.set([]);
    this.adding.set(true);
  }

  onFiles(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.add(Array.from(input.files ?? []));
    input.value = '';
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.over.set(false);
    this.add(Array.from(e.dataTransfer?.files ?? []));
  }

  removeFile(i: number): void {
    URL.revokeObjectURL(this.files()[i].url);
    this.files.update((l) => l.filter((_, idx) => idx !== i));
  }

  private add(list: File[]): void {
    const ok = list.filter((f) => f.type.startsWith('image/') && f.size <= 4 * 1024 * 1024);
    if (ok.length < list.length) this.toast.info('Algunas fotos no se agregaron: deben ser imágenes de máximo 4 MB.');
    const room = 10 - this.files().length;
    this.files.update((l) => [...l, ...ok.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  save(): void {
    const fd = new FormData();
    fd.append('title', this.form.title.trim());
    if (this.form.description) fd.append('description', this.form.description);
    if (this.form.city_id) fd.append('city_id', String(this.form.city_id));
    if (this.form.work_date) fd.append('work_date', this.form.work_date);
    this.files().forEach((f) => fd.append('photos[]', f.file));
    this.saving.set(true);
    this.api.addPortfolio(fd).subscribe({
      next: (item) => {
        this.saving.set(false);
        this.adding.set(false);
        this.items.update((l) => [item, ...(l ?? [])]);
        this.toast.success('Obra agregada a tu perfil.');
      },
      error: (e) => { this.saving.set(false); this.toast.error(errorMessage(e)); },
    });
  }

  remove(): void {
    const p = this.toDelete();
    if (!p) return;
    this.api.deletePortfolio(p.id).subscribe({
      next: () => { this.items.update((l) => (l ?? []).filter((x) => x.id !== p.id)); this.toDelete.set(null); this.toast.success('Obra eliminada.'); },
      error: (e) => { this.toDelete.set(null); this.toast.error(errorMessage(e)); },
    });
  }
}
