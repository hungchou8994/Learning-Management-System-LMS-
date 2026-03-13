"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Trash2, RefreshCw, Eye } from "lucide-react";
import {
  deleteAiLessonPlanDraft,
  getAuthMe,
  listAiLessonPlanDrafts,
  type AiLessonPlanDraftDoc,
} from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";

function formatDateVi(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN");
}

export default function PlansPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [canUseAi, setCanUseAi] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<AiLessonPlanDraftDoc[]>([]);

  const [q, setQ] = useState("");
  const query = useMemo(() => q.trim().toLowerCase(), [q]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<AiLessonPlanDraftDoc | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await listAiLessonPlanDrafts();
    if (!res.success || !Array.isArray(res.data)) {
      setItems([]);
      setError(res.error?.message || "Không thể tải danh sách kế hoạch.");
      setLoading(false);
      return;
    }
    setItems(res.data);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setAuthLoading(true);
      const me = await getAuthMe();
      const role = me.success ? me.data?.role : undefined;
      setCanUseAi(role === "teacher" || role === "manager" || role === "admin");
      setAuthLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!canUseAi) return;
    load();
  }, [canUseAi]);

  const filtered = useMemo(() => {
    if (!query) return items;
    return items.filter((p) => {
      const hay =
        `${p.lessonTopic} ${p.subject} ${p.textbook} ${p.grade} ${p._id}`.toLowerCase();
      return hay.includes(query);
    });
  }, [items, query]);

  const onAskDelete = (p: AiLessonPlanDraftDoc) => {
    setSelected(p);
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    setError("");
    try {
      const res = await deleteAiLessonPlanDraft(selected._id);
      if (!res.success) {
        setError(res.error?.message || "Không thể xóa kế hoạch.");
        return;
      }
      setItems((cur) => cur.filter((x) => x._id !== selected._id));
      setConfirmOpen(false);
      setSelected(null);
    } finally {
      setDeleting(false);
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
          Kế hoạch đã lưu
        </h1>
        <p className="text-gray-600">
          Bạn không có quyền truy cập trang này. (Yêu cầu teacher/manager/admin)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kế hoạch đã lưu</h1>
          <p className="text-gray-600 mt-1">
            Xem lại, chỉnh sửa hoặc xóa các bản kế hoạch AI đã lưu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link className="btn btn-ghost" href="/ai-lesson-plan">
            Quay lại tạo kế hoạch
          </Link>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={load}
            disabled={loading}
            title="Tải lại"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <input
            className="input w-full md:max-w-md"
            placeholder="Tìm theo tên bài, môn, sách, lớp, id..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="text-sm text-gray-500">
            {filtered.length}/{items.length} kế hoạch
          </div>
        </div>

        <div className="mt-4 overflow-x-auto border rounded-2xl bg-white shadow-sm">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left font-semibold text-gray-700 p-3 border-b">
                  Bài dạy
                </th>
                <th className="text-left font-semibold text-gray-700 p-3 border-b">
                  Môn / Lớp
                </th>
                <th className="text-left font-semibold text-gray-700 p-3 border-b">
                  Sách
                </th>
                <th className="text-left font-semibold text-gray-700 p-3 border-b">
                  Ngày tạo
                </th>
                <th className="text-right font-semibold text-gray-700 p-3 border-b">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6 text-gray-600" colSpan={5}>
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="p-6 text-gray-600" colSpan={5}>
                    Chưa có kế hoạch nào.
                  </td>
                </tr>
              ) : (
                filtered
                  .slice()
                  .sort(
                    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
                  )
                  .map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/60">
                      <td className="p-3 border-b">
                        <div className="font-semibold text-gray-900">
                          {p.lessonTopic}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[520px]">
                          ID: {p._id}
                        </div>
                      </td>
                      <td className="p-3 border-b text-gray-800">
                        {p.subject} • Lớp {p.grade}
                      </td>
                      <td className="p-3 border-b text-gray-800">
                        {p.textbook}
                      </td>
                      <td className="p-3 border-b text-gray-600">
                        {formatDateVi(p.createdAt)}
                      </td>
                      <td className="p-3 border-b">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            className="btn btn-ghost"
                            href={`/plan/${p._id}`}
                          >
                            <Eye className="h-4 w-4" />
                            Xem
                          </Link>
                          <button
                            type="button"
                            className="btn bg-red-600 text-white hover:bg-red-700"
                            onClick={() => onAskDelete(p)}
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Xóa bản kế hoạch?"
        description={
          selected
            ? `Bạn có chắc muốn xóa "${selected.lessonTopic}"? Hành động này không thể hoàn tác.`
            : undefined
        }
        confirmText="Xóa"
        confirmVariant="danger"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setConfirmOpen(false);
          setSelected(null);
        }}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
