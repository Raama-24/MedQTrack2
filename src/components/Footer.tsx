import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#333333] text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="font-roboto text-gray-300 mb-4 md:mb-0">
            © 2025 MedQTrack. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              to="/"
              className="text-gray-300 hover:text-white transition-colors font-roboto"
            >
              Home
            </Link>
            <Link
              to="/book"
              className="text-gray-300 hover:text-white transition-colors font-roboto"
            >
              Book
            </Link>
            <Link
              to="/admin-login"
              className="text-gray-300 hover:text-white transition-colors font-roboto"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
