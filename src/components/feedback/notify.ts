// src/components/feedback/notify.ts
import { toast } from 'sonner';

export const notify = {
  success: (m: string) => toast.success(m),
  error: (m: string) => toast.error(m),
  info: (m: string) => toast(m),
  warn: (m: string) => toast.warning ? toast.warning(m) : toast(m),
};
