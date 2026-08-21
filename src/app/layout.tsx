import type { Metadata } from "next";
import Providers from "./providers";
import "../styles.css";

export const metadata: Metadata = {
  title: "MedAssist AI - Healthcare Management Platform",
  description:
    "MedAssist AI is an AI-powered healthcare ecosystem designed to simplify patient care, enhance medical workflows, and provide intelligent health insights.",
  authors: [{ name: "MedAssist AI" }],
  openGraph: {
    title: "MedAssist AI - Healthcare Management Platform",
    description:
      "AI-powered healthcare ecosystem designed to simplify patient care, enhance medical workflows, and provide intelligent health insights.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
