import Hero from '@/Components/Hero';
import WhySection from '@/Components/WhySection';
import FacultiesSection from '@/Components/FacultiesSection';
import StatsSection from '@/Components/StatsSection';
import QuoteSection from '@/Components/QuoteSection';
import CTASection from '@/Components/CTASection';

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