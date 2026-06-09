import { Ticker }        from "@/components/Ticker";
import { Navbar }        from "@/components/Navbar";
import { Hero }          from "@/components/Hero";
import { StatsBar }      from "@/components/StatsBar";
import { Features }      from "@/components/Features";
import { CodeSection }   from "@/components/CodeSection";
import { CurveSection }  from "@/components/CurveSection";
import { DemoSection }   from "@/components/DemoSection";
import { Footer }        from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Ticker />
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <Features />
        <CodeSection />
        <CurveSection />
        <DemoSection />
      </main>
      <Footer />
    </>
  );
}
