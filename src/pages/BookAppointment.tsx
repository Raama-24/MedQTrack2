import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // adjust path if needed

const BookingPage: React.FC = () => {
  const [patientName, setPatientName] = useState("");
  const [patientProblem, setPatientProblem] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [doctor, setDoctor] = useState(""); // new
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]); // new
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // 🔹 Fetch all doctors from Firestore
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const snapshot = await getDocs(collection(db, "doctors"));
        const doctorList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "Unnamed Doctor",
        }));
        setDoctors(doctorList);
      } catch (err) {
        console.error("Error fetching doctors:", err);
      }
    };
    fetchDoctors();
  }, []);

  // 🔹 Handle booking submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!patientName || !patientProblem || !age || !phone || !doctor) {
      setError("Please fill out all fields, including doctor selection.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = Math.floor(1000 + Math.random() * 9000);

      const docRef = await addDoc(collection(db, "bookings"), {
        patientName,
        patientProblem,
        age,
        phone,
        doctor, // store doctor name
        token,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      setIsLoading(false);
      navigate(`/success?token=${token}&name=${encodeURIComponent(patientName)}&id=${docRef.id}`);
    } catch (err) {
      console.error("Booking failed:", err);
      setIsLoading(false);
      setError("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">
        Book Your Appointment
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Select your doctor and fill out your details to book an appointment.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-xl border border-gray-100"
      >
        {/* Name */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">Full Name</label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            placeholder="e.g., Jane Doe"
            disabled={isLoading}
          />
        </div>

        {/* Age */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            placeholder="e.g., 28"
            disabled={isLoading}
          />
        </div>

        {/* Phone */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            placeholder="e.g., +91 9876543210"
            disabled={isLoading}
          />
        </div>

        {/* Doctor Selection */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">
            Which Doctor Would You Like to Consult?
          </label>
          <select
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            disabled={isLoading || doctors.length === 0}
          >
            <option value="">Select a Doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Problem */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">
            Describe Your Health Problem
          </label>
          <textarea
            value={patientProblem}
            onChange={(e) => setPatientProblem(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            placeholder="e.g., I've had a bad headache and fever for two days..."
            disabled={isLoading}
          ></textarea>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {isLoading ? "Booking, please wait..." : "Book My Appointment"}
        </button>
      </form>
    </div>
  );
};

export default BookingPage;
