"use client";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import BtnArrow from "@/svg/BtnArrow";
import Link from "next/link";

interface FormData {
  username: string;
  password: string;
}

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string;
}

const LoginForm = ({ onLogin, isLoading, error }: LoginFormProps) => {
  const schema = yup
    .object({
      username: yup.string().required().label("Username"),
      password: yup.string().required().label("Password"),
    })
    .required();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await onLogin(data.username, data.password);
      reset();
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="account__form">
      <div className="form-grp">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          {...register("username")}
          type="text"
          placeholder="username"
          disabled={isLoading}
        />
        <p className="form_error">{errors.username?.message}</p>
      </div>
      <div className="form-grp">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          {...register("password")}
          type="password"
          placeholder="password"
          disabled={isLoading}
        />
        <p className="form_error">{errors.password?.message}</p>
      </div>
      {error && <p className="form_error">{error}</p>}
      <div className="account__check">
        <div className="account__check-remember">
          <input
            type="checkbox"
            className="form-check-input"
            value=""
            id="terms-check"
          />
          <label htmlFor="terms-check" className="form-check-label">
            Remember me
          </label>
        </div>
        <div className="account__check-forgot">
          <Link href="/forgot-password">Forgot Password?</Link>
        </div>
      </div>
      <button
        type="submit"
        className="btn btn-two arrow-btn"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign In"}
        <BtnArrow />
      </button>
    </form>
  );
};

export default LoginForm;
