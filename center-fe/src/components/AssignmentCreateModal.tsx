"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import {
  X,
  Plus,
  Trash2,
  ClipboardList,
  Clock,
  Calendar,
  Percent,
  FileText,
  CheckCircle,
  AlertCircle,
  BarChart3,
  HelpCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface AssignmentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assignmentData: AssignmentFormData) => Promise<void> | void;
  editData?: Assignment;
  isEdit?: boolean;
}

interface Question {
  clientId: number;
  title: string;
  type: "multi_choice" | "assignment";
  orderIndex: number;
  options?: string[];
  description?: string;
}

interface Assignment {
  _id: string;
  name: string;
  description: string;
  ratio: number;
  duration: number;
  deadline: string;
  questions: Array<{
    _id?: string;
    title: string;
    type: "multi_choice" | "assignment";
    orderIndex: number;
    options?: string[];
    description?: string;
  }>;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

interface AssignmentFormData {
  name: string;
  description: string;
  ratio: number;
  duration: number;
  deadline: string;
  questions: Question[];
}

const initialFormData: AssignmentFormData = {
  name: "",
  description: "",
  ratio: 10,
  duration: 60,
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16),
  questions: [],
};

export function AssignmentCreateModal({
  isOpen,
  onClose,
  onSubmit,
  editData,
  isEdit = false,
}: AssignmentCreateModalProps) {
  const [formData, setFormData] = useState<AssignmentFormData>(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "questions">("info");

  // Populate form data when editing
  useEffect(() => {
    if (isEdit && editData) {
      console.log("🔍 Populating assignment form with edit data:", editData);
      setFormData({
        name: editData.name || "",
        description: editData.description || "",
        ratio: editData.ratio || 10,
        duration: editData.duration || 60,
        deadline: editData.deadline
          ? new Date(editData.deadline).toISOString().slice(0, 16)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 16),
        questions:
          editData.questions?.map((q, qIndex) => ({
            clientId: Date.now() + qIndex,
            title: q.title || "",
            type: q.type || "multi_choice",
            orderIndex: q.orderIndex || qIndex + 1,
            options:
              q.type === "multi_choice" && q.options
                ? q.options
                : q.type === "multi_choice"
                  ? ["", "", "", ""]
                  : undefined,
            description: q.description || "",
          })) || [],
      });
    } else {
      setFormData(initialFormData);
    }
  }, [isEdit, editData]);

  const handleInputChange = (
    field: keyof AssignmentFormData,
    value: string | number | Question[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addQuestion = (type: Question["type"]) => {
    const newQuestion: Question = {
      clientId: Date.now(),
      title: "",
      type,
      orderIndex: formData.questions.length + 1,
      options: type === "multi_choice" ? ["", "", "", ""] : undefined,
      description: "",
    };
    handleInputChange("questions", [...formData.questions, newQuestion]);
    setActiveTab("questions");
  };

  const updateQuestion = (
    questionClientId: number,
    field: keyof Question,
    value: string | number | string[]
  ) => {
    const updatedQuestions = formData.questions.map((q) => {
      if (q.clientId === questionClientId) {
        const updated = { ...q, [field]: value };

        // Auto-add options when changing to multi_choice
        if (field === "type" && value === "multi_choice" && !updated.options) {
          updated.options = ["", "", "", ""];
        }
        if (field === "type" && value === "assignment" && updated.options) {
          delete updated.options;
        }

        return updated;
      }
      return q;
    });
    handleInputChange("questions", updatedQuestions);
  };

  const deleteQuestion = (questionClientId: number) => {
    const updatedQuestions = formData.questions
      .filter((q) => q.clientId !== questionClientId)
      .map((q, index) => ({ ...q, orderIndex: index + 1 }));
    handleInputChange("questions", updatedQuestions);
  };

  const moveQuestion = (
    questionClientId: number,
    direction: "up" | "down"
  ) => {
    const currentIndex = formData.questions.findIndex(
      (q) => q.clientId === questionClientId
    );
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === formData.questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...formData.questions];
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    [newQuestions[currentIndex], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[currentIndex],
    ];

    // Update order numbers
    newQuestions.forEach((q, index) => {
      q.orderIndex = index + 1;
    });

    handleInputChange("questions", newQuestions);
  };

  const updateQuestionOption = (
    questionClientId: number,
    optionIndex: number,
    value: string
  ) => {
    const question = formData.questions.find((q) => q.clientId === questionClientId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionClientId, "options", newOptions);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên bài tập là bắt buộc";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Mô tả bài tập là bắt buộc";
    }
    if (formData.ratio <= 0 || formData.ratio > 100) {
      newErrors.ratio = "Tỷ trọng phải từ 1-100%";
    }
    if (formData.duration <= 0) {
      newErrors.duration = "Thời gian phải lớn hơn 0";
    }
    if (formData.questions.length === 0) {
      newErrors.questions = "Phải có ít nhất 1 câu hỏi";
    }

    formData.questions.forEach((question) => {
      if (!question.title.trim()) {
        newErrors[`question_${question.clientId}_title`] =
          "Tiêu đề câu hỏi là bắt buộc";
      }
      if (question.type === "multi_choice") {
        if (!question.options || question.options.some((opt) => !opt.trim())) {
          newErrors[`question_${question.clientId}_options`] =
            "Tất cả tùy chọn phải được điền";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const normalized: AssignmentFormData = {
          ...formData,
          questions: formData.questions.map((q, idx) => ({
            ...q,
            orderIndex: idx + 1,
            options: q.type === "multi_choice" ? q.options : undefined,
          })),
        };
        console.log("🔍 Assignment data being submitted:", normalized);
        await onSubmit(normalized);
        setFormData(initialFormData);
        setErrors({});
        setActiveTab("info");
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
    setActiveTab("info");
    onClose();
  };

  const questionTypes = [
    {
      value: "multi_choice",
      label: "Trắc nghiệm",
      icon: CheckCircle,
      color: "from-green-500 to-emerald-500",
      description: "Câu hỏi nhiều lựa chọn",
    },
    {
      value: "assignment",
      label: "Tự luận",
      icon: FileText,
      color: "from-purple-500 to-indigo-500",
      description: "Câu hỏi yêu cầu viết đoạn văn",
    },
  ];

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-[90vw] h-[90vh] max-w-none bg-white rounded-2xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-green-600 to-blue-600 px-8 py-6 text-white flex-shrink-0">
            <div className="absolute inset-0 bg-black/10 "></div>
            <div className="relative flex items-center justify-between">
              <div>
                <Dialog.Title className="text-2xl font-bold">
                  {isEdit ? "✏️ Chỉnh sửa bài tập" : "📝 Tạo bài tập mới"}
                </Dialog.Title>
                <p className="text-green-100 mt-1">
                  {isEdit
                    ? "Cập nhật nội dung bài tập"
                    : "Tạo bài tập đánh giá cho session"}
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

          {/* Progress Indicator */}
          <div className="bg-gray-50 px-8 py-4 border-b flex-shrink-0">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "info"
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-current">
                  <span className="text-xs font-bold">1</span>
                </div>
                <span>Thông tin cơ bản</span>
              </button>
              <div className="flex-1 h-px bg-gray-300"></div>
              <button
                onClick={() => setActiveTab("questions")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "questions"
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-current">
                  <span className="text-xs font-bold">2</span>
                </div>
                <span>Câu hỏi ({formData.questions.length})</span>
              </button>
            </div>
          </div>

          {/* Content - Scrollable Area */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-8">
              {/* Basic Information Tab */}
              {activeTab === "info" && (
                <div className="space-y-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Thông tin bài tập
                    </h3>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Assignment Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Tên bài tập *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors ${
                            errors.name
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 focus:border-blue-500"
                          }`}
                          placeholder="Ví dụ: Bài kiểm tra giữa kỳ"
                          disabled={isSubmitting}
                        />
                        {errors.name && (
                          <div className="flex items-center mt-2 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.name}
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Mô tả bài tập *
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
                          placeholder="Mô tả chi tiết nội dung và yêu cầu của bài tập..."
                          disabled={isSubmitting}
                        />
                        {errors.description && (
                          <div className="flex items-center mt-2 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Ratio */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Tỷ trọng điểm (%) *
                        </label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.ratio}
                            onChange={(e) =>
                              handleInputChange(
                                "ratio",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors ${
                              errors.ratio
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-200 focus:border-blue-500"
                            }`}
                            placeholder="10"
                            disabled={isSubmitting}
                          />
                        </div>
                        {errors.ratio && (
                          <div className="flex items-center mt-2 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.ratio}
                          </div>
                        )}
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Thời gian làm bài (phút) *
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
                            placeholder="60"
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

                      {/* Deadline */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Hạn nộp bài *
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="datetime-local"
                            value={formData.deadline}
                            onChange={(e) =>
                              handleInputChange("deadline", e.target.value)
                            }
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors ${
                              errors.deadline
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-200 focus:border-blue-500"
                            }`}
                            disabled={isSubmitting}
                          />
                        </div>
                        {errors.deadline && (
                          <div className="flex items-center mt-2 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.deadline}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">
                        Tóm tắt bài tập
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formData.questions.length}
                        </div>
                        <div className="text-sm text-gray-600">Câu hỏi</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {formData.ratio}%
                        </div>
                        <div className="text-sm text-gray-600">Tỷ trọng</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {formData.duration}
                        </div>
                        <div className="text-sm text-gray-600">Phút</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-amber-600">
                          {
                            formData.questions.filter(
                              (q) => q.type === "multi_choice"
                            ).length
                          }
                        </div>
                        <div className="text-sm text-gray-600">Trắc nghiệm</div>
                      </div>
                    </div>
                  </div>

                  {/* Next Step */}
                  <div className="flex justify-between items-center pt-6 border-t">
                    <div className="text-sm text-gray-500">
                      Bước 1/2: Thông tin cơ bản
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("questions")}
                      className="btn btn-primary"
                    >
                      Tiếp theo: Tạo câu hỏi
                    </button>
                  </div>
                </div>
              )}

              {/* Questions Tab */}
              {activeTab === "questions" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <HelpCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Câu hỏi bài tập
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addQuestion("multi_choice")}
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        <Plus className="h-5 w-5" />
                        Trắc nghiệm
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuestion("assignment")}
                        className="btn btn-secondary"
                        disabled={isSubmitting}
                      >
                        <Plus className="h-5 w-5" />
                        Tự luận
                      </button>
                    </div>
                  </div>

                  {errors.questions && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-red-800">{errors.questions}</span>
                      </div>
                    </div>
                  )}

                  {/* Questions List - Scrollable if many questions */}
                  {formData.questions.length > 0 ? (
                    <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                      {formData.questions.map((question, index) => (
                        <div
                          key={question.clientId}
                          className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 transition-colors"
                        >
                          {/* Question Header */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                              <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold rounded-xl p-3 min-w-[50px] text-center">
                                {question.orderIndex || index + 1}
                              </div>
                              <div className="flex space-x-2">
                                {questionTypes.map((type) => {
                                  const Icon = type.icon;
                                  const isSelected =
                                    question.type === type.value;
                                  return (
                                    <button
                                      key={type.value}
                                      type="button"
                                      onClick={() =>
                                        updateQuestion(
                                          question.clientId,
                                          "type",
                                          type.value
                                        )
                                      }
                                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                                        isSelected
                                          ? "border-blue-500 bg-blue-50 text-blue-700"
                                          : "border-gray-200 hover:border-gray-300"
                                      }`}
                                      disabled={isSubmitting}
                                    >
                                      <Icon className="h-4 w-4" />
                                      <span className="text-sm font-medium">
                                        {type.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  moveQuestion(question.clientId, "up")
                                }
                                disabled={index === 0 || isSubmitting}
                                className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  moveQuestion(question.clientId, "down")
                                }
                                disabled={
                                  index === formData.questions.length - 1 ||
                                  isSubmitting
                                }
                                className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteQuestion(question.clientId)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Question Title */}
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Câu hỏi *
                            </label>
                            <input
                              type="text"
                              value={question.title}
                              onChange={(e) =>
                                updateQuestion(
                                  question.clientId,
                                  "title",
                                  e.target.value
                                )
                              }
                              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors ${
                                errors[`question_${question.clientId}_title`]
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-200 focus:border-blue-500"
                              }`}
                              placeholder="Nhập nội dung câu hỏi..."
                              disabled={isSubmitting}
                            />
                            {errors[`question_${question.clientId}_title`] && (
                              <div className="flex items-center mt-2 text-red-600 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {errors[`question_${question.clientId}_title`]}
                              </div>
                            )}
                          </div>

                          {/* Question Content */}
                          {question.type === "multi_choice" && (
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Tùy chọn trả lời *
                              </label>
                              <div className="space-y-3">
                                {question.options?.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className="flex items-center space-x-3"
                                  >
                                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 font-bold rounded-full">
                                      {String.fromCharCode(65 + optIndex)}
                                    </div>
                                    <input
                                      type="text"
                                      value={option}
                                      onChange={(e) =>
                                        updateQuestionOption(
                                          question.clientId,
                                          optIndex,
                                          e.target.value
                                        )
                                      }
                                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                      placeholder={`Tùy chọn ${String.fromCharCode(65 + optIndex)}`}
                                      disabled={isSubmitting}
                                    />
                                  </div>
                                ))}
                              </div>
                              {errors[`question_${question.clientId}_options`] && (
                                <div className="flex items-center mt-2 text-red-600 text-sm">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  {errors[`question_${question.clientId}_options`]}
                                </div>
                              )}
                            </div>
                          )}

                          {question.type === "assignment" && (
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Hướng dẫn trả lời (tùy chọn)
                              </label>
                              <textarea
                                value={question.description || ""}
                                onChange={(e) =>
                                  updateQuestion(
                                    question.clientId,
                                    "description",
                                    e.target.value
                                  )
                                }
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                                placeholder="Hướng dẫn học viên cách trả lời câu hỏi này..."
                                disabled={isSubmitting}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <div className="bg-green-100 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <HelpCircle className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        Thêm câu hỏi đầu tiên!
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Tạo câu hỏi để đánh giá kiến thức học viên. Bạn có thể
                        tạo câu hỏi trắc nghiệm hoặc tự luận.
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => addQuestion("multi_choice")}
                          className="btn btn-primary text-lg px-8"
                          disabled={isSubmitting}
                        >
                          <Plus className="h-5 w-5" />
                          Trắc nghiệm
                        </button>
                        <button
                          type="button"
                          onClick={() => addQuestion("assignment")}
                          className="btn btn-secondary text-lg px-8"
                          disabled={isSubmitting}
                        >
                          <Plus className="h-5 w-5" />
                          Tự luận
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setActiveTab("info")}
                      className="btn btn-ghost"
                    >
                      ← Quay lại thông tin
                    </button>
                    <div className="text-sm text-gray-500">
                      Bước 2/2: Câu hỏi ({formData.questions.length})
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-8 py-6 flex items-center justify-between flex-shrink-0">
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
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>{isEdit ? "Cập nhật bài tập" : "Tạo bài tập"}</span>
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
