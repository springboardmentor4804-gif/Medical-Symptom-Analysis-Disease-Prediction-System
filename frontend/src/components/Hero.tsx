import Image from "next/image";

export default function Hero() {
  return (
      <section 
        
        className="bg-slate-50"
      >
      <div className="mx-auto flex max-w-7xl flex-col-reverse items-center justify-between gap-12 px-6 py-20 md:flex-row">

        {/* Left Side */}
        <div 
  data-aos="fade-right"
  className="max-w-xl"
>

          <p data-aos="fade-down"
          className="mb-4 font-semibold text-blue-600">
            Welcome to MedAssist-AI
          </p>

          <h1 
  data-aos="fade-right"
  data-aos-delay="200"
  className="mb-6 text-5xl font-bold leading-tight text-slate-900"
>
            AI-Powered Healthcare
            <br />
            Designed for Everyone
          </h1>

          <p
  data-aos="fade-left"
  data-aos-delay="300"
  className="mb-8 text-lg text-slate-600"
>
            Get instant health insights, securely manage medical records,
            and connect with healthcare professionals through intelligent
            AI assistance.
          </p>

          <div 
  data-aos="zoom-in"
  data-aos-delay="400"
  className="flex gap-4"
>

            <button className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
              Get Started
            </button>

            <button className="rounded-lg border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-100 text-slate-700">
              Learn More
            </button>

          </div>

        </div>

        {/* Right Side */}

        <Image
  data-aos="fade-left"
  data-aos-delay="300"
  src="/doctor.jpg"
  alt="Doctor"
  width={500}
  height={500}
  priority
/>

      </div>
    </section>
  );
}