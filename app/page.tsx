import { getSpecialties, getReviews } from "@/lib/db";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { TrustBar } from "@/components/landing/TrustBar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ForPatients, ForProviders } from "@/components/landing/Audiences";
import { Specialties } from "@/components/landing/Specialties";
import { Testimonials } from "@/components/landing/Testimonials";
import { FinalCta } from "@/components/landing/FinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default async function Home() {
  const [specialties, reviews] = await Promise.all([getSpecialties(), getReviews()]);
  return (
    <>
      <LandingNav />
      <main>
        <LandingHero />
        <TrustBar />
        <HowItWorks />
        <ForPatients />
        <ForProviders />
        <Specialties specialties={specialties} />
        <Testimonials reviews={reviews} />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
