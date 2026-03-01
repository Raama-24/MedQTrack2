import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, where, onSnapshot } from "firebase/firestore";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Booking {
  id: string;
  token: number;
  patientName: string;
  patientProblem: string;
  age: number;
  phone: string;
  doctorId: string;
  status?: "pending" | "in_consultation" | "completed";
}

interface Doctor {
  id: string;
  uid: string;
  name: string;
  specialization: string;
}

const TrackToken: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [queue, setQueue] = useState<Booking[]>([]);
  const [patientToken, setPatientToken] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState(false);

  // Fetch all doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      const doctorSnap = await getDocs(collection(db, "doctors"));
      const docList = doctorSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setDoctors(docList);
    };
    fetchDoctors();
  }, []);

  // Fetch queue for selected doctor (live)
  useEffect(() => {
    if (!selectedDoctor) return;
    setLoading(true);

    const queueQuery = query(collection(db, "bookings"), where("doctorId", "==", selectedDoctor));

    const unsubscribe = onSnapshot(queueQuery, (snapshot) => {
      const allPatients = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Booking) }));
      allPatients.sort((a, b) => a.token - b.token);
      setQueue(allPatients);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDoctor]);

  const avgConsultTime = 7; // minutes per patient

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_consultation":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in_consultation":
        return <Clock className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Find number of patients ahead
  const patientsAhead =
    patientToken && queue.length > 0
      ? queue.filter((p) => p.token < Number(patientToken) && p.status !== "completed").length
      : 0;

  const estimatedWait = patientsAhead * avgConsultTime;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Track Your Token</h1>

        {/* Doctor select */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Select Doctor:</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="">-- Choose Doctor --</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.uid}>
                Dr. {doc.name} ({doc.specialization})
              </option>
            ))}
          </select>
        </div>

        {/* Patient token input */}
        {selectedDoctor && queue.length > 0 && (
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">
              Enter Your Token Number:
            </label>
            <input
              type="number"
              value={patientToken}
              onChange={(e) => setPatientToken(e.target.value ? Number(e.target.value) : "")}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Your token number"
            />
          </div>
        )}

        {/* Queue Table */}
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading queue...</div>
        ) : selectedDoctor ? (
          queue.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No patients in queue.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border-b">Token</th>
                  
                    <th className="p-2 border-b">Status</th>
                    <th className="p-2 border-b">Estimated Wait</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((p, index) => {
                    const isCurrentPatient = patientToken === p.token;
                    return (
                      <tr
                        key={p.id}
                        className={`border-b ${isCurrentPatient ? "bg-yellow-100 font-semibold" : ""}`}
                      >
                        <td className="p-2 text-blue-600 font-bold">#{p.token}</td>
                       
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              p.status
                            )}`}
                          >
                            {getStatusIcon(p.status)}
                            {(p.status || "pending").replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2">{index * avgConsultTime} mins</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Display estimated wait for current token */}
              {patientToken && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center text-blue-800 font-semibold">
                  Patients ahead of your token: {patientsAhead} <br />
                  Estimated wait: {estimatedWait} mins
                </div>
              )}
            </div>
          )
        ) : (
          <div className="text-gray-500 py-4">Please select a doctor to view the queue.</div>
        )}

        {/* Notification Prompt */}
        {selectedDoctor && queue.length > 0 && patientToken && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-700 mb-2">
              Do you want notifications on your phone when your turn is near?
            </p>
            <button
              onClick={() => setNotify(true)}
              disabled={notify}
              className={`px-4 py-2 rounded-lg text-white font-medium ${
                notify ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {notify ? "Notifications Enabled ✅" : "Enable Notifications"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackToken;
