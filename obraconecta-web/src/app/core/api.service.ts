import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './config';
import {
  AdminStats, Application, City, Contract, JobDetail, JobPost, Paginated, PortfolioItem,
  PublicStats, Report, Review, Specialty, User, Verification, WorkerDetail, WorkerProfile,
} from './models';

type Params = Record<string, string | number | boolean | null | undefined>;

function toParams(params: Params = {}): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '' && v !== false) {
      p = p.set(k, String(v));
    }
  }
  return p;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private url = API_URL;

  // ---------- Auth ----------
  register(body: Record<string, unknown>): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.url}/auth/register`, body);
  }
  login(email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.url}/auth/login`, { email, password });
  }
  me(): Observable<User> {
    return this.http.get<User>(`${this.url}/auth/me`);
  }
  logout(): Observable<unknown> {
    return this.http.post(`${this.url}/auth/logout`, {});
  }

  // ---------- Catálogos ----------
  catalogs(): Observable<{ cities: City[]; specialties: Specialty[] }> {
    return this.http.get<{ cities: City[]; specialties: Specialty[] }>(`${this.url}/catalogs`);
  }
  stats(): Observable<PublicStats> {
    return this.http.get<PublicStats>(`${this.url}/stats`);
  }

  // ---------- Maestros ----------
  workers(params: Params): Observable<Paginated<WorkerProfile>> {
    return this.http.get<Paginated<WorkerProfile>>(`${this.url}/workers`, { params: toParams(params) });
  }
  worker(id: number): Observable<WorkerDetail> {
    return this.http.get<WorkerDetail>(`${this.url}/workers/${id}`);
  }
  invite(workerId: number, body: { job_post_id: number; message?: string }): Observable<Application> {
    return this.http.post<Application>(`${this.url}/workers/${workerId}/invite`, body);
  }

  // ---------- Ofertas ----------
  jobs(params: Params): Observable<Paginated<JobPost>> {
    return this.http.get<Paginated<JobPost>>(`${this.url}/jobs`, { params: toParams(params) });
  }
  job(id: number): Observable<JobDetail> {
    return this.http.get<JobDetail>(`${this.url}/jobs/${id}`);
  }
  myJobs(): Observable<JobPost[]> {
    return this.http.get<JobPost[]>(`${this.url}/me/jobs`);
  }
  createJob(body: Partial<JobPost>): Observable<JobPost> {
    return this.http.post<JobPost>(`${this.url}/jobs`, body);
  }
  updateJob(id: number, body: Partial<JobPost>): Observable<JobPost> {
    return this.http.put<JobPost>(`${this.url}/jobs/${id}`, body);
  }
  setJobStatus(id: number, status: string): Observable<JobPost> {
    return this.http.patch<JobPost>(`${this.url}/jobs/${id}/status`, { status });
  }
  deleteJob(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/jobs/${id}`);
  }
  jobApplications(id: number): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.url}/jobs/${id}/applications`);
  }

  // ---------- Postulaciones ----------
  apply(jobId: number, body: { message?: string; rate?: number | null }): Observable<Application> {
    return this.http.post<Application>(`${this.url}/jobs/${jobId}/apply`, body);
  }
  myApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.url}/me/applications`);
  }
  setApplicationStatus(id: number, status: string): Observable<Application> {
    return this.http.patch<Application>(`${this.url}/applications/${id}`, { status });
  }

  // ---------- Contratos ----------
  myContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.url}/me/contracts`);
  }
  finishContract(id: number): Observable<Contract> {
    return this.http.patch<Contract>(`${this.url}/contracts/${id}/finish`, {});
  }
  cancelContract(id: number): Observable<Contract> {
    return this.http.patch<Contract>(`${this.url}/contracts/${id}/cancel`, {});
  }
  review(contractId: number, body: { rating: number; comment?: string }): Observable<Review> {
    return this.http.post<Review>(`${this.url}/contracts/${contractId}/reviews`, body);
  }

  // ---------- Perfil ----------
  updateProfile(body: Record<string, unknown>): Observable<User> {
    return this.http.put<User>(`${this.url}/me/profile`, body);
  }
  uploadPhoto(file: File): Observable<User> {
    const fd = new FormData();
    fd.append('photo', file);
    return this.http.post<User>(`${this.url}/me/photo`, fd);
  }
  portfolio(): Observable<PortfolioItem[]> {
    return this.http.get<PortfolioItem[]>(`${this.url}/me/portfolio`);
  }
  addPortfolio(fd: FormData): Observable<PortfolioItem> {
    return this.http.post<PortfolioItem>(`${this.url}/me/portfolio`, fd);
  }
  deletePortfolio(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/me/portfolio/${id}`);
  }
  myVerifications(): Observable<Verification[]> {
    return this.http.get<Verification[]>(`${this.url}/me/verifications`);
  }
  sendVerification(fd: FormData): Observable<Verification> {
    return this.http.post<Verification>(`${this.url}/me/verifications`, fd);
  }
  report(body: { target_type: string; target_id: number; reason: string }): Observable<Report> {
    return this.http.post<Report>(`${this.url}/reports`, body);
  }

  // ---------- Administración ----------
  adminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.url}/admin/stats`);
  }
  adminUsers(params: Params): Observable<Paginated<User>> {
    return this.http.get<Paginated<User>>(`${this.url}/admin/users`, { params: toParams(params) });
  }
  adminSetUserStatus(id: number, status: string): Observable<User> {
    return this.http.patch<User>(`${this.url}/admin/users/${id}/status`, { status });
  }
  adminVerifications(status = 'pending'): Observable<Verification[]> {
    return this.http.get<Verification[]>(`${this.url}/admin/verifications`, { params: toParams({ status }) });
  }
  adminVerificationDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/admin/verifications/${id}/document`, { responseType: 'blob' });
  }
  adminReviewVerification(id: number, body: { status: string; rejection_reason?: string }): Observable<Verification> {
    return this.http.patch<Verification>(`${this.url}/admin/verifications/${id}`, body);
  }
  adminReports(status = 'pending'): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.url}/admin/reports`, { params: toParams({ status }) });
  }
  adminSetReportStatus(id: number, status: string): Observable<Report> {
    return this.http.patch<Report>(`${this.url}/admin/reports/${id}`, { status });
  }
  adminAddSpecialty(name: string): Observable<Specialty> {
    return this.http.post<Specialty>(`${this.url}/admin/specialties`, { name });
  }
  adminDeleteSpecialty(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/admin/specialties/${id}`);
  }
  adminAddCity(name: string, department: string): Observable<City> {
    return this.http.post<City>(`${this.url}/admin/cities`, { name, department });
  }
  adminDeleteCity(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/admin/cities/${id}`);
  }
}
