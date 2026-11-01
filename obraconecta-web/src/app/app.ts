import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { CatalogService } from './core/catalog.service';
import { HeaderComponent } from './layout/header.component';
import { BottomNavComponent } from './layout/bottom-nav.component';
import { FooterComponent } from './layout/footer.component';
import { ToastHostComponent } from './shared/toast-host.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, BottomNavComponent, FooterComponent, ToastHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip" href="#contenido">Saltar al contenido</a>
    <app-header />
    <main id="contenido"><router-outlet /></main>
    <app-footer />
    <app-bottom-nav />
    <app-toast-host />
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100dvh; }
    main { flex: 1; }
    .skip { position: absolute; left: 12px; top: -60px; z-index: 100; background: var(--ink); color: #fff; padding: 10px 14px; border-radius: 8px; }
    .skip:focus { top: 12px; }
  `],
})
export class App implements OnInit {
  private auth = inject(AuthService);
  private catalog = inject(CatalogService);

  ngOnInit(): void {
    this.catalog.load();
    this.auth.refresh();
  }
}
