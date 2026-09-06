import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CustomAlertModal, AlertType } from '../components/CustomAlertModal';

export interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

export type ShowAlertFunction = {
  (options: AlertOptions): void;
  (title: string, message: string, type?: AlertType): void;
};

export interface AlertContextType {
  showAlert: ShowAlertFunction;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Standalone global reference for non-React services (e.g. pdfService)
let globalShowAlert: ShowAlertFunction | null = null;

export const showAlertGlobal: ShowAlertFunction = (
  arg1: AlertOptions | string,
  arg2?: string,
  arg3?: AlertType
) => {
  if (globalShowAlert) {
    (globalShowAlert as any)(arg1, arg2, arg3);
  } else {
    console.warn('[AlertContext] AlertProvider not mounted to display global alert:', arg1);
  }
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertOptions>({
    title: '',
    message: '',
    type: 'info',
  });

  const optionsRef = useRef<AlertOptions | null>(null);

  const hideAlert = useCallback(() => {
    setVisible(false);
    optionsRef.current = null;
  }, []);

  const showAlert: ShowAlertFunction = useCallback(
    (arg1: AlertOptions | string, arg2?: string, arg3?: AlertType) => {
      let options: AlertOptions;
      if (typeof arg1 === 'string') {
        options = {
          title: arg1,
          message: arg2 || '',
          type: arg3 || 'info',
          confirmText: 'OK',
        };
      } else {
        options = {
          ...arg1,
          confirmText: arg1.confirmText || (arg1.cancelText ? 'Confirm' : 'OK'),
        };
      }

      optionsRef.current = options;
      setAlertConfig(options);
      setVisible(true);
    },
    []
  );

  // Register global alert callback for non-React background services
  useEffect(() => {
    globalShowAlert = showAlert;
    return () => {
      globalShowAlert = null;
    };
  }, [showAlert]);

  const handleConfirm = useCallback(() => {
    const callback = optionsRef.current?.onConfirm;
    setVisible(false);
    optionsRef.current = null;
    if (callback) {
      callback();
    }
  }, []);

  const handleCancel = useCallback(() => {
    const callback = optionsRef.current?.onCancel;
    setVisible(false);
    optionsRef.current = null;
    if (callback) {
      callback();
    }
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlertModal
        visible={visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type || 'info'}
        confirmText={alertConfig.confirmText || 'OK'}
        cancelText={alertConfig.cancelText}
        onConfirm={handleConfirm}
        onCancel={alertConfig.cancelText ? handleCancel : undefined}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
