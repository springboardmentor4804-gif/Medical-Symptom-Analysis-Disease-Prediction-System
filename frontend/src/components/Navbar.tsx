import Link from "next/link";

const navItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "#about" },
  { name: "Features", href: "#features" },
  { name: "Services", href: "#services" },
  { name: "Contact", href: "#contact" },
];


export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-600">
          🏥 MedAssist-AI
        </Link>

        {/* Navigation */}
        <nav className="hidden gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="font-medium text-slate-700 transition hover:text-blue-600"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Buttons */}
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium transition hover:bg-slate-100 bg-slate-50 text-slate-700"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}