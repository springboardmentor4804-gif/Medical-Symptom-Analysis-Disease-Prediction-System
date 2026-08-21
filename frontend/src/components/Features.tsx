import {
  Brain,
  Pill,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <Brain size={40} />,
      title: "AI Symptom Checker",
      description:
        "Analyze symptoms intelligently and receive possible health insights.",
    },
    {
      icon: <Pill size={40} />,
      title: "Medicine Information",
      description:
        "Access medicine usage, dosage, precautions, and side effects.",
    },
    {
      icon: <Stethoscope size={40} />,
      title: "Doctor Recommendation",
      description:
        "Get guidance on the right specialist based on your symptoms.",
    },
    {
      icon: <ShieldCheck size={40} />,
      title: "Reliable & Secure",
      description:
        "Built with user privacy and secure healthcare practices in mind.",
    },
  ];

  return (
          <section
        id="features"
        
        className="bg-gray-50 py-20 px-6"
      >
      <div className="max-w-7xl mx-auto">

        <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
          Our Features
        </h2>

        <p className="text-gray-600 text-center mb-12">
          Powerful AI tools designed to make healthcare guidance faster,
          smarter, and more accessible.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          {features.map((feature, index) => (
            <div
              key={index}
              data-aos="zoom-in"
              data-aos-delay={index * 100}
              className="bg-white rounded-xl shadow-md p-8 text-center hover:-translate-y-2 hover:shadow-xl transition duration-300"
>
              <div className="flex justify-center text-green-600 mb-5">
                {feature.icon}
              </div>

              <h3 className="text-gray-900 font-semibold mb-3">
                {feature.title}
              </h3>

              <p className="text-gray-600 text-sm leading-7">
                {feature.description}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}