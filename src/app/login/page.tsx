"use client";

import { API_URL } from "@/config";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Mail,
  Lock,
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

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
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
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrors({ server: data.message || "Invalid email or password." });
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
          <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-secondary/5 floating-slow" />
        </div>

        {/* Content Card container */}
        <div className="relative z-10 max-w-lg text-center text-white space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">Smarter Healthcare Begins Here</h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Experience the power of an AI-driven healthcare management platform that transforms
              clinical workflows and simplifies patient journeys.
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
                <p className="text-xs text-slate-400">Heart Analytics</p>
                <p className="text-lg font-bold">99.8% Accurate</p>
              </div>

              {/* Stat card 2 */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 text-left border border-white/5 floating">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white mb-2">
                  <Calendar className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-400">Next Event</p>
                <p className="text-sm font-semibold">Today, 2:30 PM</p>
              </div>
            </div>

            {/* AI Assistant block */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 text-left border border-white/5 flex items-center gap-4 floating-delayed">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Secure Health Ecosystem</p>
                <p className="text-xs text-slate-400">
                  HIPAA compliant and fully encrypted data handling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Form (Light theme color matching the landing page) */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-12 md:p-20 relative overflow-hidden bg-background text-foreground">
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
        <div className="my-auto py-12 z-10 max-w-md w-full mx-auto lg:mx-0">
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
                <h2 className="text-2xl font-bold text-foreground mb-3">Logged In Successfully!</h2>
                <p className="text-muted-foreground mb-8">
                  Welcome back to MedAssist AI. Redirecting you to your personalized dashboard...
                </p>
                <Link href="/dashboard" passHref legacyBehavior>
                  <Button className="w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-3">
                    Go to Dashboard
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Log in to account
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    New to MedAssist AI?{" "}
                    <Link href="/signup" className="text-primary hover:underline font-medium">
                      Sign up
                    </Link>
                  </p>
                </div>

                {errors.server && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold">
                    {errors.server}
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`pl-10 h-12 rounded-xl bg-background/50 border ${
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

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">
                      Password
                    </Label>
                    <Link href="#" className="text-xs text-primary hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`pl-10 h-12 rounded-xl bg-background/50 border ${
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

                {/* Remember Me checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.remember}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, remember: checked === true })
                    }
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal text-muted-foreground cursor-pointer"
                  >
                    Remember me for 30 days
                  </Label>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {isLoading ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <>
                      Log In <ArrowRight className="h-4 w-4" />
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
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground font-medium"
          >
            ← Back to landing page
          </Link>
        </div>
      </div>
    </div>
  );
}
