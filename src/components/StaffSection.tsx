import { Link } from 'react-router-dom';
import { FaCheckCircle, FaChartLine } from 'react-icons/fa';

export default function StaffSection() {
  const features = [
    'Instant access to patient medical history',
    'AI-generated patient summaries',
    'Real-time queue and bed management',
    'Secure data handling and compliance'
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-4xl font-poppins font-bold text-[#333333] mb-6">
              For Healthcare Professionals
            </h2>
            <p className="text-lg text-[#333333] font-roboto mb-8 leading-relaxed">
              Access patient data, AI-powered summaries, and real-time queue management to optimize your practice.
            </p>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <FaCheckCircle className="text-[#007BFF] text-2xl flex-shrink-0 mt-1" />
                  <p className="text-[#333333] font-roboto text-lg">{feature}</p>
                </div>
              ))}
            </div>

            <Link
              to="/admin-login"
              className="inline-flex items-center gap-2 bg-[#007BFF] text-white px-8 py-3 rounded-lg hover:bg-[#0056b3] transition-colors font-roboto font-medium text-lg"
            >
              Doctor Portal
              <FaCheckCircle />
            </Link>
          </div>

          <div className="flex-1">
            <div className="bg-gray-100 rounded-xl p-12 shadow-md border border-gray-200 h-96 flex flex-col items-center justify-center">
              <FaChartLine className="text-[#007BFF] text-8xl mb-6" />
              <h3 className="text-2xl font-poppins font-bold text-[#333333] mb-3">
                Advanced Dashboard
              </h3>
              <p className="text-[#333333] font-roboto text-lg text-center">
                Manage care efficiently
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
