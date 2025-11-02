import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Stethoscope,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Hourglass,
} from "lucide-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

interface Booking {
  id: string;
  token: number;
  patientName: string;
  patientProblem: string;
  age: number;
  phone: string;
  status?: "pending" | "in_consultation" | "completed";
}

interface DoctorEvent {
  id?: string; // firestore doc id
  doctorId: string;
  date: string; // YYYY-MM-DD
  type: "surgery" | "personal";
  createdAt?: any;
}

const DoctorDashboard: React.FC = () => {
  const [doctor, setDoctor] = useState<any>(null);
  const [queue, setQueue] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<DoctorEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const doctorUID = localStorage.getItem("doctorUID");

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!doctorUID) return;

      setLoading(true);
      // Fetch doctor info
      const doctorQuery = query(
        collection(db, "doctors"),
        where("uid", "==", doctorUID)
      );
      const doctorSnap = await getDocs(doctorQuery);

      if (!doctorSnap.empty) {
        const docData = doctorSnap.docs[0].data();
        setDoctor(docData);

        // Fetch patient queue (from "bookings" collection)
        const patientQuery = query(
          collection(db, "bookings"),
          where("doctorId", "==", doctorUID)
        );
        const patientSnap = await getDocs(patientQuery);

        const patients = patientSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Booking[];

        // Sort by token (queue order)
        patients.sort((a, b) => a.token - b.token);

        setQueue(patients);
      }

      // Fetch doctor events
      const eventSnap = await getDocs(
        query(collection(db, "doctorEvents"), where("doctorId", "==", doctorUID))
      );
      const evtList = eventSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DoctorEvent, "id">),
      })) as DoctorEvent[];
      setEvents(evtList);

      setLoading(false);
    };

    fetchDoctorData();
  }, [doctorUID]);

  // Update patient status
  const updateStatus = async (id: string, newStatus: string) => {
    const bookingRef = doc(db, "bookings", id);
    await updateDoc(bookingRef, { status: newStatus });
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus as any } : item))
    );
  };

  // Calendar helpers
  const formatDate = (d: Date) => d.toISOString().split("T")[0]; // YYYY-MM-DD

  const renderEventDot = (date: Date) => {
    const dateStr = formatDate(date);
    const hasSurgery = events.some((e) => e.date === dateStr && e.type === "surgery");
    const hasPersonal = events.some((e) => e.date === dateStr && e.type === "personal");

    return (
      <div className="flex justify-center mt-1 space-x-1">
        {hasSurgery && <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />}
        {hasPersonal && <span className="w-2 h-2 bg-red-500 rounded-full inline-block" />}
      </div>
    );
  };

  const addEvent = async (type: "surgery" | "personal") => {
    if (!doctorUID) return alert("Doctor not identified.");
    if (!selectedDate) return alert("Select a date first.");

    const dateStr = formatDate(selectedDate);

    // prevent duplicate same-type on same day (optional)
    const already = events.find((e) => e.date === dateStr && e.type === type);
    if (already) {
      alert(`${type === "surgery" ? "Surgery" : "Personal plan"} already exists on this day.`);
      return;
    }

    try {
      const ref = await addDoc(collection(db, "doctorEvents"), {
        doctorId: doctorUID,
        date: dateStr,
        type,
        createdAt: serverTimestamp(),
      });
      // Add to local state (include new id)
      setEvents((prev) => [...prev, { id: ref.id, doctorId: doctorUID, date: dateStr, type }]);
    } catch (err) {
      console.error("Add event failed:", err);
      alert("Failed to add event.");
    }
  };

  const deleteEvent = async (eventId?: string) => {
    if (!eventId) return;
    try {
      await deleteDoc(doc(db, "doctorEvents", eventId));
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      console.error("Delete event failed:", err);
      alert("Failed to delete event.");
    }
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateStr = formatDate(selectedDate);
    return events.filter((e) => e.date === dateStr);
  };

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

  const stats = {
    total: queue.length,
    pending: queue.filter((q) => q.status === "pending" || !q.status).length,
    inConsultation: queue.filter((q) => q.status === "in_consultation").length,
    completed: queue.filter((q) => q.status === "completed").length,
  };

  const avgConsultTime = 7; // minutes per patient

  if (!doctor)
    return (
      <p className="text-center mt-10 text-gray-600 text-lg">Loading dashboard...</p>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-[95vw] mx-auto px-2 py-8">

        {/* ===== Title (full width) ===== */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 w-full">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Doctor Dashboard</h1>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-1">Dr. {doctor.name}</h2>
            <p className="text-blue-100 text-lg">{doctor.specialization}</p>
          </div>
        </div>

        {/* ===== Grid: Left = queue (2 cols), Right = calendar (1 col) ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Queue (span 2) */}
          <div className="lg:col-span-2">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                  </div>
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-yellow-400" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">In Consultation</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.inConsultation}</p>
                  </div>
                  <Clock className="w-10 h-10 text-blue-400" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
              </div>
            </div>

            {/* Queue Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Patient Queue</h3>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Hourglass className="w-4 h-4" />
                  <span>Average consult time: {avgConsultTime} mins</span>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading appointments...</div>
              ) : queue.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No patients in queue yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Problem</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wait (mins)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {queue.map((patient, index) => {
                        const estimatedWait = index * avgConsultTime;
                        return (
                          <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-600">#{patient.token}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-800">{patient.patientName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{patient.patientProblem}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{patient.age}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{patient.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-semibold">{estimatedWait}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(patient.status)}`}>
                                {getStatusIcon(patient.status)}
                                {(patient.status || "pending").replace("_", " ").toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <select
                                value={patient.status || "pending"}
                                onChange={(e) => updateStatus(patient.id, e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_consultation">In Consultation</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right: Calendar (fixed to right of queue table) */}
        <div className="bg-white rounded-2xl shadow-lg p-4 h-fit  shrink-0 ">

            <h3 className="text-xl font-bold text-gray-800 mb-3">Schedule Calendar</h3>

            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={({ date }) => renderEventDot(date)}
              className="rounded-lg border border-gray-200 p-2"
            />

            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Selected: <span className="font-medium">{selectedDate.toDateString()}</span></p>

              {/* Events for selected date */}
              <div className="mb-3">
                <p className="text-sm font-semibold mb-2">Events on this date</p>
                {getEventsForSelectedDate().length === 0 ? (
                  <p className="text-sm text-gray-500">No events</p>
                ) : (
                  <ul className="space-y-2">
                    {getEventsForSelectedDate().map((ev) => (
                      <li key={ev.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${ev.type === "surgery" ? "bg-blue-500" : "bg-red-500"}`}></span>
                          <span className="text-sm font-medium">{ev.type === "surgery" ? "Surgery" : "Personal Plan"}</span>
                        </div>
                        <button
                          onClick={() => deleteEvent(ev.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => addEvent("surgery")}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Add Surgery
                </button>
                <button
                  onClick={() => addEvent("personal")}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Add Personal Plan
                </button>
              </div>

              {/* Legend */}
              <div className="mt-4 border-t pt-3 text-sm text-gray-600">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                  <span>Surgery</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                  <span>Personal Plan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> {/* container */}
    </div>
  );
};

export default DoctorDashboard;
