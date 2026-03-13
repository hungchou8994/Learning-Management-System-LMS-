"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import {
  X,
  Video,
  FileText,
  Monitor,
  Link as LinkIcon,
  Clock,
  Type,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface LessonCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lessonData: LessonFormData) => Promise<void> | void;
  editData?: LessonEditData;
  isEdit?: boolean;
}

interface LessonFormData {
  title: string;
  type: "video" | "document" | "online";
  duration: number;
  description: string;
  videoUrl?: string;
  documentUrl?: string;
  meetingLink?: string;
  locked: boolean;
}

interface LessonEditData extends LessonFormData {
  _id?: string;
}

const initialFormData: LessonFormData = {
  title: "",
  type: "video",
  duration: 0,
  description: "",
  videoUrl: "",
  documentUrl: "",
  meetingLink: "",
  locked: true, // Default to locked like backend model
};

export function LessonCreateModal({
  isOpen,
  onClose,
  onSubmit,
  editData,
  isEdit = false,
}: LessonCreateModalProps) {
  const [formData, setFormData] = useState<LessonFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<LessonFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when editData changes
  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title || "",
        type: editData.type || "video",
        duration: editData.duration || 0,
        description: editData.description || "",
        videoUrl:
          (editData as LessonEditData & { video_url?: string }).video_url || "",
        documentUrl: "",
        meetingLink: "",
        locked: editData.locked !== undefined ? editData.locked : true,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editData]);

  const handleInputChange = (
    field: keyof LessonFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LessonFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề bài học là bắt buộc";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Mô tả bài học là bắt buộc";
    }
    if (formData.duration <= 0) {
      newErrors.duration = "Thời gian phải lớn hơn 0";
    }
    if (formData.type === "video" && !formData.videoUrl?.trim()) {
      newErrors.videoUrl = "URL video là bắt buộc";
    }
    if (formData.type === "document" && !formData.documentUrl?.trim()) {
      newErrors.documentUrl = "URL tài liệu là bắt buộc";
    }
    if (formData.type === "online" && !formData.meetingLink?.trim()) {
      newErrors.meetingLink = "Link meeting là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
        setFormData(initialFormData);
        setErrors({});
      } catch (error) {
        console.error("Submit error:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const lessonTypes = [
    {
      value: "video",
      label: "Video Học",
      icon: Video,
      color: "from-red-500 to-pink-500",
      description: "Video bài giảng hoặc demo",
      bgColor: "bg-red-50 border-red-200 text-red-800",
    },
    {
      value: "document",
      label: "Tài Liệu",
      icon: FileText,
      color: "from-green-500 to-emerald-500",
      description: "PDF, slides, hoặc văn bản",
      bgColor: "bg-green-50 border-green-200 text-green-800",
    },
    {
      value: "online",
      label: "Học Trực Tuyến",
      icon: Monitor,
      color: "from-blue-500 to-cyan-500",
      description: "Lớp học online hoặc webinar",
      bgColor: "bg-blue-50 border-blue-200 text-blue-800",
    },
  ];

  const currentType = lessonTypes.find((type) => type.value === formData.type);

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <Dialog.Title className="text-2xl font-bold">
                  {isEdit ? "✏️ Chỉnh sửa bài học" : "➕ Tạo bài học mới"}
                </Dialog.Title>
                <p className="text-blue-100 mt-1">
                  {isEdit
                    ? "Cập nhật thông tin bài học"
                    : "Thêm nội dung học tập cho session"}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(95vh-120px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Type className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Thông tin cơ bản
                  </h3>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Tiêu đề bài học *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors ${
                      errors.title
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    placeholder="Ví dụ: Giới thiệu về React Components"
                    disabled={isSubmitting}
                  />
                  {errors.title && (
                    <div className="flex items-center mt-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.title}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Mô tả bài học *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={4}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors resize-none ${
                      errors.description
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    placeholder="Mô tả chi tiết nội dung và mục tiêu của bài học..."
                    disabled={isSubmitting}
                  />
                  {errors.description && (
                    <div className="flex items-center mt-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.description}
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Thời gian (phút) *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) =>
                        handleInputChange(
                          "duration",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors ${
                        errors.duration
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-blue-500"
                      }`}
                      placeholder="30"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.duration && (
                    <div className="flex items-center mt-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.duration}
                    </div>
                  )}
                </div>
              </div>

              {/* Lesson Type Selection */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Monitor className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Loại bài học
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {lessonTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.value;
                    return (
                      <label
                        key={type.value}
                        className={`relative cursor-pointer group ${isSubmitting ? "pointer-events-none opacity-50" : ""}`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={type.value}
                          checked={isSelected}
                          onChange={(e) =>
                            handleInputChange(
                              "type",
                              e.target.value as LessonFormData["type"]
                            )
                          }
                          className="sr-only"
                          disabled={isSubmitting}
                        />
                        <div
                          className={`p-6 border-2 rounded-2xl transition-all duration-300 ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                              : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                          }`}
                        >
                          <div className="text-center">
                            <div
                              className={`inline-flex p-4 rounded-2xl mb-4 bg-gradient-to-br ${type.color} shadow-lg`}
                            >
                              <Icon className="h-8 w-8 text-white" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2">
                              {type.label}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {type.description}
                            </p>
                            {isSelected && (
                              <div className="mt-3">
                                <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Type-specific Content */}
              {currentType && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div
                      className={`bg-gradient-to-br ${currentType.color} p-2 rounded-lg`}
                    >
                      <LinkIcon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Nội dung {currentType.label}
                    </h3>
                  </div>

                  {formData.type === "video" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        URL Video *
                      </label>
                      <div className="relative">
                        <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          value={formData.videoUrl}
                          onChange={(e) =>
                            handleInputChange("videoUrl", e.target.value)
                          }
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors ${
                            errors.videoUrl
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 focus:border-blue-500"
                          }`}
                          placeholder="https://youtube.com/watch?v=..."
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.videoUrl && (
                        <div className="flex items-center mt-2 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.videoUrl}
                        </div>
                      )}
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                          <p className="text-sm text-blue-800">
                            Hỗ trợ: YouTube, Vimeo, hoặc link video trực tiếp.
                            Video sẽ được embed tự động.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.type === "document" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        URL Tài liệu *
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          value={formData.documentUrl}
                          onChange={(e) =>
                            handleInputChange("documentUrl", e.target.value)
                          }
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors ${
                            errors.documentUrl
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 focus:border-blue-500"
                          }`}
                          placeholder="https://drive.google.com/file/d/..."
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.documentUrl && (
                        <div className="flex items-center mt-2 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.documentUrl}
                        </div>
                      )}
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Info className="h-4 w-4 text-green-600 mt-0.5" />
                          <p className="text-sm text-green-800">
                            Hỗ trợ: PDF, Google Docs, Slides, hoặc tài liệu trực
                            tuyến khác.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.type === "online" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Link Meeting *
                      </label>
                      <div className="relative">
                        <Monitor className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          value={formData.meetingLink}
                          onChange={(e) =>
                            handleInputChange("meetingLink", e.target.value)
                          }
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors ${
                            errors.meetingLink
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 focus:border-blue-500"
                          }`}
                          placeholder="https://zoom.us/j/..."
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.meetingLink && (
                        <div className="flex items-center mt-2 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.meetingLink}
                        </div>
                      )}
                      <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Info className="h-4 w-4 text-purple-600 mt-0.5" />
                          <p className="text-sm text-purple-800">
                            Hỗ trợ: Zoom, Google Meet, Microsoft Teams, hoặc
                            platform khác.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Settings */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Lock className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Cài đặt truy cập
                  </h3>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {formData.locked ? (
                        <Lock className="h-5 w-5 text-red-500" />
                      ) : (
                        <Unlock className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {formData.locked
                            ? "🔒 Bài học bị khóa"
                            : "🔓 Bài học mở"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formData.locked
                            ? "Học viên cần hoàn thành điều kiện để mở khóa"
                            : "Học viên có thể truy cập ngay lập tức"}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.locked}
                        onChange={(e) =>
                          handleInputChange("locked", e.target.checked)
                        }
                        className="sr-only peer"
                        disabled={isSubmitting}
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-8 py-6 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              * Các trường bắt buộc phải điền
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                disabled={isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>{isEdit ? "Cập nhật bài học" : "Tạo bài học"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
