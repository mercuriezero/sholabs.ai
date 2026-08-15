import "@/App.css";
import { Toaster } from "sonner";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Portal from "@/components/Portal";
import Stats from "@/components/Stats";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

function App() {
  return (
    <div className="App">
      <Nav />
      <main>
        <Hero />
        <Portal />
        <Stats />
        <FAQ />
      </main>
      <Footer />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default App;
