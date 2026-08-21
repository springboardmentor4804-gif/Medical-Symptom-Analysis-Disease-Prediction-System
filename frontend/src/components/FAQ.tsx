"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is MedAssistAI?",
    answer:
      "MedAssistAI is an AI-powered healthcare assistant that helps users with health guidance, symptom analysis, and medical information.",
  },
  {
    question: "Can MedAssistAI diagnose diseases?",
    answer:
      "No. MedAssistAI provides health insights and guidance but does not replace professional medical diagnosis.",
  },
  {
    question: "Is my health data secure?",
    answer:
      "Yes. We prioritize user privacy and ensure secure handling of healthcare information.",
  },
  {
    question: "Can I upload medical reports?",
    answer:
      "Yes. Users can upload reports and get AI-assisted explanations in an easy-to-understand format.",
  },
  {
    question: "Can I connect with doctors?",
    answer:
      "Yes. Future versions will support doctor consultation and appointment management features.",
  },
];

export default function FAQ() {

  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-gray-50">

      <div 
      className="max-w-4xl mx-auto px-6">

        <h2 className="text-4xl font-bold text-center text-gray-800">
          Frequently Asked Questions
        </h2>

        <div className="mt-10 space-y-4">

          {faqs.map((faq,index)=>(
            <div data-aos="fade-right"
              key={index}
              className="bg-white rounded-xl shadow p-5"
            >

              <button
                className="flex justify-between items-center w-full text-left"
                onClick={()=>setOpen(open===index ? null : index)}
              >

                <h3 className="font-semibold text-gray-900">
                  {faq.question}
                </h3>

                <ChevronDown
                  className={`transition ${
                    open===index ? "rotate-180" : ""
                  }`}
                />

              </button>


              {open===index && (
                <p className="mt-4 text-gray-600">
                  {faq.answer}
                </p>
              )}

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}