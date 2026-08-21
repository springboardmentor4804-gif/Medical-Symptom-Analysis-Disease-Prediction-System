export default function About() {
  return (
    <section
  id="about"
 
  className="bg-white py-20 px-6 md:px-16"
>
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

        {/* Left Side */}
        <div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            About <span className="text-green-600">MedAssist-AI</span>
          </h2>
        <div  data-aos="fade-right">
          
          <p className="text-gray-600 leading-8 mb-6">
            MedAssist-AI is an intelligent healthcare assistant designed
            to provide users with quick medical guidance using Artificial
            Intelligence. It helps users understand symptoms, explore
            possible health conditions, and receive reliable medical
            information in an easy and accessible way.
          </p>

          <p className="text-gray-600 leading-8">
            Our goal is to make healthcare support available anytime and
            anywhere while encouraging users to seek professional medical
            advice whenever necessary.
          </p>
        </div>
        </div>
        

        {/* Right Side */}
        
        <div data-aos="fade-left"
        className="grid grid-cols-2 gap-6">

          <div data-aos="zoom-in"
            data-aos-delay="100"
            className="bg-green-50 rounded-xl p-6 shadow hover:shadow-lg transition">
            <h3 className="text-3xl font-bold text-green-600">24/7</h3>
            <p className="mt-2 text-gray-700">
              AI Healthcare Assistance
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 shadow hover:shadow-lg transition">
            <h3 className="text-3xl font-bold text-blue-600">AI</h3>
            <p className="mt-2 text-gray-700">
              Symptom Analysis
            </p>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 shadow hover:shadow-lg transition">
            <h3 className="text-3xl font-bold text-purple-600">100+</h3>
            <p className="mt-2 text-gray-700">
              Medicines Database
            </p>
          </div>

          <div className="bg-red-50 rounded-xl p-6 shadow hover:shadow-lg transition">
            <h3 className="text-3xl font-bold text-red-600">Safe</h3>
            <p className="mt-2 text-gray-700">
              Secure User Experience
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}