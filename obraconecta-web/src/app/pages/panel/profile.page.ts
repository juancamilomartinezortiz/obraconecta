import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { errorMessage, fieldErrors } from '../../core/auth.interceptor';
import { AuthService } from '../../core/auth.service';
import { CatalogService } from '../../core/catalog.service';
import { money } from '../../core/format';
import { ToastService } from '../../core/toast.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink, IconComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div>
        <h1>Mi perfil</h1>
        <p>{{ isWorker() ? 'Esto es lo que ven los contratantes cuando te buscan.' : 'Los maestros ven esta información en tus ofertas.' }}</p>
      </div>
      @if (isWorker()) {
        <a [routerLink]="['/maestros', auth.user()?.worker_profile?.id]" class="btn"><app-icon name="eye" />Ver como lo ven otros</a>
      }
    </div>

    <form class="stack" (ngSubmit)="save()">
      <section class="panel photo-row">
        <app-avatar [name]="f.name" [src]="preview() || auth.user()?.photo_url" [size]="96" [verified]="!!auth.user()?.is_verified" />
        <div>
          <h2 class="h">Foto de perfil</h2>
          <p class="muted small">{{ isWorker() ? 'Una foto clara de tu cara genera más confianza. Puede ser en la obra.' : 'Tu foto o el logo de tu empresa.' }}</p>
          <label class="btn btn-sm upload">
            @if (uploading()) { <span class="spinner"></span>Subiendo } @else { <app-icon name="upload" [size]="18" />Cambiar foto }
            <input type="file" accept="image/*" (change)="onPhoto($event)" hidden />
          </label>
        </div>
      </section>

      <section class="panel stack">
        <h2 class="h">Datos básicos</h2>
        <div class="grid-2">
          <div class="field">
            <label for="name">Nombre completo</label>
            <input id="name" class="input" name="name" [(ngModel)]="f.name" required [class.invalid]="errs()['name']" />
            @if (errs()['name']) { <span class="error">{{ errs()['name'] }}</span> }
          </div>
          <div class="field">
            <label for="phone">Celular (WhatsApp)</label>
            <input id="phone" class="input" name="phone" type="tel" [(ngModel)]="f.phone" placeholder="300 123 4567" />
            <span class="hint">Solo lo ve quien te contrata o a quien contratas.</span>
          </div>
          <div class="field">
            <label for="email">Correo</label>
            <input id="email" class="input" [value]="auth.user()?.email" disabled />
          </div>
          <div class="field">
            <label for="city">Ciudad</label>
            <select id="city" class="select" name="city" [(ngModel)]="f.city_id">
              <option [ngValue]="null">Selecciona</option>
              @for (c of catalog.cities(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select>
          </div>
        </div>
      </section>

      @if (isWorker()) {
        <section class="panel stack">
          <h2 class="h">Tu oficio</h2>
          <fieldset class="field">
            <legend class="label">Especialidades <span class="muted small">(elige hasta 8)</span></legend>
            <div class="chips">
              @for (s of catalog.specialties(); track s.id) {
                <button type="button" class="chip" [class.on]="has(s.id)" [attr.aria-pressed]="has(s.id)" (click)="toggle(s.id)">
                  <app-icon [name]="has(s.id) ? 'check' : (s.icon || 'hardhat')" [size]="16" />{{ s.name }}
                </button>
              }
            </div>
          </fieldset>
          <div class="field">
            <label for="bio">Presentación</label>
            <textarea id="bio" class="textarea" rows="5" name="bio" [(ngModel)]="f.bio" maxlength="2000"
              placeholder="Ej: Maestro de obra con 15 años construyendo casas en Popayán. Trabajo con mi equipo y herramienta propia."></textarea>
            <span class="hint">{{ (f.bio || '').length }} / 2000. Cuenta qué obras haces, con quién trabajas y qué te diferencia.</span>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="years">Años de experiencia</label>
              <input id="years" class="input num" type="number" min="0" max="70" name="years" [(ngModel)]="f.years_experience" />
            </div>
            <div class="field">
              <label for="rate">Tarifa aproximada por día</label>
              <div class="input-prefix"><span>$</span><input id="rate" class="input num" type="number" min="0" step="5000" name="rate" [(ngModel)]="f.daily_rate" /></div>
              <span class="hint">{{ f.daily_rate ? rateText() + ' por día' : 'Si la dejas vacía, aparece "A convenir".' }}</span>
            </div>
          </div>
          <div class="field">
            <label for="zones">Barrios o municipios donde trabajas</label>
            <input id="zones" class="input" name="zones" [(ngModel)]="f.work_zones" maxlength="255" placeholder="Ej: Centro, Bello Horizonte, Timbío" />
          </div>
        </section>

        <section class="panel stack">
          <h2 class="h">Disponibilidad</h2>
          <label class="switch">
            <input type="checkbox" name="avail" [ngModel]="f.availability === 'available'" (ngModelChange)="f.availability = $event ? 'available' : 'busy'" />
            {{ f.availability === 'available' ? 'Disponible para nuevos trabajos' : 'Ocupado por ahora' }}
          </label>
          @if (f.availability === 'available') {
            <div class="field narrow">
              <label for="from">Disponible desde (opcional)</label>
              <input id="from" class="input" type="date" name="from" [(ngModel)]="f.available_from" />
            </div>
          }
        </section>
      } @else {
        <section class="panel stack">
          <h2 class="h">Tu empresa o tu información</h2>
          <div class="seg" role="radiogroup" aria-label="Tipo">
            <button type="button" [class.on]="f.client_type === 'person'" (click)="f.client_type = 'person'">Persona natural</button>
            <button type="button" [class.on]="f.client_type === 'company'" (click)="f.client_type = 'company'">Empresa o constructora</button>
          </div>
          @if (f.client_type === 'company') {
            <div class="grid-2">
              <div class="field">
                <label for="biz">Razón social</label>
                <input id="biz" class="input" name="biz" [(ngModel)]="f.business_name" />
              </div>
              <div class="field">
                <label for="nit">NIT</label>
                <input id="nit" class="input num" name="nit" [(ngModel)]="f.nit" placeholder="900123456-1" />
              </div>
            </div>
          }
          <div class="field">
            <label for="desc">Descripción</label>
            <textarea id="desc" class="textarea" name="desc" [(ngModel)]="f.description" maxlength="2000"
              placeholder="Ej: Constructora con 12 años en el Cauca, proyectos de vivienda."></textarea>
          </div>
        </section>
      }

      <div class="save-bar">
        <span class="muted small">{{ dirty() ? 'Tienes cambios sin guardar.' : 'Todo guardado.' }}</span>
        <button class="btn btn-primary btn-lg" type="submit" [disabled]="saving()">
          @if (saving()) { <span class="spinner"></span> } Guardar cambios
        </button>
      </div>
    </form>
  `,
  styles: [`
    .h { font-size: 1.15rem; margin: 0; }
    .photo-row { display: flex; gap: 20px; align-items: center; }
    .photo-row p { margin: 4px 0 10px; }
    .upload { cursor: pointer; }
    fieldset { border: 0; padding: 0; margin: 0; }
    .narrow { max-width: 260px; }
    .seg { display: grid; grid-template-columns: 1fr 1fr; background: var(--surface-2); padding: 4px; border-radius: var(--r); max-width: 460px; }
    .seg button { min-height: 42px; border: 0; border-radius: 9px; background: transparent; font-weight: 600; color: var(--ink-2); cursor: pointer; }
    .seg button.on { background: var(--surface); color: var(--ink); box-shadow: var(--shadow); }
    .save-bar { position: sticky; bottom: 76px; z-index: 5; display: flex; justify-content: space-between; align-items: center; gap: 12px;
      background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); padding: 12px 12px 12px 20px; box-shadow: var(--shadow-lg); }
    @media (min-width: 900px) { .save-bar { bottom: 16px; } }
  `],
})
export class ProfilePage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly auth = inject(AuthService);
  readonly catalog = inject(CatalogService);

  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly preview = signal<string | null>(null);
  readonly errs = signal<Record<string, string>>({});
  readonly isWorker = computed(() => this.auth.role() === 'worker');

  f = {
    name: '', phone: '', city_id: null as number | null,
    bio: '', years_experience: 0, daily_rate: null as number | null, availability: 'available' as 'available' | 'busy',
    available_from: '', work_zones: '', specialties: [] as number[],
    client_type: 'person' as 'person' | 'company', business_name: '', nit: '', description: '',
  };
  private initial = '';

  ngOnInit(): void {
    const u = this.auth.user();
    if (!u) return;
    const w = u.worker_profile;
    const c = u.client_profile;
    this.f = {
      name: u.name, phone: u.phone ?? '', city_id: u.city_id,
      bio: w?.bio ?? '', years_experience: w?.years_experience ?? 0, daily_rate: w?.daily_rate ?? null,
      availability: w?.availability ?? 'available', available_from: w?.available_from?.slice(0, 10) ?? '', work_zones: w?.work_zones ?? '',
      specialties: (w?.specialties ?? []).map((s) => s.id),
      client_type: c?.type ?? 'person', business_name: c?.business_name ?? '', nit: c?.nit ?? '', description: c?.description ?? '',
    };
    this.initial = JSON.stringify(this.f);
  }

  dirty(): boolean { return JSON.stringify(this.f) !== this.initial; }
  has(id: number): boolean { return this.f.specialties.includes(id); }
  rateText(): string { return money(this.f.daily_rate); }

  toggle(id: number): void {
    if (this.has(id)) this.f.specialties = this.f.specialties.filter((x) => x !== id);
    else if (this.f.specialties.length < 8) this.f.specialties = [...this.f.specialties, id];
    else this.toast.info('Puedes elegir hasta 8 especialidades.');
  }

  onPhoto(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { this.toast.error('La foto pesa más de 4 MB. Elige una más liviana.'); return; }
    this.preview.set(URL.createObjectURL(file));
    this.uploading.set(true);
    this.api.uploadPhoto(file).subscribe({
      next: (u) => { this.auth.setUser(u); this.uploading.set(false); this.toast.success('Foto actualizada.'); },
      error: (err) => { this.uploading.set(false); this.preview.set(null); this.toast.error(errorMessage(err)); },
    });
  }

  save(): void {
    this.saving.set(true);
    this.errs.set({});
    const body: Record<string, unknown> = { name: this.f.name, phone: this.f.phone || null, city_id: this.f.city_id };
    if (this.isWorker()) {
      Object.assign(body, {
        bio: this.f.bio || null, years_experience: this.f.years_experience || 0, daily_rate: this.f.daily_rate || null,
        availability: this.f.availability, available_from: this.f.available_from || null, work_zones: this.f.work_zones || null,
        specialties: this.f.specialties,
      });
    } else {
      Object.assign(body, { client_type: this.f.client_type, business_name: this.f.business_name || null, nit: this.f.nit || null, description: this.f.description || null });
    }
    this.api.updateProfile(body).subscribe({
      next: (u) => {
        this.auth.setUser(u);
        this.saving.set(false);
        this.initial = JSON.stringify(this.f);
        this.toast.success('Perfil guardado.');
      },
      error: (e) => { this.saving.set(false); this.errs.set(fieldErrors(e)); this.toast.error(errorMessage(e)); },
    });
  }
}
