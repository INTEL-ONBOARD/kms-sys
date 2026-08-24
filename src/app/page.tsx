import Hero from '@/components/landing/Hero';
import WhySection from '@/components/landing/WhySection';
import FacultiesSection from '@/components/landing/FacultiesSection';
import StatsSection from '@/components/landing/StatsSection';
import QuoteSection from '@/components/landing/QuoteSection';
import CTASection from '@/components/landing/CTASection';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Main hero image section */}
      <Hero />
      
      {/* Introduction text section */}
      <WhySection />
      
      {/* Schools and faculties grid */}
      <FacultiesSection />
      
      {/* University statistics */}
      <StatsSection />
      
      {/* Highlighted quote block */}
      <QuoteSection />
      
      {/* Call to action button section */}
      <CTASection />
    </div>
  );
}