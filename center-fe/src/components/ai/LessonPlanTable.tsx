"use client";

import { ChevronDown, ChevronUp, Save, Download } from "lucide-react";
import { useMemo, useState } from "react";
import type { AiGeneratedLessonPlan } from "@/lib/ai/lessonPlanTypes";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function LessonPlanTable({
  plan,
  onChange,
  onSave,
  saving = false,
}: {
  plan: AiGeneratedLessonPlan;
  onChange: (next: AiGeneratedLessonPlan) => void;
  onSave?: () => void;
  saving?: boolean;
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  type Activity = AiGeneratedLessonPlan["activities"][number];
  type AchievementLevel = "Nhận biết" | "Hiểu" | "Vận dụng" | "Vận dụng cao";

  const columns = useMemo(
    () => [
      "Hoạt động",
      "Mục tiêu",
      "Đồ dùng dạy học",
      "Nội dung",
      "Cách tiến hành",
      "Phương pháp/KTDH",
      "Sản phẩm/Đánh giá",
    ],
    []
  );

  const toggle = (idx: number) => {
    setOpen((p) => ({ ...p, [idx]: !p[idx] }));
  };

  const updateActivity = (idx: number, patch: Partial<Activity>) => {
    const next = structuredClone(plan) as AiGeneratedLessonPlan;
    next.activities[idx] = { ...next.activities[idx], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bảng kế hoạch bài dạy (7 cột)
          </h2>
          <p className="text-gray-600">
            Đây là bản nháp do AI tạo. Bạn có thể chỉnh sửa trước khi sử dụng.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => downloadJson("ai-lesson-plan.json", plan)}
          >
            <Download className="h-4 w-4" />
            Export JSON
          </button>
          {onSave && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto border rounded-2xl bg-white shadow-sm">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  className="text-left font-semibold text-gray-700 p-3 border-b"
                >
                  {c}
                </th>
              ))}
              <th className="text-left font-semibold text-gray-700 p-3 border-b">
                Mức độ
              </th>
              <th className="text-left font-semibold text-gray-700 p-3 border-b">
                Chi tiết
              </th>
            </tr>
          </thead>
          <tbody>
            {plan.activities
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((a, idx) => {
                const isOpen = !!open[idx];
                const objectivesText = a.learningObjectives
                  .map((o) => `- (${o.level}) ${o.objective}`)
                  .join("\n");
                const materialsText = a.teachingMaterials
                  .map((m) => `- ${m.name}${m.type ? ` (${m.type})` : ""}`)
                  .join("\n");
                const processText = a.procedure.steps
                  .map((s) => `${s.stepNumber}) ${s.description}`)
                  .join("\n");
                const methodsText = a.teachingMethods
                  .map((m) => `- ${m.method}: ${m.technique}`)
                  .join("\n");
                const assessmentText = a.assessmentProducts
                  .map((p) => `- ${p.productType}: ${p.description}`)
                  .join("\n");

                return (
                  <>
                    <tr key={a.order} className="align-top">
                      <td className="p-3 border-b whitespace-pre-wrap">
                        <div className="font-semibold text-gray-900">
                          {a.order}. {a.activityName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {a.duration} phút
                        </div>
                      </td>
                      <td className="p-3 border-b whitespace-pre-wrap text-gray-800">
                        {objectivesText}
                      </td>
                      <td className="p-3 border-b whitespace-pre-wrap text-gray-800">
                        {materialsText}
                      </td>
                      <td className="p-3 border-b whitespace-pre-wrap text-gray-800">
                        {a.content.mainContent}
                      </td>
                      <td className="p-3 border-b whitespace-pre-wrap text-gray-800">
                        {processText}
                      </td>
                      <td className="p-3 border-b whitespace-pre-wrap text-gray-800">
                        {methodsText}
                      </td>
                      <td className="p-3 border-b whitespace-pre-wrap text-gray-800">
                        {assessmentText}
                      </td>
                      <td className="p-3 border-b">
                        <span className="badge badge-primary">
                          {a.learningObjectives?.[0]?.level || "Hiểu"}
                        </span>
                      </td>
                      <td className="p-3 border-b">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => toggle(idx)}
                        >
                          {isOpen ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Thu gọn
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              Mở
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-gray-50/40">
                        <td colSpan={9} className="p-4 border-b">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <label className="block text-sm font-semibold text-gray-700">
                                Tên hoạt động
                              </label>
                              <input
                                className="input"
                                value={a.activityName}
                                onChange={(e) =>
                                  updateActivity(idx, {
                                    activityName: e.target.value,
                                  })
                                }
                              />
                              <label className="block text-sm font-semibold text-gray-700">
                                Thời lượng (phút)
                              </label>
                              <input
                                className="input"
                                type="number"
                                min={1}
                                max={35}
                                value={a.duration}
                                onChange={(e) =>
                                  updateActivity(idx, {
                                    duration: parseInt(e.target.value) || 1,
                                  })
                                }
                              />
                              <label className="block text-sm font-semibold text-gray-700">
                                Nội dung (mainContent)
                              </label>
                              <textarea
                                className="input min-h-[120px]"
                                value={a.content.mainContent}
                                onChange={(e) =>
                                  updateActivity(idx, {
                                    content: {
                                      ...a.content,
                                      mainContent: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>

                            <div className="space-y-3">
                              <label className="block text-sm font-semibold text-gray-700">
                                Mục tiêu (mỗi dòng 1 mục tiêu, giữ nguyên tiền tố
                                “- (Mức độ)” nếu có)
                              </label>
                              <textarea
                                className="input min-h-[120px] font-mono text-xs"
                                value={objectivesText}
                                onChange={(e) => {
                                  const lines = e.target.value
                                    .split("\n")
                                    .map((l) => l.trim())
                                    .filter(Boolean);
                                  const nextObjectives = lines.map((l, i) => {
                                    const m = l.match(
                                      /^-?\s*\((Nhận biết|Hiểu|Vận dụng|Vận dụng cao)\)\s*(.+)$/
                                    );
                                    if (m) {
                                      return {
                                        objective: m[2].trim(),
                                        level: m[1] as AchievementLevel,
                                      };
                                    }
                                    // fallback: keep previous level if exists
                                    return {
                                      objective: l.replace(/^-?\s*/, "").trim(),
                                      level:
                                        a.learningObjectives[i]?.level ||
                                        ("Hiểu" as AchievementLevel),
                                    };
                                  });
                                  updateActivity(idx, {
                                    learningObjectives: nextObjectives,
                                  });
                                }}
                              />

                              <label className="block text-sm font-semibold text-gray-700">
                                Cách tiến hành (mỗi dòng 1 bước “n) ...”)
                              </label>
                              <textarea
                                className="input min-h-[120px] font-mono text-xs"
                                value={processText}
                                onChange={(e) => {
                                  const lines = e.target.value
                                    .split("\n")
                                    .map((l) => l.trim())
                                    .filter(Boolean);
                                  const nextSteps = lines.map((l, i) => {
                                    const m = l.match(/^(\d+)\)\s*(.+)$/);
                                    const stepNumber = m
                                      ? parseInt(m[1])
                                      : i + 1;
                                    const description = m ? m[2] : l;
                                    return { stepNumber, description };
                                  });
                                  updateActivity(idx, {
                                    procedure: { ...a.procedure, steps: nextSteps },
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


