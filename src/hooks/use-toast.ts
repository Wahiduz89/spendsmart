import { toast as hotToast } from 'react-hot-toast'

export function useToast() {
  return {
    toast: {
      success: (message: string) => hotToast.success(message),
      error: (message: string) => hotToast.error(message),
      loading: (message: string) => hotToast.loading(message),
      dismiss: (toastId?: string) => hotToast.dismiss(toastId),
      custom: (component: React.ReactNode) => hotToast.custom(component),
    },
  }
}