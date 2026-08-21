import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Highlights } from "@/components/landing/Highlights";
import { Workflow } from "@/components/landing/Workflow";
import { WhyChoose } from "@/components/landing/WhyChoose";
import { Showcase } from "@/components/landing/Showcase";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-x-hidden bg-background">
        <Hero />
        <Highlights />
        <Workflow />
        <WhyChoose />
        <Showcase />
        <Testimonials />
        <FAQ />
        <Footer />
      </main>
    </>
  );
}
