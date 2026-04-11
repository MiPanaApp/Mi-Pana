import { create } from 'zustand';

export const useDialogStore = create((set) => ({
  isOpen: false,
  title: '',
  message: '',
  type: 'alert', // 'alert', 'confirm', 'prompt'
  inputValue: '', // For prompt pre-fill
  onConfirm: null,
  cancelText: 'Cancelar',
  confirmText: 'Aceptar',

  showAlert: (message, title = 'Atención', confirmText = 'Entendido') => 
    new Promise((resolve) => {
      set({
        isOpen: true,
        type: 'alert',
        title,
        message,
        confirmText,
        onConfirm: () => {
          set({ isOpen: false });
          resolve(true);
        }
      });
    }),

  showConfirm: (message, title = 'Confirmar', confirmText = 'Aceptar', cancelText = 'Cancelar') => 
    new Promise((resolve) => {
      set({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: (confirmed) => {
          set({ isOpen: false });
          resolve(confirmed);
        }
      });
    }),

  showPrompt: (message, title = 'Introduce un valor', defaultValue = '', confirmText = 'Enviar', cancelText = 'Cancelar') => 
    new Promise((resolve) => {
      set({
        isOpen: true,
        type: 'prompt',
        title,
        message,
        inputValue: defaultValue,
        confirmText,
        cancelText,
        onConfirm: (val) => {
          set({ isOpen: false });
          resolve(val); // will be string if confirmed, or null if cancelled
        }
      });
    }),

  closeDialog: () => set({ isOpen: false })
}));
