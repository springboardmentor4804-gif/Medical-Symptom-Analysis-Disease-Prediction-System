/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { API_URL } from "@/config";
import { useState, useEffect } from "react";
import { UserData } from "@/app/dashboard/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Save,
  User,
  Phone,
  ShieldCheck,
  HeartHandshake,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface ProfileProps {
  user: UserData;
  onUpdate: (updatedUser: UserData) => void;
}

export default function ProfileManagement({ user, onUpdate }: ProfileProps) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    age: user.age || 30,
    sex: user.sex || "male",
    weight: user.weight || 70,
    height: user.height || 170,
    bloodType: user.bloodType || "O+",
    allergies: user.allergies || [],
    chronicConditions: user.chronicConditions || [],
    medications: user.medications || [],
    emergencyContactName: user.emergencyContactName || "",
    emergencyContactRelationship: user.emergencyContactRelationship || "",
    emergencyContactPhone: user.emergencyContactPhone || "",
  });

  // Local state for comma-separated text inputs
  const [allergiesText, setAllergiesText] = useState("");
  const [conditionsText, setConditionsText] = useState("");
  const [medicationsText, setMedicationsText] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      age: user.age || 30,
      sex: user.sex || "male",
      weight: user.weight || 70,
      height: user.height || 170,
      bloodType: user.bloodType || "O+",
      allergies: user.allergies || [],
      chronicConditions: user.chronicConditions || [],
      medications: user.medications || [],
      emergencyContactName: user.emergencyContactName || "",
      emergencyContactRelationship: user.emergencyContactRelationship || "",
      emergencyContactPhone: user.emergencyContactPhone || "",
    });

    setAllergiesText(user.allergies ? user.allergies.join(", ") : "");
    setConditionsText(user.chronicConditions ? user.chronicConditions.join(", ") : "");
    setMedicationsText(user.medications ? user.medications.join(", ") : "");
  }, [user]);

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const fields = [
      formData.name,
      formData.phone,
      formData.age,
      formData.sex,
      formData.weight,
      formData.height,
      formData.bloodType,
      formData.allergies.length > 0 ? "yes" : "",
      formData.chronicConditions.length > 0 ? "yes" : "",
      formData.medications.length > 0 ? "yes" : "",
      formData.emergencyContactName,
      formData.emergencyContactPhone,
    ];
    const filledFields = fields.filter((f) => f !== undefined && f !== null && f !== "").length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const profileCompletion = calculateCompletion();

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (saveSuccess) setSaveSuccess(false);
  };

  const handleCommaInputBlur = (
    field: "allergies" | "chronicConditions" | "medications",
    textValue: string,
  ) => {
    const arrayVal = textValue
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    setFormData((prev) => ({ ...prev, [field]: arrayVal }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    // Final sync of chip fields
    const finalAllergies = allergiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const finalConditions = conditionsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const finalMedications = medicationsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      allergies: finalAllergies,
      chronicConditions: finalConditions,
      medications: finalMedications,
    };

    try {
      const storedUserStr = localStorage.getItem("user");
      if (!storedUserStr) return;
      const parsedUser = JSON.parse(storedUserStr);
      const token = parsedUser.token;
      const isDoctor = parsedUser.role === "doctor";

      const endpoint = isDoctor
        ? `${API_URL}/api/auth/patients/${user._id}`
        : `${API_URL}/api/auth/me`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedData = await response.json();
        if (!isDoctor) {
          const newLocalStorageUser = { ...parsedUser, ...updatedData };
          localStorage.setItem("user", JSON.stringify(newLocalStorageUser));
        }
        onUpdate(updatedData);
        setSaveSuccess(true);
        toast.success("Profile updated successfully!");
        // Clear success message after 4 seconds
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not reach backend server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
          Patient Profile
        </h2>
        <p className="text-sm text-slate-500">
          Manage your personal and medical information used by MedAssist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Patient Overview Card */}
        <Card className="border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col justify-between h-fit">
          <div>
            <div className="h-28 bg-gradient-to-tr from-blue-600 to-indigo-600 relative" />
            <div className="px-6 pb-6 relative">
              <div className="flex justify-between items-end -translate-y-10">
                <div className="h-20 w-20 rounded-2xl border-4 border-white dark:border-slate-900 bg-blue-50 dark:bg-slate-850 flex items-center justify-center text-blue-600 dark:text-blue-450 font-bold text-3xl shadow-sm">
                  {formData.name
                    ? formData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)
                    : "P"}
                </div>
                <span className="bg-blue-600/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Patient
                </span>
              </div>

              <div className="space-y-1 -mt-4">
                <h3 className="text-lg font-bold text-slate-850 dark:text-white">
                  {formData.name || "Abhijeet"}
                </h3>
                <p className="text-xs text-slate-400 capitalize">
                  {formData.age} Years Old · {formData.sex}
                </p>
              </div>

              {/* Compact Medical Summary Grid */}
              <div className="grid grid-cols-3 gap-3 border-t border-b border-slate-100 dark:border-slate-800 py-4 my-5">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Blood Type
                  </p>
                  <p className="text-base font-extrabold text-blue-600 dark:text-blue-450 mt-0.5">
                    {formData.bloodType}
                  </p>
                </div>
                <div className="text-center border-l border-r border-slate-150 dark:border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Weight
                  </p>
                  <p className="text-base font-extrabold text-slate-850 dark:text-white mt-0.5">
                    {formData.weight} kg
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Height
                  </p>
                  <p className="text-base font-extrabold text-slate-855 dark:text-white mt-0.5">
                    {formData.height} cm
                  </p>
                </div>
              </div>

              {/* Profile Completion Bar */}
              <div className="space-y-2 mt-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-350">
                    Profile Completion
                  </span>
                  <span className="font-black text-blue-600 dark:text-blue-450">
                    {profileCompletion}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-450 leading-relaxed mt-1">
                  Complete your medical profile to help MedAssist provide more relevant assessments.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex items-center gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            <span className="font-medium">Registered with MedAssist security protocols</span>
          </div>
        </Card>

        {/* Right Side: Form Sections */}
        <Card className="lg:col-span-2 border-apple shadow-apple bg-white dark:bg-slate-900 rounded-3xl">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Personal Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <User className="h-4 w-4 text-blue-500" /> Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-name"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 h-12 text-sm focus:border-slate-350 focus:ring-0 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-email"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="rounded-2xl bg-slate-100/40 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-700/40 h-12 text-sm cursor-not-allowed opacity-70"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-phone"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="edit-phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 h-12 text-sm focus:border-slate-350 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-sex"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Gender
                    </Label>
                    <select
                      id="edit-sex"
                      value={formData.sex}
                      onChange={(e) => handleInputChange("sex", e.target.value)}
                      className="w-full h-12 px-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-sm text-slate-700 dark:text-slate-300 focus:border-slate-350 focus-visible:outline-none focus-visible:ring-0 transition-colors"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-age"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Age (Years)
                    </Label>
                    <Input
                      id="edit-age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", Number(e.target.value))}
                      className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 h-12 text-sm focus:border-slate-350 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Medical Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <FileText className="h-4 w-4 text-blue-500" /> Medical Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-blood"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Blood Type
                    </Label>
                    <select
                      id="edit-blood"
                      value={formData.bloodType}
                      onChange={(e) => handleInputChange("bloodType", e.target.value)}
                      className="w-full h-12 px-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-sm text-slate-700 dark:text-slate-300 focus:border-slate-350 focus-visible:outline-none focus-visible:ring-0 transition-colors"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-weight"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Weight (kg)
                    </Label>
                    <Input
                      id="edit-weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", Number(e.target.value))}
                      className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 h-12 text-sm focus:border-slate-350 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-height"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Height (cm)
                    </Label>
                    <Input
                      id="edit-height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => handleInputChange("height", Number(e.target.value))}
                      className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 h-12 text-sm focus:border-slate-350 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Known Allergies */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-allergies"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Known Allergies
                    </Label>
                    <Input
                      id="edit-allergies"
                      value={allergiesText}
                      onChange={(e) => setAllergiesText(e.target.value)}
                      onBlur={(e) => handleCommaInputBlur("allergies", e.target.value)}
                      placeholder="e.g. Peanuts, Penicillin (separated by commas)"
                      className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 h-12 text-sm focus:border-slate-350 transition-colors"
                    />
                    {formData.allergies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {formData.allergies.map((allergy, i) => (
                          <span
                            key={i}
                            className="bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-100/50 dark:border-rose-900/30"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Existing Medical Conditions */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-conditions"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Existing Medical Conditions
                    </Label>
                    <Input
                      id="edit-conditions"
                      value={conditionsText}
                      onChange={(e) => setConditionsText(e.target.value)}
                      onBlur={(e) => handleCommaInputBlur("chronicConditions", e.target.value)}
                      placeholder="e.g. Asthma, Hypertension (separated by commas)"
                      className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 h-12 text-sm focus:border-slate-350 transition-colors"
                    />
                    {formData.chronicConditions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {formData.chronicConditions.map((condition, i) => (
                          <span
                            key={i}
                            className="bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-100/50 dark:border-amber-900/30"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Current Medications */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-medications"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Current Medications
                    </Label>
                    <Input
                      id="edit-medications"
                      value={medicationsText}
                      onChange={(e) => setMedicationsText(e.target.value)}
                      onBlur={(e) => handleCommaInputBlur("medications", e.target.value)}
                      placeholder="e.g. Albuterol, Metformin (separated by commas)"
                      className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 h-12 text-sm focus:border-slate-350 transition-colors"
                    />
                    {formData.medications.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {formData.medications.map((med, i) => (
                          <span
                            key={i}
                            className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100/50 dark:border-emerald-900/30"
                          >
                            {med}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  This information may be used as context during your MedAssist health assessments.
                </p>
              </div>

              {/* Section 3: Emergency Contact */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <HeartHandshake className="h-4.5 w-4.5 text-blue-500" /> Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-emergency-name"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Contact Name
                    </Label>
                    <Input
                      id="edit-emergency-name"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 h-12 text-sm focus:border-slate-350 transition-colors"
                      placeholder="Full Name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-emergency-rel"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Relationship
                    </Label>
                    <Input
                      id="edit-emergency-rel"
                      value={formData.emergencyContactRelationship}
                      onChange={(e) =>
                        handleInputChange("emergencyContactRelationship", e.target.value)
                      }
                      className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 h-12 text-sm focus:border-slate-350 transition-colors"
                      placeholder="e.g. Spouse, Parent, Sibling"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-emergency-phone"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="edit-emergency-phone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                      className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 h-12 text-sm focus:border-slate-350 transition-colors"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>
              </div>

              {/* Form Footer Action Area */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {saveSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-450 flex items-center gap-1 animate-fade-in">
                    <CheckCircle2 className="h-4 w-4" /> Profile updated successfully
                  </span>
                )}
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-semibold px-6 shadow-apple flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-xs"
                >
                  {saving ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white dark:border-slate-900 border-t-transparent" />
                  ) : (
                    <>
                      <Save className="h-4.5 w-4.5" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
