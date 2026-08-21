"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  registerSchema,
  RegisterFormData,
} from "@/lib/validators/register";
import { registerUser } from "@/services/register";

export default function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "patient",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      toast.success("Registration successful!");
      router.push("/login");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Registration failed"
      );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-3xl font-bold text-center mb-6">
        Create Account
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input
            {...register("full_name")}
            placeholder="Full Name"
            className="w-full border rounded-lg px-4 py-3"
          />
          <p className="text-red-500 text-sm">
            {errors.full_name?.message}
          </p>
        </div>

        <div>
          <input
            {...register("email")}
            type="email"
            placeholder="Email"
            className="w-full border rounded-lg px-4 py-3"
          />
          <p className="text-red-500 text-sm">
            {errors.email?.message}
          </p>
        </div>

        <div>
          <input
            {...register("password")}
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg px-4 py-3"
          />
          <p className="text-red-500 text-sm">
            {errors.password?.message}
          </p>
        </div>

        <div>
          <input
            {...register("confirmPassword")}
            type="password"
            placeholder="Confirm Password"
            className="w-full border rounded-lg px-4 py-3"
          />
          <p className="text-red-500 text-sm">
            {errors.confirmPassword?.message}
          </p>
        </div>

        <div>
  <label className="block mb-2 font-medium">
    Select Role
  </label>

  <select
    {...register("role")}
    className="w-full border rounded-lg px-4 py-3"
  >
    <option value="patient">Patient</option>
    <option value="doctor">Doctor</option>
    <option value="admin">Admin</option>
  </select>

  <p className="text-red-500 text-sm">
    {errors.role?.message}
  </p>
</div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          {isSubmitting ? "Creating Account..." : "Register"}
        </button>
      </form>
    </div>
  );
}