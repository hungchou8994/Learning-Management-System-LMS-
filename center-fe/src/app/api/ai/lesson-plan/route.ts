import { NextResponse } from "next/server";
import { aiLessonPlanFormSchema, aiGeneratedLessonPlanSchema } from "@/lib/ai/lessonPlanTypes";
import { buildVietnameseLessonPlanPrompt } from "@/lib/ai/buildPrompt";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getTimeoutMs(envKey: string, fallbackMs: number) {
  const raw = process.env[envKey];
  if (!raw) return fallbackMs;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallbackMs;
  // Hard bounds to avoid accidental huge timeouts in dev.
  return Math.min(Math.max(Math.floor(n), 5_000), 180_000);
}

// Gemini (AI Studio) currently enforces a max schema nesting depth for responseJsonSchema.
// Our full lesson schema is deep, so we only provide a SHALLOW schema to get JSON output,
// and we still validate strictly with Zod after parsing.
const geminiShallowJsonSchema = {
  type: "object",
  additionalProperties: true,
  required: ["lesson", "activities"],
  properties: {
    lesson: { type: "object", additionalProperties: true },
    activities: { type: "array", items: { type: "object", additionalProperties: true } },
  },
} as const;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function parseFirstInt(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return Math.floor(v);
  if (typeof v !== "string") return undefined;
  const m = v.match(/\d+/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? Math.floor(n) : undefined;
}

function clampInt(n: number, min: number, max: number) {
  return Math.min(Math.max(Math.floor(n), min), max);
}

function buildRegulatoryReferences(input: {
  regulatoryCompliance: { references: Array<"4567" | "32" | "17" | "27"> };
}) {
  const mapOne = (code: "4567" | "32" | "17" | "27") => {
    if (code === "4567") {
      return { documentType: "Công văn" as const, documentCode: "4567" };
    }
    // TT32/TT17/TT27
    return { documentType: "Thông tư" as const, documentCode: code };
  };

  return {
    references: input.regulatoryCompliance.references.map(mapOne),
  };
}

/**
 * Gemini sometimes returns a simpler JSON (arrays of strings, different root keys).
 * We coerce it into our strict Zod schema shape so teachers can still proceed.
 */
function coerceGeminiJsonToPlan(
  raw: unknown,
  input: {
    lessonMetadata: {
      subject: string;
      grade: number;
      curriculum: string;
      curriculumOther?: string | undefined;
      lessonTopic: string;
      durationMinutes: number;
    };
    regulatoryCompliance: { references: Array<"4567" | "32" | "17" | "27"> };
    pedagogicalRequirements: { requiredAchievementLevel: "Nhận biết" | "Hiểu" | "Vận dụng" | "Vận dụng cao" };
  }
) {
  const root = isRecord(raw) ? raw : {};
  const lesson = (isRecord(root.lesson) ? root.lesson : undefined) ?? (isRecord(root.lessonMetadata) ? root.lessonMetadata : undefined);
  const lessonRec = isRecord(lesson) ? lesson : {};

  const subject = input.lessonMetadata.subject;
  const grade = input.lessonMetadata.grade;
  const duration = input.lessonMetadata.durationMinutes;
  const textbook = input.lessonMetadata.curriculum;

  const title =
    asString(lessonRec.title) ??
    asString(lessonRec.lessonTopic) ??
    asString(lessonRec.topic) ??
    asString(lessonRec.name) ??
    input.lessonMetadata.lessonTopic;

  const coercedLessonMetadata = {
    title,
    subject,
    grade,
    duration,
    textbook,
    textbookSeries: input.lessonMetadata.curriculum === "Khác" ? (input.lessonMetadata.curriculumOther || undefined) : undefined,
    lessonTopic: input.lessonMetadata.lessonTopic,
  };

  const rawActivities = Array.isArray(root.activities) ? root.activities : [];
  const count = rawActivities.length || 1;
  const defaultPerActivity = clampInt(Math.max(1, Math.floor(duration / count)), 1, 35);

  const activities = rawActivities.map((a, idx) => {
    const ar = isRecord(a) ? a : {};
    const activityName = asString(ar.activityName) ?? asString(ar.name) ?? `Hoạt động ${idx + 1}`;
    const order = clampInt(asNumber(ar.order) ?? idx + 1, 1, 99);
    const actDuration = clampInt(asNumber(ar.duration) ?? parseFirstInt(ar.duration) ?? defaultPerActivity, 1, 35);

    const loRaw = Array.isArray(ar.learningObjectives) ? ar.learningObjectives : [];
    const learningObjectives = loRaw
      .map((x) => {
        if (isRecord(x)) {
          const objective = asString(x.objective) ?? asString(x.description) ?? asString(x.text);
          if (!objective) return null;
          const level =
            (asString(x.level) as typeof input.pedagogicalRequirements.requiredAchievementLevel | undefined) ??
            input.pedagogicalRequirements.requiredAchievementLevel;
          return { objective, level, competencyCode: asString(x.competencyCode) ?? undefined };
        }
        const s = asString(x);
        if (!s) return null;
        return { objective: s, level: input.pedagogicalRequirements.requiredAchievementLevel };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const tmRaw = Array.isArray(ar.teachingMaterials) ? ar.teachingMaterials : [];
    const teachingMaterials = tmRaw
      .map((x) => {
        if (isRecord(x)) {
          const name = asString(x.name) ?? asString(x.title) ?? asString(x.material);
          if (!name) return null;
          const type = asString(x.type) ?? "Khác";
          return { name, type, quantity: asNumber(x.quantity) ?? undefined, notes: asString(x.notes) ?? undefined };
        }
        const s = asString(x);
        if (!s) return null;
        return { name: s, type: "Khác" };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const contentRec = isRecord(ar.content) ? ar.content : {};
    const mainContent =
      asString(contentRec.mainContent) ??
      asString(contentRec.description) ??
      asString(ar.content) ??
      `Nội dung hoạt động: ${activityName}`;

    const procedureRec = isRecord(ar.procedure) ? ar.procedure : {};
    const stepsRaw = Array.isArray(procedureRec.steps) ? procedureRec.steps : undefined;
    const steps =
      stepsRaw?.length
        ? stepsRaw
            .map((s, i) => {
              const sr = isRecord(s) ? s : {};
              const desc = asString(sr.description) ?? asString(sr.text);
              if (!desc) return null;
              return {
                stepNumber: clampInt(asNumber(sr.stepNumber) ?? i + 1, 1, 999),
                description: desc,
                timeAllocation: asNumber(sr.timeAllocation) ?? undefined,
                teacherAction: asString(sr.teacherAction) ?? undefined,
                studentAction: asString(sr.studentAction) ?? undefined,
              };
            })
            .filter((x): x is NonNullable<typeof x> => Boolean(x))
        : [
            {
              stepNumber: 1,
              description:
                asString(procedureRec.description) ?? asString(ar.procedure) ?? "Giáo viên tổ chức hoạt động theo kế hoạch.",
              timeAllocation: actDuration,
            },
          ];

    const methodsRaw = Array.isArray(ar.teachingMethods) ? ar.teachingMethods : [];
    const teachingMethods = methodsRaw
      .map((m) => {
        if (isRecord(m)) {
          const method = asString(m.method) ?? asString(m.name);
          const technique = asString(m.technique) ?? "KTDH phù hợp";
          if (!method) return null;
          return { method, technique, rationale: asString(m.rationale) ?? undefined };
        }
        const s = asString(m);
        if (!s) return null;
        return { method: s, technique: "KTDH phù hợp" };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const apRaw = Array.isArray(ar.assessmentProducts) ? ar.assessmentProducts : [];
    const assessmentProducts = apRaw
      .map((p) => {
        if (isRecord(p)) {
          const productType = asString(p.productType) ?? asString(p.type) ?? "Sản phẩm/Đánh giá";
          const description = asString(p.description) ?? asString(p.text);
          if (!description) return null;
          return {
            productType,
            description,
            assessmentCriteria: Array.isArray(p.assessmentCriteria)
              ? p.assessmentCriteria.filter((x): x is string => typeof x === "string")
              : undefined,
            assessmentMethod: asString(p.assessmentMethod) ?? undefined,
            feedbackType: asString(p.feedbackType) ?? undefined,
          };
        }
        const s = asString(p);
        if (!s) return null;
        return { productType: "Sản phẩm/Đánh giá", description: s };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    return {
      activityName,
      order,
      duration: actDuration,
      learningObjectives: learningObjectives.length ? learningObjectives : [{ objective: "Hoàn thành mục tiêu hoạt động.", level: input.pedagogicalRequirements.requiredAchievementLevel }],
      teachingMaterials: teachingMaterials.length ? teachingMaterials : [{ name: "SGK / bảng / phấn", type: "Khác" }],
      content: { mainContent },
      procedure: { steps },
      teachingMethods: teachingMethods.length ? teachingMethods : [{ method: "Gợi mở - vấn đáp", technique: "KTDH phù hợp" }],
      assessmentProducts: assessmentProducts.length ? assessmentProducts : [{ productType: "Sản phẩm/Đánh giá", description: "Quan sát/nhận xét mức độ tham gia và kết quả." }],
    };
  });

  const total = activities.reduce((s, a) => s + a.duration, 0);
  const timeAllocation = {
    totalDuration: total,
    breakdown: activities.map((a) => ({
      activityOrder: a.order,
      duration: a.duration,
      percentage: total > 0 ? Math.max(0, Math.min(100, (a.duration / total) * 100)) : 0,
    })),
    bufferTime: Math.max(0, duration - total),
  };

  return {
    lessonMetadata: coercedLessonMetadata,
    regulatoryCompliance: buildRegulatoryReferences(input),
    activities,
    timeAllocation,
  };
}

async function requireApprovedTeacher(cookieHeader: string | null) {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
    cache: "no-store",
  });

  if (!res.ok) return { ok: false, status: res.status } as const;

  const json: unknown = await res.json();
  const role = (() => {
    if (typeof json !== "object" || json === null) return undefined;
    const u = (json as { user?: { role?: unknown } }).user;
    return typeof u?.role === "string" ? u.role : undefined;
  })();
  // "Approved" signal does not exist in current auth payload; we gate by role.
  const allowed = role === "teacher" || role === "manager" || role === "admin";

  if (!allowed) return { ok: false, status: 403, role } as const;
  return { ok: true, status: 200, role } as const;
}

function getGeminiText(resp: unknown): string {
  if (typeof resp !== "object" || resp === null) return "";
  const text = (resp as { text?: unknown }).text;
  return typeof text === "string" ? text : "";
}

async function generateWithGemini(args: {
  apiKey: string;
  model: string;
  prompt: string;
  signal: AbortSignal;
}) {
  const ai = new GoogleGenAI({ apiKey: args.apiKey });
  const resp = await ai.models.generateContent({
    model: args.model,
    contents: args.prompt,
    config: {
      systemInstruction:
        "Bạn là giáo viên tiểu học giỏi và là trợ lý soạn kế hoạch bài dạy. Bạn phải tuân thủ nghiêm quy định và chỉ xuất JSON hợp lệ. Không markdown, không giải thích.",
      temperature: 0,
      topP: 1,
      responseMimeType: "application/json",
      // Gemini enforces max schema nesting depth; provide a shallow schema and validate with Zod after parsing.
      responseJsonSchema: geminiShallowJsonSchema,
      abortSignal: args.signal,
    },
  });

  return { resp, text: getGeminiText(resp) };
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const auth = await requireApprovedTeacher(cookieHeader);
    if (!auth.ok) {
      return NextResponse.json(
        {
          status: "error",
          message:
            auth.status === 403
              ? "Bạn không có quyền truy cập tính năng này."
              : "Bạn cần đăng nhập để tiếp tục.",
        },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const parsedInput = aiLessonPlanFormSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Dữ liệu form không hợp lệ.",
          issues: parsedInput.error.issues,
        },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Thiếu cấu hình GEMINI_API_KEY trên server. Vui lòng cấu hình biến môi trường trước khi sử dụng.",
        },
        { status: 500 }
      );
    }

    const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").replace(/^"|"$/g, "");
    const prompt = buildVietnameseLessonPlanPrompt(parsedInput.data);

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      getTimeoutMs("AI_LESSON_PLAN_TIMEOUT_MS", 60_000)
    );

    const { resp, text: content } = await generateWithGemini({
      apiKey: geminiKey,
      model,
      prompt,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!content) {
      return NextResponse.json(
        {
          status: "error",
          message: "AI không trả về nội dung hợp lệ.",
          details: resp,
        },
        { status: 502 }
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch {
      return NextResponse.json(
        {
          status: "error",
          message: "Không thể parse JSON từ AI.",
          rawText: content,
        },
        { status: 502 }
      );
    }

    // Coerce common Gemini "simple JSON" into our strict plan shape.
    const coerced = coerceGeminiJsonToPlan(json, parsedInput.data);

    const validated = aiGeneratedLessonPlanSchema.safeParse(coerced);
    if (!validated.success) {
      // One-shot repair: ask Gemini to FIX the JSON to satisfy our validation issues.
      const repairController = new AbortController();
      const repairTimeout = setTimeout(
        () => repairController.abort(),
        getTimeoutMs("AI_LESSON_PLAN_REPAIR_TIMEOUT_MS", 60_000)
      );
      const repairPrompt = [
        "Bạn là hệ thống sửa JSON. Nhiệm vụ: sửa JSON bên dưới để KHỚP 100% với schema yêu cầu.",
        "QUY TẮC: chỉ trả về JSON hợp lệ (application/json), không markdown, không chú thích.",
        "Nếu thiếu field bắt buộc: thêm vào. Nếu sai kiểu: đổi đúng kiểu. Không được xóa ý nghĩa sư phạm.",
        "",
        "DANH SÁCH LỖI VALIDATION (path + message):",
        JSON.stringify(validated.error.issues, null, 2),
        "",
        "JSON CẦN SỬA:",
        JSON.stringify(coerced, null, 2),
      ].join("\n");

      const { text: repairedText, resp: repairedResp } = await generateWithGemini({
        apiKey: geminiKey,
        model,
        prompt: repairPrompt,
        signal: repairController.signal,
      }).finally(() => clearTimeout(repairTimeout));

      if (repairedText) {
        try {
          const repairedJson = JSON.parse(repairedText) as unknown;
          const repairedValidated = aiGeneratedLessonPlanSchema.safeParse(repairedJson);
          if (repairedValidated.success) {
            return NextResponse.json(
              {
                status: "success",
                prompt,
                data: repairedValidated.data,
              },
              { status: 200 }
            );
          }

          return NextResponse.json(
            {
              status: "error",
              message:
                "JSON từ AI không khớp schema nội bộ (zod) để hiển thị/chỉnh sửa.",
              issues: repairedValidated.error.issues,
              data: repairedJson,
              details: { repairAttempted: true },
            },
            { status: 502 }
          );
        } catch {
          return NextResponse.json(
            {
              status: "error",
              message: "Không thể parse JSON từ AI (sau khi đã thử sửa).",
              rawText: repairedText,
              details: { repairAttempted: true, resp: repairedResp },
            },
            { status: 502 }
          );
        }
      }

      return NextResponse.json(
        {
          status: "error",
          message:
            "JSON từ AI không khớp schema nội bộ (zod) để hiển thị/chỉnh sửa.",
          issues: validated.error.issues,
          data: json,
          details: { repairAttempted: true, resp },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        status: "success",
        prompt,
        data: validated.data,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("AI lesson plan route error:", error);

    const errName =
      typeof error === "object" && error !== null && "name" in error
        ? String((error as { name?: unknown }).name)
        : "";
    const errMsg =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);

    const isAbort =
      errName === "AbortError" ||
      errMsg.includes("AbortError") ||
      errMsg.toLowerCase().includes("aborted") ||
      errMsg.toLowerCase().includes("timeout");

    if (isAbort) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Gemini phản hồi quá lâu hoặc request bị hủy (timeout). Hãy thử lại, hoặc tăng AI_LESSON_PLAN_TIMEOUT_MS.",
          details: errMsg,
        },
        { status: 504 }
      );
    }

    // Handle Gemini ApiError nicely (e.g. INVALID_ARGUMENT for schema depth).
    const apiStatus =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: unknown }).status
        : undefined;
    const apiMessage =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : "";

    if (apiStatus === 400 && apiMessage.includes("maximum allowed nesting depth")) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Gemini từ chối schema đầu ra vì schema quá sâu (nesting depth). Server đã cần dùng schema nông khi gọi Gemini.",
          details: apiMessage,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Lỗi server khi xử lý yêu cầu AI lesson plan.",
        details:
          typeof error === "object" && error !== null && "message" in error
            ? String((error as { message?: unknown }).message)
            : String(error),
      },
      { status: 500 }
    );
  }
}


