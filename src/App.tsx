import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/beds" element={<div className="min-h-screen flex items-center justify-center"><p className="text-2xl">Bed Availability Page</p></div>} />
        <Route path="/track" element={<div className="min-h-screen flex items-center justify-center"><p className="text-2xl">Track Token Page</p></div>} />
        <Route path="/book" element={<div className="min-h-screen flex items-center justify-center"><p className="text-2xl">Book Appointment Page</p></div>} />
        <Route path="/admin-login" element={<div className="min-h-screen flex items-center justify-center"><p className="text-2xl">Admin Login Page</p></div>} />
      </Routes>
    </Router>
  );
}

export default App;
