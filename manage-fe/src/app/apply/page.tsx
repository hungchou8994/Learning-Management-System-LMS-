"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Step = "form" | "submitted";

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState(""); // yyyy-mm-dd
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);

  const FilePicker = (props: {
    label: string;
    accept: string;
    file: File | null;
    onPick: (file: File | null) => void;
    hint?: string;
  }) => {
    const { label, accept, file, onPick, hint } = props;
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0] || null)}
            />
            Chọn tệp
          </label>
          <div
            className="flex-1 min-w-0 text-sm text-gray-600 truncate"
            title={file ? file.name : "Chưa chọn tệp"}
          >
            {file ? file.name : "Chưa chọn tệp"}
          </div>
        </div>
        {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
      </div>
    );
  };

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      dob.trim().length > 0 &&
      address.trim().length >= 3 &&
      email.trim().length >= 5 &&
      phoneNumber.trim().length >= 8 &&
      !!idCardFront &&
      !!idCardBack &&
      !!cv
    );
  }, [fullName, dob, address, email, phoneNumber, idCardFront, idCardBack, cv]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!canSubmit) {
      setError("Vui lòng điền đầy đủ thông tin và upload đủ file yêu cầu.");
      return;
    }
    if (cv && cv.type !== "application/pdf") {
      setError("CV phải là file PDF.");
      return;
    }

    const fd = new FormData();
    fd.append("fullName", fullName.trim());
    fd.append("dob", dob);
    fd.append("address", address.trim());
    fd.append("email", email.trim());
    fd.append("phoneNumber", phoneNumber.trim());
    if (idCardFront) fd.append("idCardFront", idCardFront);
    if (idCardBack) fd.append("idCardBack", idCardBack);
    if (cv) fd.append("cv", cv);

    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/elearn/teacher-applications`,
        {
          method: "POST",
          body: fd,
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.status !== "success") {
        setError(data?.message || "Không thể gửi đơn ứng tuyển.");
        return;
      }

      setStep("submitted");
      setSuccessMsg(
        "Đã gửi đơn ứng tuyển. Trung tâm sẽ xem xét và liên hệ với bạn qua email."
      );
    } catch (err) {
      console.error("Apply submit error:", err);
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-6">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Ứng tuyển vị trí Giáo viên
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Hãy điền thông tin và tải hồ sơ lên. Sau khi được duyệt, trung tâm
            sẽ tạo tài khoản giáo viên và gửi thông tin đăng nhập qua email.
          </p>
          <div className="mt-4">
            <Link
              href="/sign-in"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Đã có tài khoản? Quay lại đăng nhập
            </Link>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        ) : null}
        {successMsg ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
            {successMsg}
          </div>
        ) : null}

        {step === "form" ? (
          <form
            className="bg-white p-8 rounded-lg shadow-md space-y-5"
            onSubmit={onSubmit}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <input
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày tháng năm sinh
                </label>
                <input
                  type="date"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thông tin địa chỉ
              </label>
              <input
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="090..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FilePicker
                label="Căn cước công dân (mặt trước)"
                accept="image/*"
                file={idCardFront}
                onPick={setIdCardFront}
                hint="Định dạng: JPG/PNG/GIF. Dung lượng tối đa 15MB."
              />
              <FilePicker
                label="Căn cước công dân (mặt sau)"
                accept="image/*"
                file={idCardBack}
                onPick={setIdCardBack}
                hint="Định dạng: JPG/PNG/GIF. Dung lượng tối đa 15MB."
              />
            </div>

            <FilePicker
              label="CV (PDF)"
              accept="application/pdf"
              file={cv}
              onPick={setCv}
              hint="Định dạng: PDF. Dung lượng tối đa 15MB."
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800"
                onClick={() => router.push("/sign-in")}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {submitting ? "Đang gửi..." : "Gửi đơn ứng tuyển"}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-gray-800">
              Cảm ơn bạn. Đơn ứng tuyển đã được ghi nhận.
            </div>
            <div className="mt-4">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Quay lại trang đăng nhập
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
