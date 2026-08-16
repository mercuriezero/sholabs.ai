"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Portal from "@/components/Portal";
import Dashboard from "@/components/Dashboard";
import Process from "@/components/Process";
import WhyUs from "@/components/WhyUs";
import Pilot from "@/components/Pilot";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export default function Landing() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09 });
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute("href");
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        lenis.scrollTo(id, { offset: -72 });
      }
    };
    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Reveal><Process /></Reveal>
        <Portal />
        <Reveal><Dashboard /></Reveal>
        <Reveal><WhyUs /></Reveal>
        <Reveal><Pilot /></Reveal>
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
