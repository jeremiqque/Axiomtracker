export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let listeners: Listener[] = [];
let nextId = 1;

function notify() {
  listeners.forEach(l => l([...toasts]));
}

export function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}

export function toast(message: string, type: ToastType = 'success', duration = 4000) {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => dismiss(id), duration);
}

export function dismiss(id: number) {
  toasts = toasts.filter(t => t.id !== id);
  notify();
}
