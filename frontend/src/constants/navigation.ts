import {
  LayoutDashboard,
  User,
  Stethoscope,
  BrainCircuit,
  FileText,
  Users,
  UserPlus,
  Link2,
  Settings,
  BarChart3,
} from "lucide-react";

export const patientNavigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    name: "Symptoms",
    href: "/symptoms",
    icon: Stethoscope,
  },
  {
    name: "AI Prediction",
    href: "/prediction",
    icon: BrainCircuit,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
];

export const doctorNavigation = [
  {
    name: "Dashboard",
    href: "/doctor/dashboard",
    icon: LayoutDashboard,
  },

  {
    name: "Patients",
    href: "/doctor/patients",
    icon: Users,
  },

  {
    name: "Reports",
    href: "/doctor/reports",
    icon: FileText,
  },

  {
    name: "Analytics",
    href: "/doctor/analytics",
    icon: BarChart3,
  },

  {
    name: "Profile",
    href: "/doctor/profile",
    icon: User,
  },
];

export const adminNavigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Doctors",
    href: "/admin/doctors",
    icon: UserPlus,
  },
  {
    name: "Patients",
    href: "/admin/patients",
    icon: Users,
  },
  {
    name: "Assignments",
    href: "/admin/assignment",
    icon: Link2,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    name: "Profile",
    href: "/admin/profile",
    icon: User,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];