import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  success(text: string): void { this.push('success', text); }
  error(text: string): void { this.push('error', text); }
  info(text: string): void { this.push('info', text); }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: Toast['kind'], text: string): void {
    // Evita repetir el mismo mensaje si ya está en pantalla
    if (this.toasts().some((t) => t.text === text)) return;
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, kind, text }].slice(-4));
    setTimeout(() => this.dismiss(id), kind === 'error' ? 6000 : 3800);
  }
}
