"use client";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import BtnArrow from "@/svg/BtnArrow";
import Link from "next/link";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegistrationFormProps {
  onRegister: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  isLoading: boolean;
  error: string;
}

const schema = yup
  .object({
    username: yup.string().required().label("Username"),
    email: yup.string().email().required().label("Email"),
    // Must match auth-service rule: min 8, at least 1 lowercase, 1 uppercase, 1 number
    password: yup
      .string()
      .required()
      .min(8, "Password must be at least 8 characters long")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      )
      .label("Password"),
    confirmPassword: yup
      .string()
      .required()
      .oneOf([yup.ref("password")], "Passwords must match")
      .label("Confirm Password"),
  })
  .required();

const RegistrationForm = ({
  onRegister,
  isLoading,
  error,
}: RegistrationFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await onRegister(data.username, data.email, data.password);
      reset();
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="account__form">
      <div className="form-grp">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          {...register("username")}
          id="username"
          placeholder="Username"
          disabled={isLoading}
        />
        <p className="form_error">{errors.username?.message}</p>
      </div>
      <div className="form-grp">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          {...register("email")}
          id="email"
          placeholder="Email"
          disabled={isLoading}
        />
        <p className="form_error">{errors.email?.message}</p>
      </div>
      <div className="form-grp">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          {...register("password")}
          id="password"
          placeholder="password"
          disabled={isLoading}
        />
        <div className="text-xs text-gray-500 mt-1">
          Rule: ≥8 ký tự, có chữ hoa, chữ thường và số.
        </div>
        <p className="form_error">{errors.password?.message}</p>
      </div>
      <div className="form-grp">
        <label htmlFor="confirm-password">Confirm Password</label>
        <input
          type="password"
          {...register("confirmPassword")}
          id="confirm-password"
          placeholder="Confirm Password"
          disabled={isLoading}
        />
        <p className="form_error">{errors.confirmPassword?.message}</p>
      </div>
      {error && <p className="form_error">{error}</p>}
      <button
        type="submit"
        className="btn btn-two arrow-btn"
        disabled={isLoading}
      >
        {isLoading ? "Signing up..." : "Sign Up"}
        <BtnArrow />
      </button>
    </form>
  );
};

export default RegistrationForm;
