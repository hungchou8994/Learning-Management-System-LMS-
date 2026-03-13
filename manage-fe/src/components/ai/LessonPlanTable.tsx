"use client";

import { Download, Pencil, Save, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { AiGeneratedLessonPlan } from "@/lib/ai/lessonPlanTypes";
import MarkdownViewer from "@/components/common/MarkdownViewer";

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
  type Activity = AiGeneratedLessonPlan["activities"][number];
  type AchievementLevel = "Nhận biết" | "Hiểu" | "Vận dụng" | "Vận dụng cao";

  const [isEditing, setIsEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<AiGeneratedLessonPlan | null>(null);

  const updateActivity = (idx: number, patch: Partial<Activity>) => {
    const next = structuredClone(plan) as AiGeneratedLessonPlan;
    next.activities[idx] = { ...next.activities[idx], ...patch };
    onChange(next);
  };

  const activities = useMemo(
    () => plan.activities.slice().sort((a, b) => a.order - b.order),
    [plan.activities]
  );

  const roman = (n: number) => {
    const map: Array<[number, string]> = [
      [1000, "M"],
      [900, "CM"],
      [500, "D"],
      [400, "CD"],
      [100, "C"],
      [90, "XC"],
      [50, "L"],
      [40, "XL"],
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"],
    ];
    let x = Math.max(1, Math.floor(n));
    let out = "";
    for (const [v, s] of map) {
      while (x >= v) {
        out += s;
        x -= v;
      }
    }
    return out;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Kế hoạch bài dạy (dàn ý theo hoạt động)
          </h2>
          <p className="text-gray-600">
            {isEditing
              ? "Đang ở chế độ chỉnh sửa."
              : "Đang ở chế độ xem (read-only). Bạn vẫn có thể bấm “Lưu” để lưu bản nháp hiện tại."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {!isEditing ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSnapshot(structuredClone(plan) as AiGeneratedLessonPlan);
                setIsEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              Chỉnh sửa
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (snapshot) onChange(snapshot);
                setSnapshot(null);
                setIsEditing(false);
              }}
              disabled={saving}
              title="Hủy thay đổi (khôi phục về bản trước khi chỉnh sửa)"
            >
              <XCircle className="h-4 w-4" />
              Hủy
            </button>
          )}

          {onSave && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSave}
              disabled={saving}
              title={
                isEditing
                  ? "Lưu thay đổi nội dung bạn vừa chỉnh sửa"
                  : "Lưu bản kế hoạch hiện tại (không cần vào chế độ chỉnh sửa)"
              }
            >
              <Save className="h-4 w-4" />
              {saving ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Lưu"}
            </button>
          )}

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => downloadJson("ai-lesson-plan.json", plan)}
          >
            <Download className="h-4 w-4" />
            Export JSON
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((a, idx) => {
          const objectivesText = a.learningObjectives
            .map((o) => `- (${o.level}) ${o.objective}`)
            .join("\n");
          const materialsText = a.teachingMaterials
            .map((m) => `- ${m.name}${m.type ? ` (${m.type})` : ""}`)
            .join("\n");
          const processText = a.procedure.steps
            .map((s) => `${s.stepNumber}. ${s.description}`)
            .join("\n");
          const methodsText = a.teachingMethods
            .map((m) => `- ${m.method}: ${m.technique}`)
            .join("\n");
          const assessmentText = a.assessmentProducts
            .map((p) => `- ${p.productType}: ${p.description}`)
            .join("\n");

          return (
            <div key={`${a.order}-${a.activityName}`} className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {roman(idx + 1)}. {a.activityName}
                  </div>
                  <div className="text-sm text-gray-600">
                    Thời lượng:{" "}
                    <span className="font-semibold text-gray-900">{a.duration}</span>{" "}
                    phút • Mức độ:{" "}
                    <span className="badge badge-primary">
                      {a.learningObjectives?.[0]?.level || "Hiểu"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="font-semibold text-gray-900 mb-2">- Mục tiêu:</div>
                  {isEditing ? (
                    <textarea
                      className="input min-h-[140px] font-mono text-xs leading-relaxed"
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
                          return {
                            objective: l.replace(/^-?\s*/, "").trim(),
                            level:
                              a.learningObjectives[i]?.level ||
                              ("Hiểu" as AchievementLevel),
                          };
                        });
                        updateActivity(idx, { learningObjectives: nextObjectives });
                      }}
                    />
                  ) : (
                    <MarkdownViewer markdown={objectivesText} />
                  )}
                </div>

                <div>
                  <div className="font-semibold text-gray-900 mb-2">
                    - Đồ dùng dạy học:
                  </div>
                  {isEditing ? (
                    <textarea
                      className="input min-h-[120px] font-mono text-xs leading-relaxed"
                      value={materialsText}
                      onChange={(e) => {
                        const lines = e.target.value
                          .split("\n")
                          .map((l) => l.trim())
                          .filter(Boolean);
                        const next = lines.map((l) => {
                          const name = l.replace(/^-?\s*/, "").trim();
                          return { name, type: "" };
                        });
                        updateActivity(idx, { teachingMaterials: next });
                      }}
                    />
                  ) : (
                    <MarkdownViewer markdown={materialsText} />
                  )}
                </div>

                <div>
                  <div className="font-semibold text-gray-900 mb-2">- Nội dung:</div>
                  {isEditing ? (
                    <textarea
                      className="input min-h-[140px] font-mono text-xs leading-relaxed"
                      value={a.content.mainContent}
                      onChange={(e) =>
                        updateActivity(idx, {
                          content: { ...a.content, mainContent: e.target.value },
                        })
                      }
                    />
                  ) : (
                    <MarkdownViewer markdown={a.content.mainContent} />
                  )}
                </div>

                <div>
                  <div className="font-semibold text-gray-900 mb-2">
                    - Cách tiến hành:
                  </div>
                  {isEditing ? (
                    <textarea
                      className="input min-h-[160px] font-mono text-xs leading-relaxed"
                      value={processText}
                      onChange={(e) => {
                        const lines = e.target.value
                          .split("\n")
                          .map((l) => l.trim())
                          .filter(Boolean);
                        const nextSteps = lines.map((l, i) => {
                          const m = l.match(/^(\d+)[\.\)]\s*(.+)$/);
                          const stepNumber = m ? parseInt(m[1]) : i + 1;
                          const description = m ? m[2] : l;
                          return {
                            stepNumber,
                            description,
                            timeAllocation: undefined,
                            teacherAction: undefined,
                            studentAction: undefined,
                          };
                        });
                        updateActivity(idx, {
                          procedure: { ...a.procedure, steps: nextSteps },
                        });
                      }}
                    />
                  ) : (
                    <MarkdownViewer markdown={processText} />
                  )}
                </div>

                <div>
                  <div className="font-semibold text-gray-900 mb-2">
                    - Phương pháp/KTDH:
                  </div>
                  {isEditing ? (
                    <textarea
                      className="input min-h-[120px] font-mono text-xs leading-relaxed"
                      value={methodsText}
                      onChange={(e) => {
                        const lines = e.target.value
                          .split("\n")
                          .map((l) => l.trim())
                          .filter(Boolean);
                        const next = lines.map((l) => {
                          const raw = l.replace(/^-?\s*/, "").trim();
                          const [method, ...rest] = raw.split(":");
                          const technique = rest.join(":").trim();
                          return {
                            method: (method || "").trim() || "PPDH",
                            technique: technique || "KTDH",
                          };
                        });
                        updateActivity(idx, { teachingMethods: next });
                      }}
                    />
                  ) : (
                    <MarkdownViewer markdown={methodsText} />
                  )}
                </div>

                <div>
                  <div className="font-semibold text-gray-900 mb-2">
                    - Sản phẩm/Đánh giá:
                  </div>
                  {isEditing ? (
                    <textarea
                      className="input min-h-[140px] font-mono text-xs leading-relaxed"
                      value={assessmentText}
                      onChange={(e) => {
                        const lines = e.target.value
                          .split("\n")
                          .map((l) => l.trim())
                          .filter(Boolean);
                        const next = lines.map((l) => {
                          const raw = l.replace(/^-?\s*/, "").trim();
                          const [productType, ...rest] = raw.split(":");
                          const description = rest.join(":").trim();
                          return {
                            productType:
                              (productType || "").trim() || "Sản phẩm/Đánh giá",
                            description: description || raw,
                          };
                        });
                        updateActivity(idx, { assessmentProducts: next });
                      }}
                    />
                  ) : (
                    <MarkdownViewer markdown={assessmentText} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


