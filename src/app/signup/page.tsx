"use client";

import { API_URL } from "@/config";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  User,
  Mail,
  Lock,
  Shield,
  CheckCircle2,
  ArrowRight,
  Activity,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    sex: "",
    phone: "",
    speciality: "",
    role: "patient", // patient or doctor
    agree: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role: string) => {
    setFormData((prev) => ({ ...prev, role, speciality: "" }));
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.age.trim()) {
      newErrors.age = "Age is required";
    } else if (isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
      newErrors.age = "Enter a valid age";
    }
    if (!formData.sex) {
      newErrors.sex = "Gender selection is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (formData.role === "doctor" && !formData.speciality) {
      newErrors.speciality = "Speciality selection is required";
    }
    if (!formData.agree) {
      newErrors.agree = "You must agree to the Terms and Conditions";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          age: formData.age,
          sex: formData.sex,
          phone: formData.phone,
          role: formData.role,
          speciality: formData.role === "doctor" ? formData.speciality : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrors({ server: data.message || "Something went wrong. Please try again." });
      } else {
        localStorage.setItem("user", JSON.stringify(data));
        setIsSubmitted(true);
      }
    } catch (err) {
      setErrors({
        server: "Could not connect to the server. Ensure the backend is running.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left side: Beautiful visual graphic panel (Dark colored) */}
      <div className="hidden lg:col-span-7 lg:flex relative overflow-hidden bg-slate-950 flex-col justify-center items-center p-12 text-white">
        {/* Colorful gradient mesh background with low opacity for dark feel */}
        <div className="absolute inset-0 bg-gradient-primary opacity-30" />
        <div className="absolute inset-0 bg-slate-950/80" />

        {/* Floating landing-page style decoration shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-primary/10 floating" />
          <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-white/5 floating-slow" />
        </div>

        {/* Content Card container */}
        <div className="relative z-10 max-w-lg text-center text-white space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-white">
              Join the Smart Healthcare Ecosystem
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Connect seamlessly with healthcare providers, securely manage your clinical history,
              and receive smart AI insights to control your wellbeing.
            </p>
          </div>

          {/* Interactive illustration mockup area */}
          <div className="relative rounded-2xl bg-white/5 backdrop-blur-md p-6 border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <div className="h-3 w-3 rounded-full bg-secondary" />
              <div className="h-3 w-3 rounded-full bg-success" />
              <span className="text-xs text-white/40 ml-auto font-mono">system_status: active</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Stat card 1 */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 text-left border border-white/5 floating-slow">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white mb-2">
                  <Activity className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-400">Reliability</p>
                <p className="text-lg font-bold">99.8% Platform</p>
              </div>

              {/* Stat card 2 */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 text-left border border-white/5 floating">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white mb-2">
                  <Calendar className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-400">Support Status</p>
                <p className="text-sm font-semibold">24/7 AI Assistance</p>
              </div>
            </div>

            {/* AI Assistant block */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 text-left border border-white/5 flex items-center gap-4 floating-delayed">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Fully Compliant Ecosystem</p>
                <p className="text-xs text-slate-400">
                  End-to-end data security and standard clinical collaboration tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Form (Light theme color matching the landing page) */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative overflow-hidden bg-background text-foreground">
        {/* Floating background shape for form side */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-primary/5 floating" />
        </div>

        {/* Top brand logo */}
        <div className="z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl font-bold text-foreground transition-colors hover:text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Heart className="h-5 w-5" />
            </div>
            <span>MedAssist AI</span>
          </Link>
        </div>

        {/* Form area */}
        <div className="my-auto py-8 z-10 max-w-md w-full mx-auto lg:mx-0">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {isSubmitted ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6"
              >
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success/10 text-success mb-6">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Registration Successful!
                </h2>
                <p className="text-muted-foreground mb-8">
                  Welcome aboard! We have sent a confirmation email to{" "}
                  <span className="font-semibold text-foreground">{formData.email}</span>.
                </p>
                <Link href="/dashboard" passHref legacyBehavior>
                  <Button className="w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-3">
                    Go to Dashboard
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Create your account
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      Log in
                    </Link>
                  </p>
                </div>

                {errors.server && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                    {errors.server}
                  </div>
                )}

                {/* Role Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    I am registering as a:
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleRoleSelect("patient")}
                      className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        formData.role === "patient"
                          ? "border-primary bg-primary/5 text-primary shadow-sm font-semibold"
                          : "border-border bg-card hover:bg-accent text-muted-foreground"
                      }`}
                    >
                      <User className="h-4 w-4 mb-1" />
                      <span className="text-xs">Patient</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSelect("doctor")}
                      className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        formData.role === "doctor"
                          ? "border-primary bg-primary/5 text-primary shadow-sm font-semibold"
                          : "border-border bg-card hover:bg-accent text-muted-foreground"
                      }`}
                    >
                      <Shield className="h-4 w-4 mb-1" />
                      <span className="text-xs">Doctor / Provider</span>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`pl-9 h-10 rounded-xl bg-background/50 border text-sm ${
                        errors.name
                          ? "border-destructive focus-visible:ring-destructive"
                          : "border-border"
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs font-medium text-destructive">{errors.name}</p>
                  )}
                </div>

                {/* Age & Sex Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="e.g. 28"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className={`h-10 rounded-xl bg-background/50 border text-sm ${
                        errors.age
                          ? "border-destructive focus-visible:ring-destructive"
                          : "border-border"
                      }`}
                    />
                    {errors.age && (
                      <p className="text-xs font-medium text-destructive">{errors.age}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="sex">Gender</Label>
                    <select
                      id="sex"
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                      className={`w-full h-10 px-3 rounded-xl bg-background/50 border text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                        errors.sex
                          ? "border-destructive focus-visible:ring-destructive"
                          : "border-border"
                      }`}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.sex && (
                      <p className="text-xs font-medium text-destructive">{errors.sex}</p>
                    )}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. +1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`h-10 rounded-xl bg-background/50 border text-sm ${
                      errors.phone
                        ? "border-destructive focus-visible:ring-destructive"
                        : "border-border"
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-xs font-medium text-destructive">{errors.phone}</p>
                  )}
                </div>

                {/* Doctor Speciality (Conditional) */}
                <AnimatePresence>
                  {formData.role === "doctor" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1 overflow-hidden"
                    >
                      <Label htmlFor="speciality">Speciality</Label>
                      <select
                        id="speciality"
                        value={formData.speciality}
                        onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                        className={`w-full h-10 px-3 rounded-xl bg-background/50 border text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                          errors.speciality
                            ? "border-destructive focus-visible:ring-destructive"
                            : "border-border"
                        }`}
                      >
                        <option value="" disabled>
                          Select Speciality
                        </option>
                        <option value="General Medicine">General Medicine</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="Psychiatry">Psychiatry</option>
                      </select>
                      {errors.speciality && (
                        <p className="text-xs font-medium text-destructive">{errors.speciality}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Address */}
                <div className="space-y-1">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`pl-9 h-10 rounded-xl bg-background/50 border text-sm ${
                        errors.email
                          ? "border-destructive focus-visible:ring-destructive"
                          : "border-border"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs font-medium text-destructive">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`pl-9 h-10 rounded-xl bg-background/50 border text-sm ${
                        errors.password
                          ? "border-destructive focus-visible:ring-destructive"
                          : "border-border"
                      }`}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs font-medium text-destructive">{errors.password}</p>
                  )}
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className="space-y-1">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agree"
                      checked={formData.agree}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, agree: checked === true })
                      }
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="agree"
                      className="text-xs font-normal text-muted-foreground leading-snug cursor-pointer"
                    >
                      I agree to the{" "}
                      <Link href="#" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="#" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  {errors.agree && (
                    <p className="text-xs font-medium text-destructive">{errors.agree}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm mt-2"
                >
                  {isLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <>
                      Sign Up <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        </div>

        {/* Back Link */}
        <div className="z-10">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            ← Back to landing page
          </Link>
        </div>
      </div>
    </div>
  );
}
