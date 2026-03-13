"use client";

import { Dialog } from "@headlessui/react";
import type React from "react";

export function DetailDialog({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[250]">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-5xl rounded-2xl bg-white shadow-xl overflow-hidden">
          <div className="p-5 border-b bg-gray-50">
            <Dialog.Title className="text-lg font-semibold text-gray-900">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className="text-sm text-gray-600 mt-1">
                {description}
              </Dialog.Description>
            ) : null}
          </div>
          <div className="p-5">{children}</div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}


