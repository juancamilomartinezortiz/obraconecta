import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/auth.interceptor';
import { CatalogService } from '../../core/catalog.service';
import { TimeAgoPipe } from '../../core/format';
import { AdminStats, Paginated, Report, User, Verification } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { EmptyComponent } from '../../shared/empty.component';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';
import { PagerComponent } from '../../shared/pager.component';

type Tab = 'resumen' | 'usuarios' | 'verificaciones' | 'reportes' | 'catalogos';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, RouterLink, IconComponent, AvatarComponent, EmptyComponent, ModalComponent, PagerComponent, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.scss',
})
export class AdminPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly catalog = inject(CatalogService);

  readonly tab = signal<Tab>('resumen');
  readonly stats = signal<AdminStats | null>(null);
  readonly users = signal<Paginated<User> | null>(null);
  readonly verifs = signal<Verification[] | null>(null);
  readonly reports = signal<Report[] | null>(null);

  userQ = '';
  userRole = '';
  userPage = 1;
  private userSearch = new Subject<void>();
  verifStatus = 'pending';
  reportStatus = 'pending';

  // Revisión de documento
  readonly reviewing = signal<Verification | null>(null);
  readonly docUrl = signal<string | null>(null);
  readonly docIsPdf = signal(false);
  rejectReason = '';

  newSpecialty = '';
  newCity = '';
  newDept = 'Cauca';

  readonly tabs: { v: Tab; label: string; icon: string }[] = [
    { v: 'resumen', label: 'Resumen', icon: 'chart' },
    { v: 'usuarios', label: 'Usuarios', icon: 'users' },
    { v: 'verificaciones', label: 'Verificaciones', icon: 'shield' },
    { v: 'reportes', label: 'Reportes', icon: 'flag' },
    { v: 'catalogos', label: 'Oficios y ciudades', icon: 'settings' },
  ];

  readonly maxMonthly = computed(() => Math.max(1, ...(this.stats()?.monthly ?? []).flatMap((m) => [m.jobs, m.contracts, m.users])));

  ngOnInit(): void {
    this.loadStats();
    this.userSearch.pipe(debounceTime(300)).subscribe(() => { this.userPage = 1; this.loadUsers(); });
  }

  go(t: Tab): void {
    this.tab.set(t);
    if (t === 'usuarios' && !this.users()) this.loadUsers();
    if (t === 'verificaciones' && !this.verifs()) this.loadVerifs();
    if (t === 'reportes' && !this.reports()) this.loadReports();
    if (t === 'resumen') this.loadStats();
  }

  badge(t: Tab): number {
    if (t === 'verificaciones') return this.stats()?.pending_verifications ?? 0;
    if (t === 'reportes') return this.stats()?.pending_reports ?? 0;
    return 0;
  }

  h(v: number): number { return Math.round((v / this.maxMonthly()) * 100); }

  loadStats(): void { this.api.adminStats().subscribe({ next: (s) => this.stats.set(s), error: () => {} }); }

  // ---------- Usuarios ----------
  searchUsers(): void { this.userSearch.next(); }
  loadUsers(): void {
    this.api.adminUsers({ q: this.userQ, role: this.userRole, page: this.userPage }).subscribe({ next: (p) => this.users.set(p), error: () => {} });
  }
  pageUsers(p: number): void { this.userPage = p; this.loadUsers(); }
  toggleBlock(u: User): void {
    const status = u.status === 'active' ? 'blocked' : 'active';
    this.api.adminSetUserStatus(u.id, status).subscribe({
      next: () => {
        this.users.update((pg) => (pg ? { ...pg, data: pg.data.map((x) => (x.id === u.id ? { ...x, status } : x)) } : pg));
        this.toast.success(status === 'blocked' ? `${u.name} fue bloqueado.` : `${u.name} fue desbloqueado.`);
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
  roleName(r: string): string { return ({ worker: 'Maestro', client: 'Contratante', admin: 'Admin' } as Record<string, string>)[r] ?? r; }

  // ---------- Verificaciones ----------
  loadVerifs(): void {
    this.verifs.set(null);
    this.api.adminVerifications(this.verifStatus).subscribe({ next: (l) => this.verifs.set(l), error: () => this.verifs.set([]) });
  }
  openDoc(v: Verification): void {
    this.reviewing.set(v);
    this.rejectReason = '';
    this.docUrl.set(null);
    this.api.adminVerificationDocument(v.id).subscribe({
      next: (blob) => { this.docIsPdf.set(blob.type === 'application/pdf'); this.docUrl.set(URL.createObjectURL(blob)); },
      error: () => this.toast.error('No se pudo abrir el documento.'),
    });
  }
  closeDoc(): void {
    const u = this.docUrl();
    if (u) URL.revokeObjectURL(u);
    this.docUrl.set(null);
    this.reviewing.set(null);
  }
  decide(status: 'approved' | 'rejected'): void {
    const v = this.reviewing();
    if (!v) return;
    this.api.adminReviewVerification(v.id, { status, rejection_reason: status === 'rejected' ? this.rejectReason : undefined }).subscribe({
      next: () => {
        this.verifs.update((l) => (l ?? []).filter((x) => x.id !== v.id || this.verifStatus === 'all'));
        this.stats.update((s) => (s ? { ...s, pending_verifications: Math.max(0, s.pending_verifications - 1) } : s));
        this.closeDoc();
        this.toast.success(status === 'approved' ? 'Verificación aprobada. El usuario ya tiene la insignia.' : 'Verificación rechazada.');
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  // ---------- Reportes ----------
  loadReports(): void {
    this.reports.set(null);
    this.api.adminReports(this.reportStatus).subscribe({ next: (l) => this.reports.set(l), error: () => this.reports.set([]) });
  }
  setReport(r: Report, status: 'resolved' | 'dismissed'): void {
    this.api.adminSetReportStatus(r.id, status).subscribe({
      next: () => {
        this.reports.update((l) => (l ?? []).filter((x) => x.id !== r.id || this.reportStatus === 'all'));
        this.stats.update((s) => (s ? { ...s, pending_reports: Math.max(0, s.pending_reports - 1) } : s));
        this.toast.success(status === 'resolved' ? 'Reporte marcado como resuelto.' : 'Reporte descartado.');
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
  targetLink(r: Report): string[] | null {
    if (r.target_type === 'job_post') return ['/trabajos', String(r.target_id)];
    return null;
  }
  targetName(r: Report): string {
    return ({ user: 'Perfil de usuario', job_post: 'Oferta de trabajo', review: 'Reseña' } as const)[r.target_type] + ' #' + r.target_id;
  }

  // ---------- Catálogos ----------
  addSpecialty(): void {
    if (!this.newSpecialty.trim()) return;
    this.api.adminAddSpecialty(this.newSpecialty.trim()).subscribe({
      next: () => { this.newSpecialty = ''; this.catalog.load(true); this.toast.success('Oficio agregado.'); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
  delSpecialty(id: number): void {
    this.api.adminDeleteSpecialty(id).subscribe({
      next: () => { this.catalog.load(true); this.toast.success('Oficio eliminado.'); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
  addCity(): void {
    if (!this.newCity.trim()) return;
    this.api.adminAddCity(this.newCity.trim(), this.newDept.trim() || 'Cauca').subscribe({
      next: () => { this.newCity = ''; this.catalog.load(true); this.toast.success('Ciudad agregada.'); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
  delCity(id: number): void {
    this.api.adminDeleteCity(id).subscribe({
      next: () => { this.catalog.load(true); this.toast.success('Ciudad eliminada.'); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
