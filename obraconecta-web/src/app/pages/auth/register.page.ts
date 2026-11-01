import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage, fieldErrors } from '../../core/auth.interceptor';
import { AuthService } from '../../core/auth.service';
import { CatalogService } from '../../core/catalog.service';
import { ToastService } from '../../core/toast.service';
import { IconComponent } from '../../shared/icon.component';

type RoleChoice = 'worker' | 'client';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth.scss',
  template: `
    <div class="auth">
      <aside class="side blueprint">
        <div>
          @if (role() === 'client') {
            <h2>Encuentra al maestro indicado para tu obra.</h2>
            <p>Publica tu trabajo, compara perfiles con fotos y calificaciones reales, y contrata con tranquilidad.</p>
          } @else {
            <h2>Que tu trabajo hable por ti.</h2>
            <p>Muestra tus obras, tus años de experiencia y lo que opinan tus clientes. Las constructoras te encuentran a ti.</p>
          }
        </div>
        <p class="small">Al registrarte aceptas el tratamiento de tus datos según la Ley 1581 de 2012. Tu celular solo lo ve quien te contrata.</p>
      </aside>

      <section class="main">
        <div class="form-box">
          <div class="progress" aria-hidden="true"><span [class.on]="step() >= 1"></span><span [class.on]="step() >= 2"></span></div>
          <p class="step-label">Paso {{ step() }} de 2</p>

          @if (step() === 1) {
            <h1>Crea tu cuenta</h1>
            <p>¿Cómo vas a usar ObraConecta?</p>
            <div class="roles" role="radiogroup" aria-label="Tipo de cuenta">
              <button type="button" role="radio" class="role" [class.on]="role() === 'worker'" [attr.aria-checked]="role() === 'worker'" (click)="role.set('worker')">
                <span class="ri"><app-icon name="hardhat" [size]="28" [stroke]="1.6" /></span>
                <span><strong>Busco trabajo</strong><small>Soy maestro de obra, oficial, ayudante o especialista</small></span>
                <span class="radio"></span>
              </button>
              <button type="button" role="radio" class="role" [class.on]="role() === 'client'" [attr.aria-checked]="role() === 'client'" (click)="role.set('client')">
                <span class="ri"><app-icon name="roof" [size]="28" [stroke]="1.6" /></span>
                <span><strong>Quiero contratar</strong><small>Constructora, empresa o persona que va a construir o remodelar</small></span>
                <span class="radio"></span>
              </button>
            </div>
            <button class="btn btn-primary btn-lg btn-block" type="button" (click)="step.set(2)">Continuar</button>
            <p class="switch-link">¿Ya tienes cuenta? <a routerLink="/ingresar">Ingresa</a></p>
          } @else {
            <button type="button" class="back" (click)="step.set(1)"><app-icon name="arrow-left" [size]="16" />Cambiar tipo de cuenta</button>
            <h1>{{ role() === 'worker' ? 'Tus datos de maestro' : 'Tus datos' }}</h1>
            <p>Solo lo necesario. Lo demás lo completas después en tu perfil.</p>

            @if (error()) { <div class="alert" role="alert"><app-icon name="x" [size]="18" />{{ error() }}</div> }

            <form class="stack" (ngSubmit)="submit()">
              @if (role() === 'client') {
                <div class="seg" role="radiogroup" aria-label="Tipo de contratante">
                  <button type="button" [class.on]="form.client_type === 'person'" (click)="form.client_type = 'person'">Persona natural</button>
                  <button type="button" [class.on]="form.client_type === 'company'" (click)="form.client_type = 'company'">Empresa o constructora</button>
                </div>
                @if (form.client_type === 'company') {
                  <div class="field">
                    <label for="biz">Nombre de la empresa</label>
                    <input id="biz" class="input" name="biz" [(ngModel)]="form.business_name" placeholder="Ej: Constructora Andes S.A.S." />
                  </div>
                }
              }
              <div class="field">
                <label for="name">{{ role() === 'client' && form.client_type === 'company' ? 'Nombre de quien administra la cuenta' : 'Nombre completo' }}</label>
                <input id="name" class="input" [class.invalid]="errs()['name']" name="name" [(ngModel)]="form.name" required autocomplete="name" />
                @if (errs()['name']) { <span class="error">{{ errs()['name'] }}</span> }
              </div>
              <div class="grid-2">
                <div class="field">
                  <label for="phone">Celular (WhatsApp)</label>
                  <input id="phone" class="input" [class.invalid]="errs()['phone']" name="phone" type="tel" inputmode="numeric" [(ngModel)]="form.phone" placeholder="300 123 4567" autocomplete="tel" />
                </div>
                <div class="field">
                  <label for="city">Ciudad</label>
                  <select id="city" class="select" name="city" [(ngModel)]="form.city_id">
                    <option [ngValue]="null">Selecciona</option>
                    @for (c of catalog.cities(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
                  </select>
                </div>
              </div>
              <div class="field">
                <label for="email">Correo electrónico</label>
                <input id="email" class="input" [class.invalid]="errs()['email']" name="email" type="email" [(ngModel)]="form.email" required autocomplete="email" />
                @if (errs()['email']) { <span class="error">{{ errs()['email'] }}</span> }
              </div>
              <div class="field">
                <label for="password">Contraseña</label>
                <input id="password" class="input" [class.invalid]="errs()['password']" name="password" type="password" [(ngModel)]="form.password" required minlength="8" autocomplete="new-password" />
                <div class="meter" aria-hidden="true"><span [style.width.%]="strength() * 25" [attr.data-level]="strength()"></span></div>
                <span class="hint">{{ errs()['password'] || 'Mínimo 8 caracteres. ' + strengthLabel() }}</span>
              </div>
              <label class="check">
                <input type="checkbox" name="terms" [(ngModel)]="form.accept_terms" />
                <span>Acepto la política de tratamiento de datos personales (Ley 1581 de 2012).</span>
              </label>
              @if (errs()['accept_terms']) { <span class="error">{{ errs()['accept_terms'] }}</span> }
              <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="loading()">
                @if (loading()) { <span class="spinner"></span>Creando cuenta } @else { Crear mi cuenta }
              </button>
            </form>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .progress { display: flex; gap: 6px; margin-bottom: 8px; }
    .progress span { flex: 1; height: 5px; border-radius: 3px; background: var(--line); transition: background .3s; }
    .progress span.on { background: var(--primary); }
    .step-label { font-size: .85rem; font-weight: 600; color: var(--ink-3); margin-bottom: 18px; }
    .roles { display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; }
    .role { display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: var(--r-lg); border: 1.5px solid var(--line); background: var(--surface);
      text-align: left; cursor: pointer; transition: border-color .15s, background .15s; }
    .role:hover { border-color: #AAB4BE; }
    .role.on { border-color: var(--primary); background: var(--primary-soft); }
    .role strong { display: block; font-size: 1.05rem; }
    .role small { color: var(--ink-2); font-size: .9rem; }
    .ri { width: 52px; height: 52px; border-radius: 14px; background: var(--surface-2); color: var(--primary); display: grid; place-items: center; flex: none; }
    .role.on .ri { background: var(--primary); color: #fff; }
    .radio { margin-left: auto; width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--line); flex: none; }
    .role.on .radio { border: 7px solid var(--primary); }
    .back { background: none; border: 0; padding: 0; cursor: pointer; }
    .seg { display: grid; grid-template-columns: 1fr 1fr; background: var(--surface-2); padding: 4px; border-radius: var(--r); }
    .seg button { min-height: 42px; border: 0; border-radius: 9px; background: transparent; font-weight: 600; color: var(--ink-2); cursor: pointer; }
    .seg button.on { background: var(--surface); color: var(--ink); box-shadow: var(--shadow); }
    .meter { height: 4px; border-radius: 2px; background: var(--line-soft); overflow: hidden; }
    .meter span { display: block; height: 100%; background: var(--danger); transition: width .25s, background .25s; }
    .meter span[data-level='2'] { background: var(--warn); }
    .meter span[data-level='3'], .meter span[data-level='4'] { background: var(--ok); }
  `],
})
export class RegisterPage implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  readonly catalog = inject(CatalogService);

  /** ?rol=worker | client */
  readonly rol = input<string>();

  readonly step = signal(1);
  readonly role = signal<RoleChoice>('worker');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly errs = signal<Record<string, string>>({});

  form = {
    name: '',
    email: '',
    phone: '',
    password: '',
    city_id: null as number | null,
    client_type: 'person' as 'person' | 'company',
    business_name: '',
    accept_terms: false,
  };

  ngOnInit(): void {
    const r = this.rol();
    if (r === 'worker' || r === 'client') {
      this.role.set(r);
      this.step.set(2);
    }
  }

  strength(): number {
    const p = this.form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
    return p ? Math.max(1, s) : 0;
  }

  strengthLabel(): string {
    return ['', 'Contraseña débil.', 'Contraseña aceptable.', 'Contraseña buena.', 'Contraseña fuerte.'][this.strength()];
  }

  submit(): void {
    this.loading.set(true);
    this.error.set('');
    this.errs.set({});
    this.auth.register({ ...this.form, role: this.role() }).subscribe({
      next: () => {
        this.toast.success('Cuenta creada. Completa tu perfil para aparecer en las búsquedas.');
        this.router.navigateByUrl(this.role() === 'worker' ? '/panel/perfil' : '/publicar');
      },
      error: (e) => {
        this.loading.set(false);
        this.errs.set(fieldErrors(e));
        this.error.set(errorMessage(e, 'Revisa los datos e intenta de nuevo.'));
      },
    });
  }
}
