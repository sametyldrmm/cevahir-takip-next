"use client";

import { useState } from "react";

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "confirm" | "loading";
  onConfirm?: () => void;
}

export function useDialog() {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showSuccess = (title: string, message: string) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type: "success",
    });
  };

  const showError = (title: string, message: string) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type: "error",
    });
  };

  const showInfo = (title: string, message: string) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type: "info",
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type: "confirm",
      onConfirm,
    });
  };

  const showLoading = (message: string = "Yükleniyor...") => {
    setDialog({
      isOpen: true,
      title: "",
      message,
      type: "loading",
    });
  };

  const close = () => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    dialog,
    showSuccess,
    showError,
    showInfo,
    showConfirm,
    showLoading,
    close,
  };
}

interface DialogProps {
  dialog: DialogState;
  onClose: () => void;
}

export function Dialog({ dialog, onClose }: DialogProps) {
  if (!dialog.isOpen) return null;

  const getColorClasses = () => {
    switch (dialog.type) {
      case "success":
        return "text-success";
      case "error":
        return "text-error";
      case "info":
        return "text-primary";
      case "confirm":
        return "text-warning";
      default:
        return "text-on-surface";
    }
  };

  if (dialog.type === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-surface-container rounded-xl p-8 shadow-2xl border border-outline-variant">
          <div className="flex items-center gap-4">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent"></div>
            <p className="text-on-surface font-medium">{dialog.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (dialog.type === "confirm") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-md w-full border border-outline-variant">
          <h3 className={`text-xl font-bold mb-3 ${getColorClasses()}`}>
            {dialog.title}
          </h3>
          <p className="text-on-surface-variant mb-6 leading-relaxed">
            {dialog.message}
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-on-surface-variant hover:text-(--on-surface) hover:bg-(--surface-container-high) rounded-lg transition-all font-medium"
            >
              İptal
            </button>
            <button
              onClick={() => {
                dialog.onConfirm?.();
                onClose();
              }}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md"
            >
              Evet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-md w-full border border-outline-variant">
        <h3 className={`text-xl font-bold mb-3 ${getColorClasses()}`}>
          {dialog.title}
        </h3>
        <p className="text-on-surface-variant mb-6 leading-relaxed">
          {dialog.message}
        </p>
        <div className="flex justify-end pt-4 border-t border-outline-variant">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
