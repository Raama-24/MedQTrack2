import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookAppointment';
import SuccessPage from "./pages/SuccessPage";
import LoginOptions from "./pages/LoginOptions";
import DoctorLogin from "./pages/DoctorLogin";
import Signup from "./pages/Signup";
import DoctorDashboard from './pages/DoctorDashboard';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
          <Route path="/loginoptions" element={<LoginOptions />} />
            <Route path="/doctorlogin" element={<DoctorLogin role="doctor" />} />
            <Route path="/doctordashboard" element={< DoctorDashboard />}/>
            <Route path="/signup" element={<Signup />} />
        <Route path="/beds" element={<div className="min-h-screen flex items-center justify-center"><p className="text-2xl">Bed Availability Page</p></div>} />
        <Route path="/track" element={<div className="min-h-screen flex items-center justify-center"><p className="text-2xl">Track Token Page</p></div>} />
        <Route path="/book" element={<BookingPage />} />
<Route path="/success" element={<SuccessPage />} />

        <Route path="/admin-login" element={<div className="min-h-screen flex items-center justify-center"><p className="text-2xl">Admin Login Page</p></div>} />
      </Routes>
    </Router>
  );
}

export default App;
