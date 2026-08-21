import { Star } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Rahul Sharma",
      role: "Student",
      feedback:
        "MedAssist-AI helped me understand my symptoms quickly before visiting a doctor. The interface is simple and easy to use.",
    },
    {
      name: "Priya Nair",
      role: "Working Professional",
      feedback:
        "The medicine information feature is very helpful. It provides clear details and precautions in one place.",
    },
    {
      name: "Arun Kumar",
      role: "Healthcare Enthusiast",
      feedback:
        "A clean and modern healthcare platform with AI-powered guidance. Looking forward to more features!",
    },
  ];

  return (
    <section
    
      id="testimonials"
      className="py-20 bg-gray-50 px-6"
    >
      <div 
      className="max-w-7xl mx-auto">

        <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
          What Our Users Say
        </h2>

        <p className="text-center text-gray-600 mb-14">
          Feedback from users who explored MedAssist-AI.
        </p>

        <div data-aos="fade-right"
        className="grid md:grid-cols-3 gap-8">

          {testimonials.map((item, index) => (
            <div
              key={index}
              data-aos="fade-up"
              className="bg-white rounded-xl shadow-lg p-8 hover:-translate-y-2 transition duration-300"
            >
              <div className="flex text-yellow-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>

              <p className="text-gray-600 italic leading-7">
                "{item.feedback}"
              </p>

              <div className="mt-6">
                <h4 className="font-semibold text-gray-600">
                  {item.name}
                </h4>

                <p className="text-gray-500 text-sm">
                  {item.role}
                </p>
              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}