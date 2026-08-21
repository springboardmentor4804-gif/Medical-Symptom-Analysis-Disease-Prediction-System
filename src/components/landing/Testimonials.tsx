"use client";

import { AnimatedSection, AnimatedStagger, AnimatedStaggerItem } from "./AnimatedSection";
import { Star } from "lucide-react";
import avatar1 from "@/assets/avatar-1.png";
import avatar2 from "@/assets/avatar-2.png";
import avatar3 from "@/assets/avatar-3.png";

const testimonials = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Cardiologist",
    image: avatar1,
    content:
      "MedAssist AI has transformed how our team monitors patients. The predictive insights help us catch issues before they escalate, and the interface is incredibly intuitive.",
    rating: 5,
  },
  {
    name: "James Richardson",
    role: "Health System Administrator",
    image: avatar2,
    content:
      "Implementing this platform reduced our administrative workload by 40%. Our providers now spend more time with patients and less time navigating records.",
    rating: 5,
  },
  {
    name: "Emily Chen",
    role: "Patient Advocate",
    image: avatar3,
    content:
      "The AI assistant makes managing my family's health so much simpler. Appointment reminders and medication alerts keep us on track every single day.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="section-padding bg-muted/30">
      <div className="container-landing">
        <AnimatedSection className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-semibold text-secondary">
            Testimonials
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Trusted by Healthcare Leaders
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            See how clinicians, administrators, and patients experience better care with MedAssist
            AI.
          </p>
        </AnimatedSection>

        <AnimatedStagger className="grid gap-6 md:grid-cols-3" staggerDelay={0.15}>
          {testimonials.map((testimonial) => (
            <AnimatedStaggerItem key={testimonial.name}>
              <div className="group relative h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5">
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-primary text-primary transition-transform duration-300 group-hover:scale-110"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>

                <p className="mb-6 text-foreground leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.image.src}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </AnimatedStaggerItem>
          ))}
        </AnimatedStagger>
      </div>
    </section>
  );
}
