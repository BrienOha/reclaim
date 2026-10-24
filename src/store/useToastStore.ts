import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'saving';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastStore {
  toasts: ToastItem[];
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
  syncMessage: string | null;
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  hideToast: (id: string) => void;
  setSyncStatus: (status: 'idle' | 'saving' | 'saved' | 'error', message?: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string, onRetry?: () => void) => void;
  showSaving: (message?: string) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  syncStatus: 'idle',
  syncMessage: null,

  showToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 3000);
    if (duration > 0) {
      setTimeout(() => {
        get().hideToast(id);
      }, duration);
    }

    return id;
  },

  hideToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setSyncStatus: (status, message) => {
    set({
      syncStatus: status,
      syncMessage: message || null,
    });

    if (status === 'saved') {
      setTimeout(() => {
        if (get().syncStatus === 'saved') {
          set({ syncStatus: 'idle', syncMessage: null });
        }
      }, 2500);
    }
  },

  showSuccess: (message) => {
    get().setSyncStatus('saved', message);
    get().showToast({ message, type: 'success' });
  },

  showError: (message, onRetry) => {
    get().setSyncStatus('error', message);
    get().showToast({
      message,
      type: 'error',
      actionLabel: onRetry ? 'Retry' : undefined,
      onAction: onRetry,
      duration: 6000,
    });
  },

  showSaving: (message = 'Saving to Supabase...') => {
    get().setSyncStatus('saving', message);
  },
}));
