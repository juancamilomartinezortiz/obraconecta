export type Role = 'worker' | 'client' | 'admin';

export interface City {
  id: number;
  name: string;
  department: string;
}

export interface Specialty {
  id: number;
  name: string;
  icon: string | null;
  workers_count?: number;
}

export interface WorkerProfile {
  id: number;
  user_id: number;
  bio: string | null;
  years_experience: number;
  daily_rate: number | null;
  availability: 'available' | 'busy';
  available_from: string | null;
  work_zones: string | null;
  rating_avg: string | number;
  jobs_done: number;
  portfolio_items_count?: number;
  specialties?: Specialty[];
  user?: User;
  portfolio_items?: PortfolioItem[];
}

export interface ClientProfile {
  id: number;
  user_id: number;
  type: 'company' | 'person';
  business_name: string | null;
  nit: string | null;
  logo_url: string | null;
  description: string | null;
  user?: User;
}

export interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string | null;
  role: Role;
  city_id: number | null;
  city?: City | null;
  photo_url: string | null;
  status: 'active' | 'blocked';
  verified_at: string | null;
  is_verified: boolean;
  created_at?: string;
  worker_profile?: WorkerProfile | null;
  client_profile?: ClientProfile | null;
}

export interface PortfolioPhoto {
  id: number;
  url: string;
  position: number;
}

export interface PortfolioItem {
  id: number;
  worker_profile_id: number;
  title: string;
  description: string | null;
  city_id: number | null;
  city?: City | null;
  work_date: string | null;
  photos?: PortfolioPhoto[];
}

export type BudgetType = 'total' | 'daily' | 'm2';
export type JobStatus = 'open' | 'paused' | 'closed';

export interface JobPost {
  id: number;
  client_profile_id: number;
  specialty_id: number;
  city_id: number;
  title: string;
  description: string;
  address: string | null;
  budget: number | null;
  budget_type: BudgetType;
  start_date: string | null;
  days: number | null;
  workers_needed: number;
  status: JobStatus;
  created_at: string;
  specialty?: Specialty;
  city?: City;
  client?: ClientProfile;
  applications_count?: number;
  new_applications_count?: number;
  accepted_count?: number;
  has_applied?: boolean;
}

export type ApplicationStatus = 'sent' | 'seen' | 'accepted' | 'rejected';

export interface Application {
  id: number;
  job_post_id: number;
  worker_profile_id: number;
  message: string | null;
  rate: number | null;
  status: ApplicationStatus;
  is_invitation: boolean;
  created_at: string;
  job_post?: JobPost;
  worker?: WorkerProfile;
  contract?: Contract | null;
}

export interface Review {
  id: number;
  contract_id: number;
  reviewer_id: number;
  reviewed_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: User & { client_profile?: ClientProfile | null };
}

export interface Contract {
  id: number;
  application_id: number;
  agreed_value: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'finished' | 'cancelled';
  created_at: string;
  application?: Application;
  reviews?: Review[];
  my_review?: Review | null;
  their_review?: Review | null;
}

export interface Verification {
  id: number;
  user_id: number;
  type: 'id_card' | 'certificate';
  title: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  user?: User;
}

export interface Report {
  id: number;
  reporter_id: number;
  target_type: 'user' | 'job_post' | 'review';
  target_id: number;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: Pick<User, 'id' | 'name' | 'role'>;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface WorkerDetail {
  worker: WorkerProfile;
  reviews: Review[];
  rating_distribution: Record<string, number | undefined>;
  can_contact: boolean;
}

export interface JobDetail {
  job: JobPost;
  my_application: Application | null;
  is_owner: boolean;
}

export interface PublicStats {
  workers: number;
  open_jobs: number;
  finished_contracts: number;
  avg_rating: number;
}

export interface AdminStats {
  users: { workers: number; clients: number; verified: number; blocked: number };
  jobs: { open: number; paused: number; closed: number };
  applications: number;
  contracts: { active: number; finished: number; cancelled: number };
  pending_verifications: number;
  pending_reports: number;
  monthly: { month: string; key: string; contracts: number; jobs: number; users: number }[];
}
