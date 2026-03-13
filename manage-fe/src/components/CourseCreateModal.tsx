"use client";

import { useState, useRef } from "react";
import { Dialog } from "@headlessui/react";
import { X, Image as ImageIcon, Plus, Trash2 } from "lucide-react";

interface CourseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseData: CourseFormData) => void;
}

interface CourseFormData {
  name: string;
  description: string;
  thumbnail: string;
  originalPrice: number;
  salePrice: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
  targets: string[];
  requirements: string[];
  hasCertificate: boolean;
}

type CourseFormErrors = Partial<Record<keyof CourseFormData, string>>;

const initialFormData: CourseFormData = {
  name: "",
  description: "",
  thumbnail: "",
  originalPrice: 0,
  salePrice: 0,
  level: "Beginner",
  tags: [],
  targets: [],
  requirements: [],
  hasCertificate: false,
};

export function CourseCreateModal({
  isOpen,
  onClose,
  onSubmit,
}: CourseCreateModalProps) {
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [errors, setErrors] = useState<CourseFormErrors>({});
  const [imagePreview, setImagePreview] = useState<string>("");
  const [newTag, setNewTag] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    field: keyof CourseFormData,
    value: string | number | boolean | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const resizeImage = (
    file: File,
    maxWidth: number = 800,
    maxHeight: number = 600,
    quality: number = 0.8
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingImage(true);

        // Check file size first
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          alert("File quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB.");
          return;
        }

        // Resize and compress image
        const resizedImage = await resizeImage(file, 800, 600, 0.8);
        setImagePreview(resizedImage);
        handleInputChange("thumbnail", resizedImage);
      } catch (error) {
        console.error("Error resizing image:", error);
        alert("Có lỗi khi xử lý ảnh. Vui lòng thử lại.");
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange("tags", [...formData.tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const addTarget = () => {
    if (newTarget.trim()) {
      handleInputChange("targets", [...formData.targets, newTarget.trim()]);
      setNewTarget("");
    }
  };

  const removeTarget = (index: number) => {
    handleInputChange(
      "targets",
      formData.targets.filter((_, i) => i !== index)
    );
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      handleInputChange("requirements", [
        ...formData.requirements,
        newRequirement.trim(),
      ]);
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    handleInputChange(
      "requirements",
      formData.requirements.filter((_, i) => i !== index)
    );
  };

  const validateForm = (): boolean => {
    const newErrors: CourseFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên khóa học là bắt buộc";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Mô tả khóa học là bắt buộc";
    }
    if (formData.originalPrice <= 0) {
      newErrors.originalPrice = "Giá gốc phải lớn hơn 0";
    }
    if (formData.salePrice <= 0) {
      newErrors.salePrice = "Giá bán phải lớn hơn 0";
    }
    if (formData.salePrice > formData.originalPrice) {
      newErrors.salePrice = "Giá bán không thể lớn hơn giá gốc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setImagePreview("");
    setNewTag("");
    setNewTarget("");
    setNewRequirement("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <Dialog.Title className="text-xl font-semibold text-white">
              🎓 Tạo khóa học mới
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Tên khóa học */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Tên khóa học *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-400"
                    placeholder="Ví dụ: Lập trình JavaScript từ cơ bản đến nâng cao"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Mô tả */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Mô tả khóa học *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
                    placeholder="Mô tả chi tiết về nội dung và lợi ích của khóa học..."
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Giá */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Giá gốc (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.originalPrice || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "originalPrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-400"
                      placeholder="99.99"
                    />
                    {errors.originalPrice && (
                      <p className="text-red-600 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.originalPrice}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Giá bán (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.salePrice || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "salePrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-400"
                      placeholder="79.99"
                    />
                    {errors.salePrice && (
                      <p className="text-red-600 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.salePrice}
                      </p>
                    )}
                  </div>
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Cấp độ khóa học
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      handleInputChange(
                        "level",
                        e.target.value as CourseFormData["level"]
                      )
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium bg-white"
                  >
                    <option value="Beginner">🌱 Người mới bắt đầu</option>
                    <option value="Intermediate">📈 Trung cấp</option>
                    <option value="Advanced">🚀 Nâng cao</option>
                  </select>
                </div>

                {/* Certificate */}
                <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <input
                    type="checkbox"
                    id="certificate"
                    checked={formData.hasCertificate}
                    onChange={(e) =>
                      handleInputChange("hasCertificate", e.target.checked)
                    }
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="certificate"
                    className="ml-3 text-sm font-medium text-gray-800"
                  >
                    🏆 Cấp chứng chỉ hoàn thành khóa học
                  </label>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Ảnh thumbnail */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Ảnh thumbnail khóa học
                  </label>
                  <div
                    onClick={!isUploadingImage ? handleImageClick : undefined}
                    className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-all duration-200 ${
                      isUploadingImage
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-sm font-medium text-gray-600 mt-3">
                          Đang xử lý ảnh...
                        </p>
                      </div>
                    ) : imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-white font-medium">
                            Click để thay đổi ảnh
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          Click để tải ảnh lên
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, JPEG (tối đa 5MB)
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Thẻ tag (từ khóa)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addTag())
                      }
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="Ví dụ: JavaScript, Web Development"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Targets */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Mục tiêu học tập
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addTarget())
                      }
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="Học viên sẽ có thể..."
                    />
                    <button
                      type="button"
                      onClick={addTarget}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.targets.map((target, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <span className="text-sm text-gray-800">
                          ✅ {target}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTarget(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Yêu cầu tham gia
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addRequirement())
                      }
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="Kiến thức cần có trước..."
                    />
                    <button
                      type="button"
                      onClick={addRequirement}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.requirements.map((requirement, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                      >
                        <span className="text-sm text-gray-800">
                          📋 {requirement}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-8 border-t mt-8">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                ❌ Hủy
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                🚀 Tạo khóa học
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
