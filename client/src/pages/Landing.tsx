import {
  CategorySection,
  ClosingCallToAction,
  FeaturedCourse,
  Footer,
  Header,
  HeroSection,
  HowItWorks,
  ReviewsSection,
  TimeFitSection,
  TrustBand,
} from '../components/landing'
export function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-band text-on-band-muted">
      <Header />
      <main>
        <HeroSection />
        <TrustBand />
        <FeaturedCourse />
        <CategorySection />
        <ReviewsSection />
        <TimeFitSection />
        <HowItWorks />
        <ClosingCallToAction />
      </main>
      <Footer />
    </div>
  )
}
