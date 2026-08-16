import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import UseCases from "@/components/UseCases";
import Portal from "@/components/Portal";
import Dashboard from "@/components/Dashboard";
import Process from "@/components/Process";
import WhyUs from "@/components/WhyUs";
import Pilot from "@/components/Pilot";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Landing() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <UseCases />
        <Portal />
        <Dashboard />
        <Process />
        <WhyUs />
        <Pilot />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
