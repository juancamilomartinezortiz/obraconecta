import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf blueprint">
      <div class="container">
        <p class="code">404</p>
        <h1>Esta página no está en el plano.</h1>
        <p>Puede que el enlace esté mal escrito o que la publicación ya no exista.</p>
        <div class="btns">
          <a routerLink="/" class="btn btn-accent btn-lg">Ir al inicio</a>
          <a routerLink="/maestros" class="btn btn-lg light">Buscar maestros</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .nf { min-height: calc(100dvh - var(--header-h)); display: flex; align-items: center; padding: 48px 0; }
    .code { font-family: var(--font-display); font-weight: 800; font-size: clamp(5rem, 16vw, 10rem); line-height: 1; margin: 0; color: var(--accent); letter-spacing: -.05em; }
    h1 { color: #fff; max-width: 18ch; }
    p { color: rgb(255 255 255 / .85); }
    .btns { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
    .light { --btn-bg: transparent; --btn-fg: #fff; --btn-bd: rgb(255 255 255 / .4); }
    .light:hover { background: rgb(255 255 255 / .1); color: #fff; }
  `],
})
export class NotFoundPage {}
