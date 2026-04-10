import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookAppointment';
import SuccessPage from "./pages/SuccessPage";
import LoginOptions from "./pages/LoginOptions";
import DoctorLogin from "./pages/DoctorLogin";
import Signup from "./pages/Signup";
import DoctorDashboard from './pages/DoctorDashboard';
import TrackToken from './pages/TrackToken';
import HospitalList from './pages/HospitalList';
import HospitalDetail from './pages/HospitalDetail';

import BedAvailability from './pages/BedAvailability';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/hospitals" element={<HospitalList />} />
        <Route path="/hospital/:id" element={<HospitalDetail />} />
        <Route path="/loginoptions" element={<LoginOptions />} />
        <Route path="/doctorlogin" element={<DoctorLogin />} />
        <Route path="/doctordashboard" element={< DoctorDashboard />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/beds" element={<BedAvailability />} />
        <Route path="/track" element={<TrackToken />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/book" element={<BookingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
