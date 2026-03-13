"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, FolderOpen, Maximize2, X } from "lucide-react";
import Link from "next/link";
import {
  aiLessonPlanFormSchema,
  type AiLessonPlanForm,
  type AiGeneratedLessonPlan,
} from "@/lib/ai/lessonPlanTypes";
import { ArrayField } from "@/components/ai/ArrayField";
import { LessonPlanTable } from "@/components/ai/LessonPlanTable";
import {
  createAiLessonPlanDraft,
  getAuthMe,
  updateAiLessonPlanDraft,
} from "@/lib/api";

type AiApiResponse =
  | {
      status: "success";
      prompt: string;
      data: AiGeneratedLessonPlan;
      debug?: unknown;
    }
  | {
      status: "error";
      message: string;
      details?: unknown;
      issues?: unknown;
      data?: unknown;
      rawText?: unknown;
      debug?: unknown;
    };

export default function AiLessonPlanPage() {
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorMeta, setErrorMeta] = useState<{
    issues?: unknown;
    data?: unknown;
    rawText?: unknown;
    details?: unknown;
  } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [promptPreview, setPromptPreview] = useState<string>("");
  const [plan, setPlan] = useState<AiGeneratedLessonPlan | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

  const defaultValues: AiLessonPlanForm = useMemo(
    () => ({
      lessonMetadata: {
        subject: "Toán",
        grade: 3,
        curriculum: "Chân trời sáng tạo",
        curriculumOther: "",
        lessonTopic: "Tìm số hạng",
        durationMinutes: 35,
      },
      regulatoryCompliance: {
        references: [
          "Công văn 4567/BGDĐT-GDTH",
          "Thông tư 32/2018/TT-BGDĐT",
          "Thông tư 27/2020/TT-BGDĐT",
          "Thông tư 17/2021/TT-BGDĐT",
        ],
      },
      pedagogicalRequirements: {
        qualities: [],
        competencies: [
          "Năng lực toán học (tư duy và lập luận; giải quyết vấn đề)",
          "Giao tiếp và hợp tác",
          "Tự chủ và tự học",
        ],
        requiredAchievementLevel: "Hiểu",
        interdisciplinary: {
          enabled: true,
          description: "Tiếng Việt: đọc hiểu đề, trình bày câu trả lời.",
        },
        mathNotation: { enabled: true, format: "LaTeX" },
      },
      outputConstraints: {
        numberOfActivities: 5,
        requireSevenColumnTable: true,
        columns: [
          "Hoạt động",
          "Mục tiêu",
          "Đồ dùng dạy học",
          "Nội dung",
          "Cách tiến hành",
          "Phương pháp/KTDH",
          "Sản phẩm/Đánh giá",
        ],
      },
    }),
    []
  );

  const form = useForm<AiLessonPlanForm>({
    resolver: zodResolver(aiLessonPlanFormSchema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    const load = async () => {
      setAuthLoading(true);
      setError("");
      const me = await getAuthMe();
      if (me.success) {
        setAuthRole(me.data?.role || null);
      } else {
        setAuthRole(null);
      }
      setAuthLoading(false);
    };
    load();
  }, []);

  const canUseAi =
    authRole === "teacher" || authRole === "manager" || authRole === "admin";

  // Modal UX: ESC to close + lock body scroll
  useEffect(() => {
    if (!isPlanModalOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPlanModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isPlanModalOpen]);

  const addRegRef = (ref: string) => {
    const cur = form.getValues("regulatoryCompliance.references") || [];
    const s = ref.trim();
    if (!s) return;
    if (cur.includes(s)) return;
    form.setValue("regulatoryCompliance.references", [...cur, s], {
      shouldValidate: true,
    });
  };

  const onGenerate = async (values: AiLessonPlanForm) => {
    setError("");
    setErrorMeta(null);
    setIsGenerating(true);
    setPromptPreview("");
    setPlan(null);
    setDraftId(null);

    try {
      const res = await fetch("/api/ai/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as AiApiResponse;
      if (!res.ok || json.status === "error") {
        setError(
          json.status === "error"
            ? json.message || "Không thể tạo kế hoạch bằng AI."
            : "Không thể tạo kế hoạch bằng AI."
        );
        if (json.status === "error") {
          setErrorMeta({
            issues: json.issues,
            data: json.data,
            rawText: json.rawText,
            details: json.details,
          });
        }
        setIsGenerating(false);
        return;
      }

      setPromptPreview(json.prompt);
      setPlan(json.data);
      // Focus on the generated plan: collapse the long form after success.
      setIsFormCollapsed(true);
    } catch (e: unknown) {
      setError(
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: unknown }).message)
          : "Lỗi kết nối khi gọi AI."
      );
      setErrorMeta(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const onSaveDraft = async () => {
    if (!plan) return;
    setIsSaving(true);
    setError("");
    try {
      if (!draftId) {
        const payload = {
          structure: plan,
          input: form.getValues(),
          prompt: promptPreview,
          model: "gpt-5.2",
        };
        const saved = await createAiLessonPlanDraft(payload);
        if (!saved.success) {
          setError(saved.error?.message || "Không thể lưu bản kế hoạch.");
          return;
        }
        setDraftId(saved.data?._id || null);
      } else {
        const updated = await updateAiLessonPlanDraft(draftId, {
          structure: plan,
        });
        if (!updated.success) {
          setError(
            updated.error?.message || "Không thể cập nhật bản kế hoạch."
          );
          return;
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="loading-spinner h-14 w-14 mx-auto mb-4"></div>
          <div className="text-gray-600">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!canUseAi) {
    return (
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          AI Lesson Plan
        </h1>
        <p className="text-gray-600">
          Bạn không có quyền truy cập tính năng này. (Yêu cầu tài khoản giáo
          viên/manager/admin)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="card-glass p-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Trợ lý AI soạn kế hoạch bài dạy (Tiểu học / THCS / THPT)
        </h1>
        <p className="text-gray-600">
          AI chỉ tạo bản nháp. Giáo viên là người chịu trách nhiệm chuyên môn và
          quyết định cuối cùng.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <div className="flex-1">
            <div>{error}</div>
            {errorMeta && (
              <details className="mt-2">
                <summary className="cursor-pointer select-none">
                  Xem chi tiết lỗi (schema/JSON)
                </summary>
                <pre className="mt-2 p-3 rounded bg-black/10 overflow-auto text-xs leading-relaxed">
                  {JSON.stringify(errorMeta, null, 2)}
                </pre>
              </details>
            )}
          </div>
          <button
            onClick={() => {
              setError("");
              setErrorMeta(null);
            }}
            className="ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Thông tin bài dạy & ràng buộc
              </h2>
              <p className="text-sm text-gray-600">
                Nhập thông tin, bấm “Tạo kế hoạch bằng AI”, rồi lưu hoặc chỉnh sửa bản nháp.
              </p>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsFormCollapsed((v) => !v)}
                title={isFormCollapsed ? "Mở form" : "Thu gọn form"}
              >
                {isFormCollapsed ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Mở form
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Thu gọn
                  </>
                )}
              </button>
              <Link className="btn btn-ghost" href="/plans">
                <FolderOpen className="h-4 w-4" />
                Kế hoạch đã lưu
              </Link>
            </div>
          </div>

          {!isFormCollapsed && (
            <form
              onSubmit={form.handleSubmit(onGenerate)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Môn</label>
                  <input
                    className="input"
                    list="ai-subject-suggestions"
                    placeholder="vd: Toán, Ngữ văn, Vật lý, Hóa học..."
                    {...form.register("lessonMetadata.subject")}
                  />
                  <datalist id="ai-subject-suggestions">
                    <option value="Toán" />
                    <option value="Ngữ văn" />
                    <option value="Tiếng Việt" />
                    <option value="Tiếng Anh" />
                    <option value="Vật lý" />
                    <option value="Hóa học" />
                    <option value="Sinh học" />
                    <option value="Lịch sử" />
                    <option value="Địa lý" />
                    <option value="Giáo dục công dân" />
                    <option value="Tin học" />
                    <option value="Công nghệ" />
                  </datalist>
                </div>
                <div>
                  <label className="label">Lớp</label>
                  <input
                    type="number"
                    className="input"
                    min={1}
                    max={12}
                    {...form.register("lessonMetadata.grade", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div>
                  <label className="label">Bộ sách / CT</label>
                  <select
                    className="input"
                    {...form.register("lessonMetadata.curriculum")}
                  >
                    <option value="Chân trời sáng tạo">
                      Chân trời sáng tạo
                    </option>
                    <option value="Kết nối tri thức">Kết nối tri thức</option>
                    <option value="Cánh diều">Cánh diều</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="label">Chủ đề / Tên bài</label>
                  <input
                    className="input"
                    {...form.register("lessonMetadata.lessonTopic")}
                  />
                </div>
                <div>
                  <label className="label">Thời lượng (phút)</label>
                  <input
                    type="number"
                    className="input"
                    min={1}
                    max={120}
                    {...form.register("lessonMetadata.durationMinutes", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div>
                  <label className="label">Số hoạt động</label>
                  <input
                    type="number"
                    className="input"
                    min={1}
                    max={15}
                    {...form.register("outputConstraints.numberOfActivities", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Căn cứ pháp lý (bắt buộc)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Công văn 4567/BGDĐT-GDTH",
                    "Thông tư 32/2018/TT-BGDĐT",
                    "Thông tư 27/2020/TT-BGDĐT",
                    "Thông tư 17/2021/TT-BGDĐT",
                    "Công văn 5512/BGDĐT-GDTrH",
                    "Thông tư 22/2021/TT-BGDĐT",
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => addRegRef(s)}
                    >
                      + {s}
                    </button>
                  ))}
                </div>

                <ArrayField
                  label="Danh sách căn cứ pháp lý (tự nhập)"
                  values={form.watch("regulatoryCompliance.references")}
                  onChange={(next) =>
                    form.setValue("regulatoryCompliance.references", next, {
                      shouldValidate: true,
                    })
                  }
                  placeholder="vd: Thông tư 22/2021/TT-BGDĐT"
                />
                {form.formState.errors.regulatoryCompliance?.references && (
                  <p className="text-sm text-red-600">
                    Vui lòng chọn ít nhất 1 căn cứ pháp lý.
                  </p>
                )}
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Yêu cầu sư phạm
                </h3>

                <div>
                  <label className="label">
                    Mức độ yêu cầu (theo quy định)
                  </label>
                  <select
                    className="input"
                    {...form.register(
                      "pedagogicalRequirements.requiredAchievementLevel"
                    )}
                  >
                    <option value="Nhận biết">Nhận biết</option>
                    <option value="Hiểu">Hiểu</option>
                    <option value="Vận dụng">Vận dụng</option>
                    <option value="Vận dụng cao">Vận dụng cao</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border bg-white">
                  <input
                    type="checkbox"
                    checked={form.watch(
                      "pedagogicalRequirements.mathNotation.enabled"
                    )}
                    onChange={(e) =>
                      form.setValue(
                        "pedagogicalRequirements.mathNotation",
                        { enabled: e.target.checked, format: "LaTeX" },
                        { shouldValidate: true }
                      )
                    }
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">
                      Ghi công thức theo LaTeX (khuyến nghị cho Toán/Lý/Hóa)
                    </div>
                    <div className="text-xs text-gray-600">
                      AI sẽ ghi công thức dưới dạng LaTeX trong chuỗi JSON
                      (không markdown) để tránh mất định dạng.
                    </div>
                  </div>
                </div>

                <ArrayField
                  label="Phẩm chất (giáo viên tự nhập)"
                  values={form.watch("pedagogicalRequirements.qualities")}
                  onChange={(next) =>
                    form.setValue("pedagogicalRequirements.qualities", next, {
                      shouldValidate: true,
                    })
                  }
                  placeholder="Ví dụ: Chăm chỉ; Trách nhiệm; Trung thực (nếu phù hợp bài dạy)"
                />

                <ArrayField
                  label="Năng lực (danh sách)"
                  values={form.watch("pedagogicalRequirements.competencies")}
                  onChange={(next) =>
                    form.setValue(
                      "pedagogicalRequirements.competencies",
                      next,
                      {
                        shouldValidate: true,
                      }
                    )
                  }
                  placeholder="Ví dụ: Năng lực toán học (giải quyết vấn đề)"
                />

                <div className="p-4 rounded-2xl border bg-gray-50">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.watch(
                        "pedagogicalRequirements.interdisciplinary.enabled"
                      )}
                      onChange={(e) =>
                        form.setValue(
                          "pedagogicalRequirements.interdisciplinary.enabled",
                          e.target.checked,
                          { shouldValidate: true }
                        )
                      }
                    />
                    <span className="font-semibold text-gray-900">
                      Tích hợp liên môn
                    </span>
                  </label>
                  {form.watch(
                    "pedagogicalRequirements.interdisciplinary.enabled"
                  ) && (
                    <div className="mt-3">
                      <label className="label">Mô tả tích hợp</label>
                      <textarea
                        className="input min-h-[90px]"
                        {...form.register(
                          "pedagogicalRequirements.interdisciplinary.description"
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isGenerating}
                >
                  {isGenerating ? "Đang tạo với AI..." : "Tạo kế hoạch bằng AI"}
                </button>
              </div>
            </form>
          )}
        </div>

        {plan && (
          <div className="relative card-glass p-6">
            {/* Full-width viewer */}
            <button
              type="button"
              className="btn btn-ghost absolute right-0 -top-2 z-10  mt-4 mr-4"
              onClick={() => setIsPlanModalOpen(true)}
              title="Xem toàn màn hình"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            <LessonPlanTable
              plan={plan}
              onChange={(next) => setPlan(next)}
              onSave={onSaveDraft}
              saving={isSaving}
            />
          </div>
        )}

        {draftId && (
          <div className="card p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Đã lưu bản nháp
                </h3>
                <p className="text-sm text-gray-600">
                  ID: <span className="font-mono">{draftId}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Link className="btn btn-ghost" href={`/plan/${draftId}`}>
                  Mở trang chỉnh sửa
                </Link>
                <Link className="btn btn-ghost" href="/plans">
                  Xem danh sách
                </Link>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    setDraftId(null);
                    setPlan(null);
                    setPromptPreview("");
                    setIsFormCollapsed(false);
                  }}
                >
                  Tạo bản mới
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen-ish modal for comfortable viewing/editing */}
      {isPlanModalOpen && plan && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-[90vw] h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  Bảng kế hoạch bài dạy (toàn màn hình)
                </div>
                <div className="text-xs text-gray-600">
                  Bạn có thể chỉnh sửa, lưu, hoặc export ngay tại đây.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsPlanModalOpen(false)}
                title="Đóng"
              >
                <X className="h-4 w-4" />
                Đóng
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5">
              <LessonPlanTable
                plan={plan}
                onChange={(next) => setPlan(next)}
                onSave={onSaveDraft}
                saving={isSaving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
