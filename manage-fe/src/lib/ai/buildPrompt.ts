import type { AiLessonPlanForm } from "./lessonPlanTypes";

const COLUMN_LABELS = [
  "Hoạt động",
  "Mục tiêu",
  "Đồ dùng dạy học",
  "Nội dung",
  "Cách tiến hành",
  "Phương pháp/KTDH",
  "Sản phẩm/Đánh giá",
] as const;

function formatGrade(grade: number) {
  return `lớp ${grade}`;
}

function formatRegulatoryRefs(refs: string[]) {
  return refs.map((s) => s.trim()).filter(Boolean).join(", ");
}

function formatTeacherLevel(grade: number) {
  if (grade <= 5) return "giáo viên tiểu học";
  if (grade <= 9) return "giáo viên THCS";
  return "giáo viên THPT";
}

export function buildVietnameseLessonPlanPrompt(input: AiLessonPlanForm) {
  const { lessonMetadata, regulatoryCompliance, pedagogicalRequirements } =
    input;

  const curriculum =
    lessonMetadata.curriculum === "Khác"
      ? lessonMetadata.curriculumOther?.trim() || "Khác"
      : lessonMetadata.curriculum;

  const base = [
    `Bạn là ${formatTeacherLevel(lessonMetadata.grade)} dạy ${formatGrade(
      lessonMetadata.grade
    )} giỏi hãy giúp tôi soạn kế hoạch bài dạy thành bảng chi tiết 7 cột`,
    `(${COLUMN_LABELS.join(" – ")})`,
    `môn ${lessonMetadata.subject} ${formatGrade(lessonMetadata.grade)} ${curriculum} bài ${lessonMetadata.lessonTopic} theo ${formatRegulatoryRefs(
      regulatoryCompliance.references
    )}...`,
    `Trong thời gian ${lessonMetadata.durationMinutes} phút một tiết`,
  ].join("\n");

  const pedagogical = [
    `Yêu cầu sư phạm bắt buộc (không được bỏ sót):`,
    pedagogicalRequirements.qualities.length > 0
      ? `- Phẩm chất hình thành: ${pedagogicalRequirements.qualities.join(", ")}.`
      : `- Phẩm chất hình thành: (giáo viên không yêu cầu/không áp dụng).`,
    `- Năng lực hình thành: ${pedagogicalRequirements.competencies.join(", ")}.`,
    `- Mức độ yêu cầu theo quy định: ${pedagogicalRequirements.requiredAchievementLevel}.`,
    pedagogicalRequirements.interdisciplinary.enabled
      ? `- Tích hợp liên môn: Có. ${(
          pedagogicalRequirements.interdisciplinary.description || ""
        ).trim()}`
      : `- Tích hợp liên môn: Không.`,
  ].join("\n");

  const outputConstraints = [
    `Ràng buộc đầu ra (bắt buộc):`,
    `- Chỉ xuất ra JSON hợp lệ (không kèm giải thích).`,
    `- JSON phải tuân thủ đúng schema lesson plan của hệ thống (7 cột theo từng hoạt động).`,
    `- Có đúng ${input.outputConstraints.numberOfActivities} hoạt động, đánh số thứ tự rõ ràng và phân bổ thời gian theo phút.`,
    `- Mỗi hoạt động phải có mục tiêu, phương pháp/KTDH, và sản phẩm/đánh giá tương ứng.`,
    `- Nội dung trong các trường văn bản (mainContent, step.description, assessment.description, objective, ...) phải viết theo Markdown (GFM) để hiển thị richtext: dùng heading (###), danh sách (-, 1.), in đậm **...**, bảng nếu cần. Vẫn là chuỗi trong JSON và dùng \\n để xuống dòng.`,
    pedagogicalRequirements.mathNotation.enabled
      ? `- Công thức/biểu thức (Toán/Hóa/Lý) phải ghi theo LaTeX và PHẢI bọc bằng ký hiệu toán để render được: dùng $...$ cho inline và $$...$$ cho block (giữ nguyên $$). Ví dụ: "Giải $x^2-5x+6=0$", "Tính $\\frac{ax+b}{cx+d}$", "Phương trình:\\n$$x^2-5x+6=0$$".`
      : `- Công thức/biểu thức: ghi dạng văn bản thường.`,
  ].join("\n");

  return [base, "", pedagogical, "", outputConstraints].join("\n");
}


