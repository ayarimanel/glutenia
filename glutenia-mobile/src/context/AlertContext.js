import React, { createContext, useContext, useState, useEffect } from "react";
import { Alert } from "react-native";
import CustomAlertDialog from "../components/CustomAlertDialog";

const AlertContext = createContext({
  showAlert: () => {},
});

// Store original Alert.alert implementation
const originalAlert = Alert.alert;

// Global trigger listener
let globalAlertTrigger = null;

// Override React Native's Alert.alert globally
Alert.alert = (title, message, buttons, options) => {
  if (globalAlertTrigger) {
    globalAlertTrigger({ title, message, buttons, options });
  } else {
    // Fallback to original Alert.alert if provider is not mounted
    originalAlert(title, message, buttons, options);
  }
};

export function AlertProvider({ children }) {
  const [alertConfig, setAlertConfig] = useState(null);

  useEffect(() => {
    // Register global trigger callback
    globalAlertTrigger = (config) => {
      setAlertConfig(config);
    };

    return () => {
      globalAlertTrigger = null;
    };
  }, []);

  const handleClose = () => {
    setAlertConfig(null);
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert: (title, message, buttons, options) => {
          if (globalAlertTrigger) {
            globalAlertTrigger({ title, message, buttons, options });
          }
        },
      }}
    >
      {children}
      {alertConfig && (
        <CustomAlertDialog
          visible={!!alertConfig}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          options={alertConfig.options}
          onClose={handleClose}
        />
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}
