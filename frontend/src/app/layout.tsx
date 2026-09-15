import type { Metadata } from "next";
import "./globals.css";
import AOSProvider from "@/components/AOSProvider";

export const metadata: Metadata = {
  title: "MedAssistAI | Your AI Healthcare Companion",
  description:
    "AI-powered healthcare assistant for smart medical guidance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AOSProvider>
          {children}
        </AOSProvider>
      </body>
    </html>
  );
}