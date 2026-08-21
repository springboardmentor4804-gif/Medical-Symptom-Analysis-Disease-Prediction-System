"use client";

import { useEffect, type ReactNode } from "react";
import AOS from "aos";

type AOSProviderProps = {
  children: ReactNode;
};

export default function AOSProvider({ children }: AOSProviderProps) {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return <>{children}</>;
}