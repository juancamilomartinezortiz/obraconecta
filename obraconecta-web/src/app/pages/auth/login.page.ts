import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/auth.interceptor';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth.scss',
  template: `
    <div class="auth">
      <aside class="side blueprint">
        <div>
          <h2>Tu próxima obra ya te está buscando.</h2>
          <p>Ingresa para ver tus postulaciones, responder invitaciones y escribirle a quien te contrató.</p>
          <ul>
            <li><app-icon name="check-circle" />Trabajos de tu oficio en tu ciudad</li>
            <li><app-icon name="check-circle" />Contacto por WhatsApp al ser aceptado</li>
            <li><app-icon name="check-circle" />Calificaciones que te suben en las búsquedas</li>
          </ul>
        </div>
        <div class="demo">
          <p class="demo-title">Cuentas de prueba</p>
          <div class="demo-list">
            @for (d of demos; track d.email) {
              <button type="button" (click)="fill(d.email, d.pass)">
                <strong>{{ d.label }}</strong><span>{{ d.email }}</span>
              </button>
            }
          </div>
        </div>
      </aside>

      <section class="main">
        <div class="form-box">
          <h1>Ingresar</h1>
          <p>¿No tienes cuenta? <a routerLink="/registro">Créala gratis</a></p>

          @if (error()) { <div class="alert" role="alert"><app-icon name="x" [size]="18" />{{ error() }}</div> }

          <form class="stack" (ngSubmit)="submit()" #f="ngForm">
            <div class="field">
              <label for="email">Correo electrónico</label>
              <input id="email" class="input" type="email" name="email" [(ngModel)]="email" required autocomplete="email" placeholder="tu@correo.com" />
            </div>
            <div class="field">
              <label for="password">Contraseña</label>
              <div class="pw">
                <input id="password" class="input" [type]="show() ? 'text' : 'password'" name="password" [(ngModel)]="password" required autocomplete="current-password" />
                <button type="button" class="btn-icon" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Ocultar contraseña' : 'Mostrar contraseña'"><app-icon name="eye" /></button>
              </div>
            </div>
            <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="loading() || !email || !password">
              @if (loading()) { <span class="spinner"></span>Ingresando } @else { Ingresar }
            </button>
          </form>

          <div class="demo mobile-demo">
            <p class="demo-title">Cuentas de prueba (contraseña password123)</p>
            <div class="chips">
              @for (d of demos; track d.email) { <button type="button" class="chip" (click)="fill(d.email, d.pass)">{{ d.label }}</button> }
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .demo { border-top: 1px solid rgb(255 255 255 / .2); padding-top: 18px; }
    .demo-title { font-weight: 700; color: #fff; margin-bottom: 10px; font-size: .92rem; }
    .demo-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .demo-list button { text-align: left; background: rgb(255 255 255 / .08); border: 1px solid rgb(255 255 255 / .18); color: #fff; border-radius: 10px; padding: 10px 12px; cursor: pointer; display: flex; flex-direction: column; }
    .demo-list button:hover { background: rgb(255 255 255 / .16); }
    .demo-list span { font-size: .78rem; opacity: .8; }
    .mobile-demo { border-top: 1px solid var(--line); margin-top: 28px; }
    .mobile-demo .demo-title { color: var(--ink-2); }
    @media (min-width: 960px) { .mobile-demo { display: none; } }
  `],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  /** ?volver=/ruta para regresar después de ingresar. */
  readonly volver = input<string>();

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly show = signal(false);

  readonly demos = [
    { label: 'Maestro', email: 'carlos@demo.com', pass: 'password123' },
    { label: 'Constructora', email: 'andes@demo.com', pass: 'password123' },
    { label: 'Persona natural', email: 'maria@demo.com', pass: 'password123' },
    { label: 'Administrador', email: 'admin@obraconecta.com', pass: 'admin12345' },
  ];

  fill(email: string, pass: string): void {
    this.email = email;
    this.password = pass;
    this.error.set('');
  }

  submit(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.toast.success(`Hola, ${this.auth.firstName()}.`);
        const back = this.volver();
        this.router.navigateByUrl(back && back.startsWith('/') ? back : this.auth.homeRoute());
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(errorMessage(e, 'No pudimos ingresar. Revisa tus datos.'));
      },
    });
  }
}
