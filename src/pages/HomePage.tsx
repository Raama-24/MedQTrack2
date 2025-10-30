import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import PatientJourney from '../components/PatientJourney';
import StaffSection from '../components/StaffSection';
import AboutSection from '../components/AboutSection';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <PatientJourney />
      <StaffSection />
      <AboutSection />
      <Footer />
    </div>
  );
}
