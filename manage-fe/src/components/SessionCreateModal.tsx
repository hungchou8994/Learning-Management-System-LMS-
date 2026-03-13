"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";

interface SessionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sessionData: SessionFormData) => void;
  initialData?: Partial<SessionFormData>;
  title?: string;
  submitLabel?: string;
}

interface SessionFormData {
  name: string;
  description: string;
}

const initialFormData: SessionFormData = {
  name: "",
  description: "",
};

export function SessionCreateModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = "Tạo session mới",
  submitLabel = "Tạo session",
}: SessionCreateModalProps) {
  const [formData, setFormData] = useState<SessionFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<SessionFormData>>({});

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
    });
    setErrors({});
  }, [isOpen, initialData?.name, initialData?.description]);

  const handleInputChange = (field: keyof SessionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SessionFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên session là bắt buộc";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Mô tả session là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData(initialFormData);
      setErrors({});
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              {title}
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Tên session */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên session *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên session"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mô tả về nội dung session"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {submitLabel}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
