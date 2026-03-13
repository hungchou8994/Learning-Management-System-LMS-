"use client";

import { useEffect, useMemo, useState } from "react";
import { useRoleGuard } from "@/lib/useRoleGuard";
import {
  getRevenueByCategory,
  getRevenueByCourse,
  getRevenueByTeacher,
  getRevenueSummary,
  getRevenueTrend,
  type RevenueByCategoryRow,
  type RevenueByCourseRow,
  type RevenueByTeacherRow,
  type RevenueSummary,
  type RevenueTrend,
} from "@/lib/api";
import { BarList, type BarListItem } from "@/components/charts/BarList";
import { Sparkline } from "@/components/charts/Sparkline";
import { DetailDialog } from "@/components/analytics/DetailDialog";
import { formatUsd } from "@/lib/money";

function toRangeParams(fromYmd: string, toYmd: string) {
  const from = new Date(`${fromYmd}T00:00:00.000Z`).toISOString();
  const to = new Date(`${toYmd}T23:59:59.999Z`).toISOString();
  return { from, to };
}

export default function FinancePage() {
  const { loading, role } = useRoleGuard(["admin", "manager", "accountant"]);
  const granularityLabel = (g: "day" | "month") => (g === "month" ? "Tháng" : "Ngày");

  const capabilities = useMemo(
    () => ({
      canExport: role === "accountant" || role === "manager" || role === "admin",
      canConfigure: role === "manager" || role === "admin",
    }),
    [role]
  );

  const [fromYmd, setFromYmd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 365);
    return d.toISOString().slice(0, 10);
  });
  const [toYmd, setToYmd] = useState(() => new Date().toISOString().slice(0, 10));
  const [granularity, setGranularity] = useState<"day" | "month">("day");

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [trend, setTrend] = useState<RevenueTrend | null>(null);
  const [byCourse, setByCourse] = useState<RevenueByCourseRow[]>([]);
  const [byTeacher, setByTeacher] = useState<RevenueByTeacherRow[]>([]);
  const [byCategory, setByCategory] = useState<RevenueByCategoryRow[]>([]);

  const [drill, setDrill] = useState<
    | null
    | { kind: "teacher"; title: string; teacherId: string }
    | { kind: "course"; title: string; courseId: string }
    | { kind: "category"; title: string; category: string }
  >(null);
  const [drillTrend, setDrillTrend] = useState<RevenueTrend | null>(null);
  const [drillSummary, setDrillSummary] = useState<RevenueSummary | null>(null);
  const [drillBusy, setDrillBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setError("");
    const range = toRangeParams(fromYmd, toYmd);
    const [s, t, c, te, cat] = await Promise.all([
      getRevenueSummary(range),
      getRevenueTrend({ ...range, granularity, includeNewReturning: true }),
      getRevenueByCourse({ ...range, limit: 10 }),
      getRevenueByTeacher({ ...range, limit: 10 }),
      getRevenueByCategory(range),
    ]);

    if (!s.success) setError(s.error?.message || "Không thể tải dữ liệu tài chính.");
    if (!t.success) setError(t.error?.message || "Không thể tải xu hướng doanh thu.");

    setSummary(s.success ? s.data || null : null);
    setTrend(t.success ? t.data || null : null);
    setByCourse(c.success && c.data ? c.data : []);
    setByTeacher(te.success && te.data ? te.data : []);
    setByCategory(cat.success && cat.data ? cat.data : []);
    setBusy(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openTeacher = async (item: BarListItem, teacherId?: string) => {
    if (!teacherId) return;
    setDrill({ kind: "teacher", title: item.label, teacherId });
    setDrillBusy(true);
    setDrillTrend(null);
    setDrillSummary(null);
    const range = toRangeParams(fromYmd, toYmd);
    const [t, s] = await Promise.all([
      getRevenueTrend({ ...range, granularity, teacherId }),
      getRevenueSummary({ ...range, teacherId }),
    ]);
    setDrillTrend(t.success ? t.data || null : null);
    setDrillSummary(s.success ? s.data || null : null);
    setDrillBusy(false);
  };

  const openCourse = async (item: BarListItem, courseId?: string) => {
    if (!courseId) return;
    setDrill({ kind: "course", title: item.label, courseId });
    setDrillBusy(true);
    setDrillTrend(null);
    setDrillSummary(null);
    const range = toRangeParams(fromYmd, toYmd);
    const [t, s] = await Promise.all([
      getRevenueTrend({ ...range, granularity, courseId }),
      getRevenueSummary({ ...range, courseId }),
    ]);
    setDrillTrend(t.success ? t.data || null : null);
    setDrillSummary(s.success ? s.data || null : null);
    setDrillBusy(false);
  };

  const openCategory = async (item: BarListItem, category?: string) => {
    if (!category) return;
    setDrill({ kind: "category", title: item.label, category });
    setDrillBusy(true);
    setDrillTrend(null);
    setDrillSummary(null);
    const range = toRangeParams(fromYmd, toYmd);
    const [t, s] = await Promise.all([
      getRevenueTrend({ ...range, granularity, category }),
      getRevenueSummary({ ...range, category }),
    ]);
    setDrillTrend(t.success ? t.data || null : null);
    setDrillSummary(s.success ? s.data || null : null);
    setDrillBusy(false);
  };

  const trendValues = trend?.points?.map((p) => p.paidRevenue) || [];
  const newValues = trend?.points?.map((p) => p.newRevenue || 0) || [];
  const returningValues = trend?.points?.map((p) => p.returningRevenue || 0) || [];

  const newRevenueTotal = (trend?.points || []).reduce((s, p) => s + (p.newRevenue || 0), 0);
  const returningRevenueTotal = (trend?.points || []).reduce(
    (s, p) => s + (p.returningRevenue || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="loading-spinner h-14 w-14 mx-auto mb-4"></div>
          <div className="text-gray-600">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-glass p-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Tài chính & Doanh thu</h1>
        <p className="text-gray-600">
          Tập trung vào câu hỏi: tiền đến từ đâu, từ ai, và xu hướng ra sao.
        </p>
      </div>

      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-gray-900">Bộ lọc</div>
            <div className="text-sm text-gray-600">
              Chỉ số và biểu đồ đang dùng dữ liệu Enroll (paid/not_paid) × giá khóa học (MVP).
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Từ ngày</div>
              <input className="input" type="date" value={fromYmd} onChange={(e) => setFromYmd(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Đến ngày</div>
              <input className="input" type="date" value={toYmd} onChange={(e) => setToYmd(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Chu kỳ</div>
              <select
                className="input"
                value={granularity}
                onChange={(e) =>
                  setGranularity(e.target.value === "month" ? "month" : "day")
                }
              >
                <option value="day">Theo ngày</option>
                <option value="month">Theo tháng</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="button" className="btn btn-primary" onClick={load} disabled={busy}>
                {busy ? "Đang tải..." : "Áp dụng"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {busy ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="loading-spinner h-14 w-14 mx-auto mb-4"></div>
            <div className="text-gray-600">Đang tải dữ liệu tài chính...</div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="card p-5">
              <div className="text-xs text-gray-500">Doanh thu thuần</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatUsd(summary?.kpis.netRevenue || 0)}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-xs text-gray-500">Đơn đã thanh toán</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {summary?.kpis.ordersPaid || 0}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-xs text-gray-500">Khách mua (unique)</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {summary?.kpis.uniqueBuyers || 0}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-xs text-gray-500">Giá trị đơn TB (AOV)</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatUsd(summary?.kpis.aov || 0)}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-xs text-gray-500">Đơn chờ thanh toán</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {summary?.kpis.ordersPending || 0}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-xs text-gray-500">Giá trị chờ thanh toán</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatUsd(summary?.kpis.pendingAmount || 0)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-6 lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Xu hướng doanh thu</div>
                  <div className="text-sm text-gray-600">
                    {granularityLabel(trend?.granularity || "day")} • {fromYmd} → {toYmd}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Doanh thu khách mới: <b>{formatUsd(newRevenueTotal)}</b> • Khách quay lại:{" "}
                    <b>{formatUsd(returningRevenueTotal)}</b>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Quyền</div>
                  <div className="text-sm text-gray-700 mt-1">
                    Xuất báo cáo: <b>{capabilities.canExport ? "Có" : "Không"}</b>
                    <br />
                    Thiết lập cấu hình: <b>{capabilities.canConfigure ? "Có" : "Không"}</b>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center text-blue-600">
                <Sparkline values={trendValues} width={760} height={88} />
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl border bg-white">
                  <div className="text-xs text-gray-500 mb-1">Doanh thu khách mới (sparkline)</div>
                  <div className="text-blue-600">
                    <Sparkline values={newValues} width={360} height={60} />
                  </div>
                </div>
                <div className="p-3 rounded-2xl border bg-white">
                  <div className="text-xs text-gray-500 mb-1">Doanh thu khách quay lại (sparkline)</div>
                  <div className="text-blue-600">
                    <Sparkline values={returningValues} width={360} height={60} />
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto border rounded-2xl">
                <table className="min-w-[900px] w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 border-b">Mốc thời gian</th>
                      <th className="text-right p-3 border-b">Doanh thu đã thu</th>
                      <th className="text-right p-3 border-b">Doanh thu khách mới</th>
                      <th className="text-right p-3 border-b">Doanh thu khách quay lại</th>
                      <th className="text-right p-3 border-b">Đơn đã thanh toán</th>
                      <th className="text-right p-3 border-b">Đơn chờ thanh toán</th>
                      <th className="text-right p-3 border-b">Khách mua</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(trend?.points || []).map((p) => (
                      <tr key={p.bucket}>
                        <td className="p-3 border-b">{p.bucket}</td>
                        <td className="p-3 border-b text-right font-semibold">{formatUsd(p.paidRevenue)}</td>
                        <td className="p-3 border-b text-right">{formatUsd(p.newRevenue || 0)}</td>
                        <td className="p-3 border-b text-right">{formatUsd(p.returningRevenue || 0)}</td>
                        <td className="p-3 border-b text-right">{p.paidEnrollments}</td>
                        <td className="p-3 border-b text-right">{p.pendingEnrollments}</td>
                        <td className="p-3 border-b text-right">{p.uniqueBuyers}</td>
                      </tr>
                    ))}
                    {(trend?.points || []).length === 0 && (
                      <tr>
                        <td className="p-3 text-gray-600" colSpan={7}>
                          Chưa có dữ liệu trong khoảng thời gian này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <BarList
                title="Doanh thu theo giáo viên"
                items={byTeacher.map((t) => ({
                  key: String(t.teacherId || t.username || Math.random()),
                  label: t.name?.trim() ? t.name : t.username || "(không rõ)",
                  value: t.paidRevenue,
                  meta: `${t.paidEnrollments} đơn đã thanh toán • ${t.coursesCount} khóa học`,
                }))}
                valueFormatter={formatUsd}
                onSelect={(item) => {
                  const src = byTeacher.find((t) => String(t.teacherId) === item.key || t.username === item.label);
                  openTeacher(item, src?.teacherId);
                }}
              />

              <BarList
                title="Doanh thu theo khóa học"
                items={byCourse.map((c) => ({
                  key: c.courseId,
                  label: c.courseName,
                  value: c.paidRevenue,
                  meta: `${c.paidEnrollments} đơn đã thanh toán • ${c.category}`,
                }))}
                valueFormatter={formatUsd}
                onSelect={(item) => openCourse(item, item.key)}
              />

              <BarList
                title="Doanh thu theo danh mục (tag)"
                items={byCategory.slice(0, 10).map((c) => ({
                  key: c.category,
                  label: c.category,
                  value: c.paidRevenue,
                  meta: `${c.paidEnrollments} đơn đã thanh toán`,
                }))}
                valueFormatter={formatUsd}
                onSelect={(item) => openCategory(item, item.key)}
              />
            </div>
          </div>
        </>
      )}

      <DetailDialog
        open={!!drill}
        title={drill ? `Chi tiết: ${drill.title}` : ""}
        description={drill ? `${fromYmd} → ${toYmd} • ${granularityLabel(granularity)}` : ""}
        onClose={() => {
          setDrill(null);
          setDrillTrend(null);
          setDrillSummary(null);
        }}
      >
        {drillBusy ? (
          <div className="flex items-center justify-center min-h-[20vh]">
            <div className="text-center">
              <div className="loading-spinner h-12 w-12 mx-auto mb-3"></div>
              <div className="text-gray-600">Đang tải chi tiết...</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-5">
                <div className="text-xs text-gray-500">Doanh thu thuần</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {formatUsd(drillSummary?.kpis.netRevenue || 0)}
                </div>
              </div>
              <div className="card p-5">
                <div className="text-xs text-gray-500">Đơn đã thanh toán</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {drillSummary?.kpis.ordersPaid || 0}
                </div>
              </div>
              <div className="card p-5">
                <div className="text-xs text-gray-500">Khách mua (unique)</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {drillSummary?.kpis.uniqueBuyers || 0}
                </div>
              </div>
              <div className="card p-5">
                <div className="text-xs text-gray-500">Giá trị đơn TB (AOV)</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {formatUsd(drillSummary?.kpis.aov || 0)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center text-blue-600">
              <Sparkline
                values={(drillTrend?.points || []).map((p) => p.paidRevenue)}
                width={900}
                height={90}
              />
            </div>

            <div className="overflow-x-auto border rounded-2xl">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 border-b">Mốc thời gian</th>
                    <th className="text-right p-3 border-b">Doanh thu đã thu</th>
                    <th className="text-right p-3 border-b">Đơn đã thanh toán</th>
                    <th className="text-right p-3 border-b">Đơn chờ thanh toán</th>
                  </tr>
                </thead>
                <tbody>
                  {(drillTrend?.points || []).map((p) => (
                    <tr key={p.bucket}>
                      <td className="p-3 border-b">{p.bucket}</td>
                      <td className="p-3 border-b text-right font-semibold">{formatUsd(p.paidRevenue)}</td>
                      <td className="p-3 border-b text-right">{p.paidEnrollments}</td>
                      <td className="p-3 border-b text-right">{p.pendingEnrollments}</td>
                    </tr>
                  ))}
                  {(drillTrend?.points || []).length === 0 && (
                    <tr>
                      <td className="p-3 text-gray-600" colSpan={4}>
                        Chưa có dữ liệu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DetailDialog>
    </div>
  );
}


