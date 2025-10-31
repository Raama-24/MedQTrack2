import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-poppins font-bold text-[#007BFF]">
            MedQTrack
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/beds"
              className="text-[#333333] hover:text-[#007BFF] transition-colors font-roboto"
            >
              Check Bed Availability
            </Link>
            <Link
              to="/track"
              className="text-[#333333] hover:text-[#007BFF] transition-colors font-roboto"
            >
              Track Your Token
            </Link>
            <Link
              to="/loginoptions"
              className="text-[#333333] hover:text-[#007BFF] transition-colors font-roboto"
            >
              Admin Login
            </Link>
            <Link
              to="/book"
              className="bg-[#007BFF] text-white px-6 py-2 rounded-lg hover:bg-[#0056b3] transition-colors font-roboto font-medium"
            >
              Book OPD Appointment
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
