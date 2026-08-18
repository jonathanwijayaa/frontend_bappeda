/**
 * context/ToastContext.tsx
 * Toast Provider global — menghilangkan duplikasi state toast di 12+ halaman.
 * Wrap App dengan <ToastProvider> dan gunakan useToast() di komponen manapun.
 */
import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import Toast from "../components/ui/Toast";
import type { ToastType } from "../components/ui/Toast";

interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const handleClose = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={handleClose} />
      )}
    </ToastContext.Provider>
  );
};
