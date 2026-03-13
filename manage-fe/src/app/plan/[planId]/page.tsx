"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { LessonPlanTable } from "@/components/ai/LessonPlanTable";
import type { AiGeneratedLessonPlan } from "@/lib/ai/lessonPlanTypes";
import {
  getAiLessonPlanDraftById,
  getAuthMe,
  updateAiLessonPlanDraft,
  type AiLessonPlanDraftDoc,
} from "@/lib/api";

export default function PlanDetailPage() {
  const params = useParams<{ planId: string }>();
  const router = useRouter();

  const planId = useMemo(() => params?.planId || "", [params]);

  const [authLoading, setAuthLoading] = useState(true);
  const [canUseAi, setCanUseAi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [doc, setDoc] = useState<AiLessonPlanDraftDoc | null>(null);
  const [plan, setPlan] = useState<AiGeneratedLessonPlan | null>(null);

  useEffect(() => {
    const loadAuth = async () => {
      setAuthLoading(true);
      const me = await getAuthMe();
      const role = me.success ? me.data?.role : undefined;
      setCanUseAi(role === "teacher" || role === "manager" || role === "admin");
      setAuthLoading(false);
    };
    loadAuth();
  }, []);

  useEffect(() => {
    if (!planId) return;

    const load = async () => {
      setLoading(true);
      setError("");
      const res = await getAiLessonPlanDraftById(planId);
      if (!res.success || !res.data) {
        setError(res.error?.message || "Không thể tải bản kế hoạch.");
        setDoc(null);
        setPlan(null);
        setLoading(false);
        return;
      }

      setDoc(res.data);
      setPlan(res.data.structure as AiGeneratedLessonPlan);
      setLoading(false);
    };
    load();
  }, [planId]);

  const onSave = async () => {
    if (!plan || !planId) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateAiLessonPlanDraft(planId, { structure: plan });
      if (!updated.success || !updated.data) {
        setError(updated.error?.message || "Không thể lưu bản kế hoạch.");
        return;
      }
      setDoc(updated.data);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="loading-spinner h-14 w-14 mx-auto mb-4"></div>
          <div className="text-gray-600">Đang tải kế hoạch...</div>
        </div>
      </div>
    );
  }

  if (!canUseAi) {
    return (
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Kế hoạch bài dạy
        </h1>
        <p className="text-gray-600">
          Bạn không có quyền truy cập trang này. (Yêu cầu teacher/manager/admin)
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          <Link className="btn btn-ghost" href="/plans">
            Danh sách kế hoạch
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link className="btn btn-ghost" href="/plans">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách kế hoạch
          </Link>
        </div>
        {doc && (
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {doc.lessonTopic}
            </div>
            <div className="text-xs text-gray-500">
              {doc.subject} • Lớp {doc.grade} • {doc.textbook} •{" "}
              {new Date(doc.createdAt).toLocaleString("vi-VN")}
            </div>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card p-6">
        <LessonPlanTable
          plan={plan}
          onChange={(next) => setPlan(next)}
          onSave={onSave}
          saving={saving}
        />
      </div>
    </div>
  );
}


