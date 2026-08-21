import {
  Users,
  Brain,
  AlertTriangle,
} from "lucide-react";

import StatCard from "./StatCard";

interface StatsGridProps {
  role: "admin" | "doctor" | "patient";
  summary: any;
}

export default function StatsGrid({
  role,
  summary,
}: StatsGridProps) {

  if (role === "doctor") {
    return (
      <div className="grid gap-6 md:grid-cols-3">

        <StatCard
          title="Assigned Patients"
          value={String(summary?.total_patients ?? 0)}
          icon={Users}
          color="bg-blue-600"
        />

        <StatCard
          title="Predictions"
          value={String(summary?.total_predictions ?? 0)}
          icon={Brain}
          color="bg-green-600"
        />

        <StatCard
          title="High Risk Patients"
          value={String(summary?.high_risk_patients ?? 0)}
          icon={AlertTriangle}
          color="bg-red-600"
        />

      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className="grid gap-6 md:grid-cols-4">

        <StatCard
          title="Doctors"
          value={String(summary?.total_doctors ?? 0)}
          icon={Users}
          color="bg-blue-600"
        />

        <StatCard
          title="Patients"
          value={String(summary?.total_patients ?? 0)}
          icon={Users}
          color="bg-green-600"
        />

        <StatCard
          title="Predictions"
          value={String(summary?.total_predictions ?? 0)}
          icon={Brain}
          color="bg-purple-600"
        />

        <StatCard
          title="Assignments"
          value={String(summary?.total_assignments ?? 0)}
          icon={AlertTriangle}
          color="bg-orange-600"
        />

      </div>
    );
  }

  return null;
}