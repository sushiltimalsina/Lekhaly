"use client";

import * as React from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-primary text-white hover:bg-primary/90";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-300" 
        onClick={onCancel}
      />
      
      {/* Dialog Content */}
      <div className="relative w-full max-w-md rounded-2xl border bg-card p-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="mb-3">
          <div className={[
            "text-base font-bold",
            variant === "danger" ? "text-red-600 dark:text-red-500" : "text-foreground"
          ].join(" ")}>
            {title}
          </div>
          {description ? (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          {onCancel && cancelText && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={[
              "rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all",
              confirmClass,
              loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105 active:scale-95",
            ].join(" ")}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

