"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authStorage } from "@/lib/authStorage";
import { loginSchema, LoginFormData } from "@/lib/validators/auth";
import { loginUser } from "@/services/auth";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);

    try {
      const response = await loginUser(data);
      authStorage.saveToken(response.access_token);
      authStorage.saveRole(response.role);
      toast.success("Login successful!");
console.log(response);
console.log(response.role);
const role = response.role.toLowerCase();

switch (role) {
  case "doctor":
    router.push("/doctor/dashboard");
    break;

  case "admin":
    router.push("/admin/dashboard");
    break;

  case "patient":
    router.push("/dashboard");
    break;

  default:
    router.push("/dashboard");
}
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">
      <h1 className="text-3xl font-bold text-center text-blue-700">
        MedAssistAI
      </h1>

      <p className="text-center text-gray-500 mt-2">
        Welcome back! Login to continue.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 mt-8"
      >
        {/* Email */}
        <div>
          <label className="block mb-2 font-medium">
            Email
          </label>

          <div className="flex items-center border rounded-lg px-3">
            <Mail className="text-gray-400" size={18} />

            <input
              {...register("email")}
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 outline-none"
            />
          </div>

          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block mb-2 font-medium">
            Password
          </label>

          <div className="flex items-center border rounded-lg px-3">
            <Lock className="text-gray-400" size={18} />

            <input
              {...register("password")}
              type="password"
              placeholder="Enter your password"
              className="w-full p-3 outline-none"
            />
          </div>

          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Logging in...
            </>
          ) : (
            <>
              <LogIn size={18} />
              Login
            </>
          )}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        Don't have an account?{" "}
        <span
          className="text-blue-600 font-semibold cursor-pointer hover:underline"
          onClick={() => router.push("/register")}
        >
          Register
        </span>
      </p>
    </div>
  );
}