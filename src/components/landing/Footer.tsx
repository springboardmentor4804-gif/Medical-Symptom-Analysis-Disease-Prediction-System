"use client";

import { Heart, Twitter, Linkedin, Github, Instagram } from "lucide-react";

const socialIcons = [
  { icon: Twitter, label: "Twitter" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Github, label: "GitHub" },
  { icon: Instagram, label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400 py-12">
      <div className="container-landing">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo & copyright */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Heart className="h-4.5 w-4.5" />
              </div>
              <span className="text-lg font-bold text-zinc-100">MedAssist AI</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              © {new Date().getFullYear()} MedAssist AI. All rights reserved.
            </p>
          </div>

          {/* Socials & Links */}
          <div className="flex flex-col items-center gap-4 md:items-end">
            <div className="flex gap-4">
              {socialIcons.map((social) => (
                <button
                  key={social.label}
                  type="button"
                  onClick={() => {}}
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 transition-all duration-300 hover:scale-110 hover:border-zinc-700 hover:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                >
                  <social.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <div className="flex gap-4 text-xs text-zinc-500">
              <button type="button" onClick={() => {}} className="hover:text-zinc-300">
                Privacy Policy
              </button>
              <button type="button" onClick={() => {}} className="hover:text-zinc-300">
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
