import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Calendar, Upload, User, FileText, Phone, AlertCircle } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  uid: string;
}

const BookingPage: React.FC = () => {
  const [patientName, setPatientName] = useState("");
  const [patientProblem, setPatientProblem] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [tokenInfo, setTokenInfo] = useState<{ token: number; waitTime: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Fetch doctors from Firestore
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const snapshot = await getDocs(collection(db, "doctors"));
        const doctorList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "Unnamed Doctor",
          specialization: doc.data().specialization || "General",
          uid: doc.data().uid || "",
        }));
        setDoctors(doctorList);
      } catch (err) {
        console.error("Error fetching doctors:", err);
      }
    };
    fetchDoctors();
  }, []);

  // Estimated wait time = 15 mins * patients ahead
  const calculateWaitTime = (queuePosition: number) => queuePosition * 15;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!patientName || !patientProblem || !age || !phone || !doctorName) {
      setError("Please fill all fields and select a doctor.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      const selectedDoctor = doctors.find((d) => d.name === doctorName);
      const token = Math.floor(1000 + Math.random() * 9000);
      const waitTime = calculateWaitTime(Math.floor(Math.random() * 5)); // mock queue length

      await addDoc(collection(db, "bookings"), {
        patientName,
        patientProblem,
        age,
        phone,
        doctorName,
        doctorId: selectedDoctor?.uid || "",
        specialization: selectedDoctor?.specialization || "General",
        token,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      setTokenInfo({ token, waitTime });
      setSuccessMessage("Appointment booked successfully!");

      setPatientName("");
      setPatientProblem("");
      setAge("");
      setPhone("");
      setDoctorName("");

      setTimeout(() => {
        navigate(`/success?token=${token}&name=${encodeURIComponent(patientName)}`);
      }, 2000);
    } catch (err) {
      console.error("Booking failed:", err);
      setError("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Book Appointment</h1>
          </div>

          {/* Success Message */}
          {successMessage && tokenInfo && (
            <div className="mb-6 p-6 bg-green-50 border-l-4 border-green-500 rounded-lg">
              <h3 className="font-semibold text-green-800 text-lg mb-2">{successMessage}</h3>
              <div className="space-y-1 text-green-700">
                <p className="text-xl font-bold">Token Number: {tokenInfo.token}</p>
                <p>Estimated Wait Time: {tokenInfo.waitTime} minutes</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter patient name"
                  required
                />
              </div>
            </div>

            {/* Age and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Age"
                  min="1"
                  max="120"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
              <select
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.name}>
                    Dr. {doctor.name} — {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>

            {/* Problem Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={patientProblem}
                  onChange={(e) => setPatientProblem(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your problem..."
                  rows={4}
                  required
                />
              </div>
            </div>

            {/* Upload Past Reports */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Past Reports (Optional)
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop your reports
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Booking..." : "Book Appointment"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
