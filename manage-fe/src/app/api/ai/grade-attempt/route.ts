import { NextResponse } from "next/server";
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

async function requireApprovedTeacher(cookieHeader: string | null) {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
    cache: "no-store",
  });
  if (!res.ok) return { ok: false, status: res.status } as const;

  const json: unknown = await res.json().catch(() => null);
  const role = (() => {
    if (typeof json !== "object" || json === null) return undefined;
    const u = (json as { user?: { role?: unknown } }).user;
    return typeof u?.role === "string" ? u.role : undefined;
  })();

  const allowed = role === "teacher" || role === "manager" || role === "admin";
  if (!allowed) return { ok: false, status: 403, role } as const;
  return { ok: true, status: 200, role } as const;
}

function clampGrade(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getGeminiText(resp: unknown): string {
  if (!isRecord(resp)) return "";
  const t = resp.text;
  return typeof t === "string" ? t : "";
}

const gradeJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["grade", "feedback"],
  properties: {
    grade: { type: "number" },
    feedback: { type: "string" },
  },
} as const;

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

    const body = (await request.json().catch(() => null)) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json(
        { status: "error", message: "Body không hợp lệ." },
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

    const assignment = isRecord(body.assignment) ? body.assignment : {};
    const attempt = isRecord(body.attempt) ? body.attempt : {};

    const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").replace(
      /^"|"$/g,
      ""
    );

    // Format assignment questions for better AI understanding
    const questions = Array.isArray(assignment.questions)
      ? assignment.questions.map((q: unknown, idx: number) => {
          if (!isRecord(q)) return null;
          const qType = q.type === "multi_choice" ? "Trắc nghiệm" : "Tự luận";
          const qTitle = String(q.title || "");
          const qOptions = Array.isArray(q.options) ? q.options : [];
          const correctAnswer = String(q.correctAnswer || "");
          return {
            index: idx + 1,
            type: qType,
            title: qTitle,
            options: qOptions,
            correctAnswer: correctAnswer || undefined,
          };
        })
      : [];

    // Format student answers
    const answers = Array.isArray(attempt.answers)
      ? attempt.answers.map((a: unknown) => {
          if (!isRecord(a)) return null;
          const questionId = String(a.questionId || "");
          const answerValue = a.answer;
          const answerText = Array.isArray(answerValue)
            ? answerValue.join(", ")
            : String(answerValue || "");
          return {
            questionId,
            answer: answerText,
          };
        })
      : [];

    const prompt = [
      "Bạn là trợ lý giáo viên chuyên nghiệp. Nhiệm vụ: gợi ý chấm điểm bài tập của học viên.",
      "",
      "TRẢ VỀ DUY NHẤT JSON hợp lệ (application/json) theo schema: { grade: number (0-100), feedback: string }.",
      "Không trả lời markdown, không có giải thích ngoài JSON.",
      "",
      "YÊU CẦU CHẤM ĐIỂM:",
      "- grade: điểm tổng từ 0-100. Tính điểm dựa trên:",
      "  + Câu trắc nghiệm: đúng = điểm, sai = 0 điểm (nếu có correctAnswer).",
      "  + Câu tự luận: đánh giá theo nội dung, độ chính xác, cách trình bày (0-100).",
      "  + Tính điểm trung bình có trọng số nếu có nhiều câu hỏi.",
      "- feedback: nhận xét ngắn gọn (100-200 từ), mang tính xây dựng:",
      "  + Nêu 1-2 điểm mạnh của học viên.",
      "  + Nêu 1-2 điểm cần cải thiện.",
      "  + Gợi ý cụ thể để học viên cải thiện.",
      "",
      "THÔNG TIN BÀI TẬP:",
      `Tên bài tập: ${String(assignment.name || assignment._id || "N/A")}`,
      `Mô tả: ${String(assignment.description || "Không có mô tả")}`,
      "",
      "DANH SÁCH CÂU HỎI:",
      JSON.stringify(questions, null, 2),
      "",
      "CÂU TRẢ LỜI CỦA HỌC VIÊN:",
      `Học viên: ${String(attempt.studentName || "N/A")}`,
      JSON.stringify(answers, null, 2),
      "",
      "Hãy chấm điểm và đưa ra nhận xét chi tiết.",
    ].join("\n");

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      getTimeoutMs("AI_GRADE_ATTEMPT_TIMEOUT_MS", 60_000)
    );

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const resp = await ai.models
      .generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseJsonSchema: gradeJsonSchema,
        },
      })
      .finally(() => clearTimeout(timeout));

    const text = getGeminiText(resp);
    if (!text) {
      return NextResponse.json(
        { status: "error", message: "AI không trả về nội dung hợp lệ." },
        { status: 502 }
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { status: "error", message: "Không thể parse JSON từ AI.", rawText: text },
        { status: 502 }
      );
    }

    if (!isRecord(json)) {
      return NextResponse.json(
        { status: "error", message: "JSON từ AI không hợp lệ.", rawJson: json },
        { status: 502 }
      );
    }

    const gradeRaw = json.grade;
    const feedbackRaw = json.feedback;

    const grade =
      typeof gradeRaw === "number"
        ? clampGrade(gradeRaw)
        : clampGrade(Number(gradeRaw));
    const feedback = typeof feedbackRaw === "string" ? feedbackRaw : String(feedbackRaw || "");

    return NextResponse.json(
      { status: "success", data: { grade, feedback } },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("AI grade-attempt route error:", error);
    const isAbort = error instanceof Error && error.name === "AbortError";
    if (isAbort) {
      return NextResponse.json(
        {
          status: "error",
          message: "Yêu cầu chấm điểm quá thời gian chờ. Vui lòng thử lại.",
        },
        { status: 504 }
      );
    }
    return NextResponse.json(
      {
        status: "error",
        message: "Lỗi server khi chấm điểm bằng AI.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


