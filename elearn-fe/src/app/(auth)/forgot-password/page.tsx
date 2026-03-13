"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BreadcrumbOne from "@/components/common/breadcrumb/BreadcrumbOne";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import { forgotPassword, resetPassword } from "@/lib/api";

type Step = "username" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [emailMasked, setEmailMasked] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const canSubmitUsername = useMemo(
    () => username.trim().length > 0,
    [username]
  );
  const canSubmitOtp = useMemo(() => otp.trim().length === 6, [otp]);
  const stepText =
    step === "username"
      ? "Step 1/3"
      : step === "otp"
      ? "Step 2/3"
      : step === "reset"
      ? "Step 3/3"
      : "Done";

  const onSubmitUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setEmailMasked(null);

    const u = username.trim();
    if (!u) return;

    setBusy(true);
    try {
      const res = await forgotPassword(u);
      if (!res.success) {
        setError(res.error?.message || "Unable to send OTP. Please try again.");
        return;
      }

      const masked = res.data?.emailMasked;
      if (masked) {
        setEmailMasked(masked);
        setInfo(`Sending an OTP code to: ${masked} ...`);
      } else {
        setInfo("Sending an OTP code ...");
      }

      setStep("otp");
    } finally {
      setBusy(false);
    }
  };

  const onSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    // Do not leak OTP policy in UI. We'll validate OTP when calling resetPassword.
    setStep("reset");
  };

  const onSubmitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await resetPassword(username.trim(), otp.trim(), newPassword);
      if (!res.success) {
        const msg = res.error?.message || "Unable to reset password.";
        if (msg.toLowerCase().includes("otp")) {
          setError("Invalid OTP. Please try again.");
        } else {
          setError(msg);
        }
        return;
      }

      setStep("done");
      setInfo("Password reset successful. You can sign in now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Wrapper>
      <HeaderOne />
      <main className="main-area fix">
        <BreadcrumbOne title="Forgot Password" sub_title="Forgot Password" />

        <section className="singUp-area section-py-120">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-6 col-lg-8">
                <div className="singUp-wrap">
                  <h2 className="title">Forgot password</h2>
                  <p>
                    Enter your username to receive an OTP and reset your
                    password.
                  </p>
                  <div className="account__divider">
                    <span>{stepText}</span>
                  </div>

                  {error ? <p className="form_error">{error}</p> : null}
                  {info ? (
                    <div className="text-xs text-gray-500 mt-2">{info}</div>
                  ) : null}

                  {step === "username" ? (
                    <form onSubmit={onSubmitUsername} className="account__form">
                      <div className="form-grp">
                        <label htmlFor="fp-username">Username</label>
                        <input
                          id="fp-username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Username"
                          disabled={busy}
                          autoComplete="username"
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-two arrow-btn"
                        disabled={busy || !canSubmitUsername}
                      >
                        {busy ? "Checking..." : "Continue"}
                      </button>
                    </form>
                  ) : null}

                  {step === "otp" ? (
                    <form onSubmit={onSubmitOtp} className="account__form">
                      <div className="form-grp">
                        <label htmlFor="fp-otp">OTP</label>
                        <input
                          id="fp-otp"
                          type="text"
                          value={otp}
                          onChange={(e) =>
                            setOtp(
                              e.target.value.replace(/\D/g, "").slice(0, 6)
                            )
                          }
                          placeholder="OTP"
                          disabled={busy}
                          inputMode="numeric"
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          {emailMasked
                            ? `We are sending an OTP code to: ${emailMasked} ...`
                            : "We are sending an OTP code to your email ..."}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-two arrow-btn"
                        disabled={busy || !canSubmitOtp}
                      >
                        Verify OTP
                      </button>

                      <div className="account__switch">
                        <p>
                          <button
                            type="button"
                            onClick={() => {
                              setStep("username");
                              setOtp("");
                              setError("");
                              setInfo("");
                            }}
                            className="p-0 border-0 bg-transparent"
                            disabled={busy}
                          >
                            Back
                          </button>
                        </p>
                      </div>
                    </form>
                  ) : null}

                  {step === "reset" ? (
                    <form onSubmit={onSubmitReset} className="account__form">
                      <div className="form-grp">
                        <label htmlFor="fp-newpass">New password</label>
                        <input
                          id="fp-newpass"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          disabled={busy}
                          autoComplete="new-password"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Rule: at least 8 characters, with uppercase,
                          lowercase, and a number.
                        </div>
                      </div>
                      <div className="form-grp">
                        <label htmlFor="fp-confirmpass">Confirm password</label>
                        <input
                          id="fp-confirmpass"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          disabled={busy}
                          autoComplete="new-password"
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-two arrow-btn"
                        disabled={busy || !newPassword || !confirmPassword}
                      >
                        {busy ? "Resetting..." : "Reset password"}
                      </button>

                      <div className="account__switch">
                        <p>
                          <button
                            type="button"
                            onClick={() => {
                              setStep("otp");
                              setError("");
                              setInfo("");
                            }}
                            className="p-0 border-0 bg-transparent"
                            disabled={busy}
                          >
                            Back
                          </button>
                        </p>
                      </div>
                    </form>
                  ) : null}

                  {step === "done" ? (
                    <div className="account__switch">
                      <p>
                        <Link href="/sign-in">Go to Sign In</Link>
                      </p>
                    </div>
                  ) : (
                    <div className="account__switch">
                      <p>
                        Remember your password?{" "}
                        <Link href="/sign-in">Sign In</Link>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <FooterOne />
    </Wrapper>
  );
}
