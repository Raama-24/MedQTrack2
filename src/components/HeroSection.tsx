import { Link } from 'react-router-dom';
import { FaUserMd, FaClock, FaHeartbeat } from 'react-icons/fa';

export default function HeroSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <h1 className="text-5xl font-poppins font-bold text-[#333333] mb-4">
              MedQTrack
            </h1>
            <h2 className="text-3xl font-poppins font-semibold text-[#007BFF] mb-6">
              Smarter, Faster Healthcare. No More Waiting.
            </h2>
            <p className="text-lg text-[#333333] font-roboto mb-8 leading-relaxed">
              Welcome to MedQTrack. Book appointments, check bed availability, and get seen faster.
            </p>
            <div className="flex gap-4">
              <Link
                to="/book"
                className="bg-[#007BFF] text-white px-8 py-3 rounded-lg hover:bg-[#0056b3] transition-colors font-roboto font-medium text-lg"
              >
                Book Appointment
              </Link>
              <Link
                to="/beds"
                className="border-2 border-[#007BFF] text-[#007BFF] px-8 py-3 rounded-lg hover:bg-[#007BFF] hover:text-white transition-colors font-roboto font-medium text-lg"
              >
                Check Beds
              </Link>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-poppins font-bold text-[#333333] mb-6">
                Why Trust Us?
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-[#007BFF] p-3 rounded-full">
                    <FaHeartbeat className="text-white text-2xl" />
                  </div>
                  <div>
                    <p className="text-2xl font-poppins font-bold text-[#333333]">1000+</p>
                    <p className="text-[#333333] font-roboto">Lives Saved</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-[#007BFF] p-3 rounded-full">
                    <FaClock className="text-white text-2xl" />
                  </div>
                  <div>
                    <p className="text-2xl font-poppins font-bold text-[#333333]">24/7</p>
                    <p className="text-[#333333] font-roboto">Service Available</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-[#007BFF] p-3 rounded-full">
                    <FaUserMd className="text-white text-2xl" />
                  </div>
                  <div>
                    <p className="text-2xl font-poppins font-bold text-[#333333]">50+</p>
                    <p className="text-[#333333] font-roboto">Specialist Doctors</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
