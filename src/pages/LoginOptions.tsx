import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

export default function LoginOptions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
        <div className="max-w-4xl w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Access Your Dashboard</h2>
            <p className="text-gray-600 mt-3 text-lg">Please select your role to continue to the portal.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Admin Login Card */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => navigate("/beds")}
              className="group bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all text-left flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-8 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h3>
              <p className="text-gray-500 mb-8">Manage bed assignments, monitor ward status, and handle operational overrides.</p>
              <div className="w-full py-4 bg-gray-50 rounded-2xl font-bold text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                Enter Admin Portal
              </div>
            </motion.button>

            {/* Doctor Login Card */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate("/doctorlogin")}
              className="group bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-green-500/10 transition-all text-left flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center text-green-600 mb-8 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Doctor Login</h3>
              <p className="text-gray-500 mb-8">View patient schedules, manage appointments, and update medical consultations.</p>
              <div className="w-full py-4 bg-gray-50 rounded-2xl font-bold text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                Enter Doctor Portal
              </div>
            </motion.button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
