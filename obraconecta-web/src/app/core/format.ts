import { Pipe, PipeTransform } from '@angular/core';
import { ApplicationStatus, BudgetType, JobStatus } from './models';

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export function money(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'A convenir';
  return cop.format(Number(value)).replace(/\s/g, ' ');
}

/** $2.500.000 → $2,5 M · $120.000 → $120 mil */
export function shortMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'A convenir';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`;
  if (value >= 1000) return `$${Math.round(value / 1000)} mil`;
  return `$${value}`;
}

export const BUDGET_SUFFIX: Record<BudgetType, string> = { total: 'total', daily: 'por día', m2: 'por m²' };

export const JOB_STATUS: Record<JobStatus, string> = { open: 'Abierta', paused: 'Pausada', closed: 'Cerrada' };

export const APP_STATUS: Record<ApplicationStatus, string> = {
  sent: 'Enviada', seen: 'Vista', accepted: 'Aceptada', rejected: 'No seleccionada',
};

const dateFmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });
const dateFmtYear = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

/** Las fechas de Laravel vienen en ISO; las tomamos solo con la parte de fecha para no correr un día. */
function parse(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shortDate(value: string | null | undefined, withYear = false): string {
  if (!value) return 'Por definir';
  const d = parse(value);
  return (withYear || d.getFullYear() !== new Date().getFullYear() ? dateFmtYear : dateFmt).format(d).replace('.', '');
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return '';
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'hace un mes' : months < 12 ? `hace ${months} meses` : 'hace más de un año';
}

export function initials(name: string | null | undefined): string {
  return (name ?? '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  const full = digits.length === 10 ? `57${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(v: number | string | null | undefined): string { return money(v); }
}

@Pipe({ name: 'shortMoney' })
export class ShortMoneyPipe implements PipeTransform {
  transform(v: number | null | undefined): string { return shortMoney(v); }
}

@Pipe({ name: 'shortDate' })
export class ShortDatePipe implements PipeTransform {
  transform(v: string | null | undefined, withYear = false): string { return shortDate(v, withYear); }
}

@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(v: string | null | undefined): string { return timeAgo(v); }
}
