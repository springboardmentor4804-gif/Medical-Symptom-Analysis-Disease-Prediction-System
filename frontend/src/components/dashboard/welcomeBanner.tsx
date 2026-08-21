interface WelcomeBannerProps {
  name: string;
  role: string;
  message: string;
}

export default function WelcomeBanner({
  name,
  role,
  message,
}: WelcomeBannerProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-sky-600 p-8 text-white shadow-lg">

      <p className="text-sm uppercase tracking-widest opacity-80">
        {role}
      </p>

      <h1 className="mt-2 text-4xl font-bold">
        Welcome Back, {name} 👋
      </h1>

      <p className="mt-3 text-blue-100 text-lg">
        {message}
      </p>

      <div className="mt-6 inline-block rounded-lg bg-white/20 px-4 py-2 text-sm">
        📅 {today}
      </div>

    </div>
    
  );
}