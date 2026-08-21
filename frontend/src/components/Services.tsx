import {
  Activity,
  HeartPulse,
  Pill,
  UserRoundCheck,
} from "lucide-react";

export default function Services() {
  const services = [
    {
      icon: <Activity size={40} />,
      title: "Health Assessment",
      description:
        "Analyze symptoms and receive AI-powered health guidance in seconds.",
    },
    {
      icon: <HeartPulse size={40} />,
      title: "Disease Prediction",
      description:
        "Predict possible health conditions based on symptoms and medical insights.",
    },
    {
      icon: <Pill size={40} />,
      title: "Medicine Guidance",
      description:
        "Get medicine information including dosage, precautions, and side effects.",
    },
    {
      icon: <UserRoundCheck size={40} />,
      title: "Doctor Consultation",
      description:
        "Find the right specialist for your medical concern quickly and easily.",
    },
  ];

  return (
    <section
      id="services"
      className="py-20 bg-white px-6"
    >
      <div className="max-w-7xl mx-auto">

        <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
          Our Services
        </h2>

        <p className="text-center text-gray-600 mb-14">
          Intelligent healthcare solutions powered by Artificial Intelligence.
        </p>

        <div className="grid md:grid-cols-2 gap-8">

          {services.map((service, index) => (
            <div
              key={index}
              data-aos="fade-up"
              className="flex gap-5 bg-gray-50 rounded-xl p-8 shadow hover:shadow-xl transition"
            >
              <div className="text-green-600">
                {service.icon}
              </div>

              <div>
                <h3 className="text-gray-900 font-semibold mb-2">
                  {service.title}
                </h3>

                <p className="text-gray-600 leading-7">
                  {service.description}
                </p>
              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}