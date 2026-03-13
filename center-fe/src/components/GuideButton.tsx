"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

interface GuideStep {
  title: string;
  content: string;
  tips?: string[];
}

interface GuideButtonProps {
  pageType: "courses" | "course-detail" | "session-detail" | "dashboard";
}

const guideContent: Record<string, GuideStep[]> = {
  courses: [
    {
      title: "Quản lý khóa học",
      content:
        "Đây là trang tổng quan tất cả khóa học của bạn. Bạn có thể xem, tạo mới và quản lý khóa học tại đây.",
      tips: [
        "Nhấn 'Tạo khóa học mới' để bắt đầu tạo khóa học",
        "Sử dụng thanh tìm kiếm để tìm khóa học nhanh chóng",
        "Nhấn vào khóa học để xem chi tiết và chỉnh sửa",
      ],
    },
    {
      title: "Tạo khóa học mới",
      content:
        "Để tạo khóa học mới, hãy điền đầy đủ thông tin bao gồm tên, mô tả, giá cả và cấp độ.",
      tips: [
        "Tên khóa học nên rõ ràng và hấp dẫn",
        "Mô tả chi tiết sẽ giúp học viên hiểu rõ nội dung",
        "Thiết lập giá hợp lý cho đối tượng mục tiêu",
      ],
    },
  ],
  "course-detail": [
    {
      title: "Chi tiết khóa học",
      content:
        "Trang này cho phép bạn quản lý toàn bộ nội dung khóa học, từ thông tin cơ bản đến sessions và settings.",
      tips: [
        "Tab 'Tổng quan': Xem thống kê và thông tin tổng quan",
        "Tab 'Sessions': Quản lý các phần học của khóa học",
        "Tab 'Cài đặt': Chỉnh sửa thông tin khóa học",
      ],
    },
    {
      title: "Quản lý Sessions",
      content:
        "Sessions là các phần học chính trong khóa học. Mỗi session chứa nhiều bài học và có thể có bài tập đánh giá.",
      tips: [
        "Nhấn 'Tạo Session mới' để thêm phần học",
        "Sắp xếp sessions theo thứ tự logic học tập",
        "Mỗi session nên có 3-7 bài học",
      ],
    },
    {
      title: "Cài đặt khóa học",
      content:
        "Trong tab Cài đặt, bạn có thể chỉnh sửa tất cả thông tin khóa học và xóa khóa học nếu cần.",
      tips: [
        "Thay đổi sẽ được lưu tự động khi nhấn 'Lưu thay đổi'",
        "Vùng nguy hiểm cho phép xóa khóa học (cẩn thận!)",
        "Kiểm tra kỹ trước khi lưu thay đổi",
      ],
    },
  ],
  "session-detail": [
    {
      title: "Chi tiết Session",
      content:
        "Quản lý nội dung chi tiết của session bao gồm bài học, bài tập và cài đặt session.",
      tips: [
        "Tab 'Bài học': Tạo và sắp xếp các bài học",
        "Tab 'Bài tập': Tạo bài tập đánh giá cho session",
        "Tab 'Cài đặt': Chỉnh sửa thông tin session",
      ],
    },
    {
      title: "Quản lý bài học",
      content:
        "Tạo các bài học với nhiều định dạng: video, tài liệu, hoặc học trực tuyến.",
      tips: [
        "Video: Upload hoặc nhúng link YouTube/Vimeo",
        "Tài liệu: PDF, Word, PowerPoint",
        "Trực tuyến: Liên kết đến trang web bên ngoài",
      ],
    },
    {
      title: "Tạo bài tập",
      content:
        "Bài tập đánh giá giúp kiểm tra kiến thức học viên với câu hỏi trắc nghiệm hoặc tự luận.",
      tips: [
        "Đặt thời gian làm bài phù hợp",
        "Câu hỏi trắc nghiệm: 2-4 đáp án",
        "Câu hỏi tự luận: Mô tả rõ yêu cầu",
      ],
    },
  ],
  dashboard: [
    {
      title: "Bảng điều khiển",
      content:
        "Trang chủ hiển thị tổng quan về hoạt động giảng dạy và thống kê quan trọng.",
      tips: [
        "Xem số liệu thống kê tổng quan",
        "Theo dõi khóa học phổ biến nhất",
        "Kiểm tra hoạt động gần đây",
      ],
    },
  ],
};

export default function GuideButton({ pageType }: GuideButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = guideContent[pageType] || [];
  const totalSteps = steps.length;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  if (totalSteps === 0) {
    return null;
  }

  const modalStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: isOpen ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999,
    padding: "20px",
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "30px",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    position: "relative",
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          cursor: "pointer",
          zIndex: 50,
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#1d4ed8";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#2563eb";
          e.currentTarget.style.transform = "scale(1)";
        }}
        title="Hướng dẫn sử dụng"
      >
        <HelpCircle size={24} />
      </button>

      {/* Modal */}
      <div style={modalStyle} onClick={closeModal}>
        <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "8px",
                margin: 0,
              }}
            >
              🎯 {steps[currentStep]?.title}
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "14px",
                margin: 0,
              }}
            >
              Bước {currentStep + 1} / {totalSteps}
            </p>
          </div>

          {/* Content */}
          <div style={{ marginBottom: "30px" }}>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
                color: "#374151",
                marginBottom: "20px",
                margin: "0 0 20px 0",
              }}
            >
              {steps[currentStep]?.content}
            </p>

            {steps[currentStep]?.tips && (
              <div
                style={{
                  backgroundColor: "#f0f9ff",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "1px solid #e0f2fe",
                }}
              >
                <h4
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#0369a1",
                    marginBottom: "12px",
                    margin: "0 0 12px 0",
                  }}
                >
                  💡 Mẹo hữu ích:
                </h4>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    listStyleType: "disc",
                  }}
                >
                  {steps[currentStep].tips!.map((tip, index) => (
                    <li
                      key={index}
                      style={{
                        fontSize: "14px",
                        color: "#0c4a6e",
                        marginBottom: "6px",
                        lineHeight: "1.5",
                      }}
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              style={{
                padding: "10px 20px",
                backgroundColor: currentStep === 0 ? "#f3f4f6" : "#6b7280",
                color: currentStep === 0 ? "#9ca3af" : "white",
                border: "none",
                borderRadius: "8px",
                cursor: currentStep === 0 ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              ← Trước
            </button>

            <div style={{ display: "flex", gap: "8px" }}>
              {Array.from({ length: totalSteps }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor:
                      index === currentStep ? "#2563eb" : "#d1d5db",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>

            {currentStep === totalSteps - 1 ? (
              <button
                onClick={closeModal}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#059669",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Hoàn thành ✓
              </button>
            ) : (
              <button
                onClick={nextStep}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Tiếp →
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={closeModal}
            style={{
              position: "absolute",
              top: "15px",
              right: "15px",
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6b7280",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>
    </>
  );
}
