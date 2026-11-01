import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from './logo.component';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer>
      <div class="container cols">
        <div class="about">
          <app-logo [light]="true" [size]="30" />
          <p>Conectamos a los maestros de obra del Cauca con quienes van a construir. Perfiles verificados, obras reales y calificaciones después de cada trabajo.</p>
        </div>
        <nav aria-label="Para contratantes">
          <h4>Si vas a construir</h4>
          <a routerLink="/maestros">Buscar maestros</a>
          <a routerLink="/publicar">Publicar un trabajo</a>
          <a routerLink="/registro" [queryParams]="{ rol: 'client' }">Crear cuenta de contratante</a>
        </nav>
        <nav aria-label="Para maestros">
          <h4>Si buscas trabajo</h4>
          <a routerLink="/trabajos">Ver trabajos</a>
          <a routerLink="/registro" [queryParams]="{ rol: 'worker' }">Crear mi perfil</a>
          <a routerLink="/panel/verificacion">Verificar mi identidad</a>
        </nav>
      </div>
      <div class="container legal">
        <span>© {{ year }} ObraConecta. Proyecto académico, Popayán, Colombia.</span>
        <span>Tratamiento de datos según la Ley 1581 de 2012.</span>
      </div>
    </footer>
  `,
  styles: [`
    footer { background: var(--ink); color: #C9D0D6; padding: 48px 0 calc(96px + env(safe-area-inset-bottom)); margin-top: 40px; }
    @media (min-width: 900px) { footer { padding-bottom: 32px; } }
    .cols { display: grid; gap: 32px; grid-template-columns: 1fr; }
    @media (min-width: 720px) { .cols { grid-template-columns: 1.6fr 1fr 1fr; } }
    .about p { margin-top: 14px; max-width: 46ch; font-size: .94rem; }
    h4 { color: #fff; font-size: 1rem; margin: 0 0 10px; }
    nav { display: flex; flex-direction: column; gap: 8px; }
    nav a { color: #C9D0D6; text-decoration: none; font-size: .94rem; }
    nav a:hover { color: var(--accent); }
    .legal { display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: space-between; border-top: 1px solid rgb(255 255 255 / .12);
      margin-top: 36px; padding-top: 20px; font-size: .84rem; color: #9AA4AD; }
  `],
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
