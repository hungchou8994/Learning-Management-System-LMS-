"use client";

import { Dialog } from "@headlessui/react";
import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Xác nhận",
  confirmVariant = "danger",
  onConfirm,
  onClose,
  loading = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[200]">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
          <div className="p-5 border-b bg-gray-50 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-gray-600 mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
          </div>

          <div className="p-5 flex items-center justify-end gap-3">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="button"
              className={
                confirmVariant === "danger"
                  ? "btn bg-red-600 text-white hover:bg-red-700"
                  : "btn btn-primary"
              }
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : confirmText}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}


