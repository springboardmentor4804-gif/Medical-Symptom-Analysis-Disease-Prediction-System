import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import BackgroundUI from "../components/BackgroundUI";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "MedAssist AI - Symptom Checker & Patient Profile",
  description: "Secure medical symptom checker and patient management system.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('medassist-theme-mode') || localStorage.getItem('vitals-theme-mode');
                  var resolvedTheme = storedTheme === 'dark' || storedTheme === 'light'
                    ? storedTheme
                    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  if (resolvedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  document.documentElement.style.colorScheme = resolvedTheme;
                  document.documentElement.dataset.themeMode = resolvedTheme;
                } catch(e) {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                  document.documentElement.dataset.themeMode = 'light';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased font-sans relative selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
        <ThemeProvider>
          <AuthProvider>
            <BackgroundUI />
            <Navbar />
            <main className="flex-1 flex flex-col relative z-0">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
