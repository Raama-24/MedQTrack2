import React, { useEffect, useState, useRef } from "react";
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
  Mic,
  Smartphone,
  Volume2,
  MessageSquare,
  FileText
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
  aiSummary?: string;
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
  const [selectedDate, setSelectedDate] = useState<any>(new Date());
  const [selectedSummary, setSelectedSummary] = useState<string | null>(null);
  const [triageState, setTriageState] = useState<{ patientId: string, status: "recording" | "transcribing" | "generating" | "ready" | "sending", tag: string, name: string, phone: string, summary: string } | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"audio" | "text">("text");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const getAccessibilityTag = (patient: Booking) => {
    const isVoice = patient.patientProblem?.toLowerCase().includes('voice booking') || patient.phone === 'Voice-System-Booking';
    if (isVoice) {
      return patient.token % 2 === 0 ? "Deaf" : "Blind";
    }
    return "None";
  };

  const handleVoiceTriage = async (patient: Booking, tag: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Ensure UI cycles through states
        setTriageState(prev => prev ? { ...prev, status: "transcribing" } : null);
        
        // Move to generating partway through if fetch takes time
        const genTimeout = setTimeout(() => {
            setTriageState(prev => prev?.status === "transcribing" ? { ...prev, status: "generating" } : prev);
        }, 3000);

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          formData.append("patientId", patient.id);

          const res = await fetch("http://localhost:3000/api/voice-triage-process", {
            method: "POST",
            body: formData
          });

          clearTimeout(genTimeout);
          setTriageState(prev => prev ? { ...prev, status: "generating" } : null); // Make sure it visits generating

          const data = await res.json();
          if (data.success) {
            setTimeout(() => {
                setTriageState(prev => prev ? { ...prev, status: "ready", summary: data.summary } : null);
            }, 1000); // brief pause to see generating
          } else {
             alert("Error processing audio: " + data.error);
             setTriageState(null);
          }

        } catch (err) {
            console.error(err);
            alert("Network error processing audio.");
            setTriageState(null);
        }
        
        // Cleanup stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setTriageState({ patientId: patient.id, status: "recording", tag, name: patient.patientName, phone: patient.phone, summary: "" });
      setSelectedFormat(tag === "Blind" ? "audio" : "text");

    } catch (err) {
      console.error("Mic access denied", err);
      alert("Microphone access is required.");
    }
  };

  const stopVoiceTriage = () => {
     if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
         mediaRecorderRef.current.stop();
     }
  };

  const sendSummary = async () => {
    if (triageState && triageState.summary) {
      setTriageState(prev => prev ? { ...prev, status: "sending" } : null);
      
      try {
        const res = await fetch("http://localhost:3000/api/voice-triage-send", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
                 summary: triageState.summary,
                 format: selectedFormat,
                 patientPhone: triageState.phone,
                 patientName: triageState.name
             })
        });

        const data = await res.json();
        if (data.success) {
             alert("✅ Message sent successfully to WhatsApp!");
             setTriageState(null);
        } else {
             alert("Failed to send: " + data.error);
             setTriageState(prev => prev ? { ...prev, status: "ready" } : null);
        }
      } catch (err) {
          console.error(err);
          alert("Network error sending summary");
          setTriageState(prev => prev ? { ...prev, status: "ready" } : null);
      }
    }
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accessibility</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">View Report</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voice Triage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {queue.map((patient, index) => {
                        const estimatedWait = index * avgConsultTime;
                        const tag = getAccessibilityTag(patient);
                        const hasReport = patient.aiSummary && patient.aiSummary !== "No report provided." && !patient.aiSummary.includes("⚠️");
                        return (
                          <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-600">#{patient.token}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-800">{patient.patientName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{patient.patientProblem}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{patient.age}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {tag !== "None" ? (
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${tag === 'Deaf' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                  {tag === 'Deaf' ? <MessageSquare className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                                  {tag}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {hasReport ? (
                                <button
                                  onClick={() => setSelectedSummary(patient.aiSummary!)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors justify-center font-medium"
                                >
                                  <FileText className="w-3 h-3" /> View Report
                                </button>
                              ) : (
                                <span className="text-gray-400 text-sm">Not Available</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleVoiceTriage(patient, tag)}
                                className="flex items-center gap-2 px-3 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] font-medium transition-colors shadow-sm"
                              >
                                <Mic className="w-4 h-4" /> Start Voice Triage
                              </button>
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

      {/* Summary Modal (Original) */}
      {selectedSummary !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">AI Medical Summary</h3>
              <button
                onClick={() => setSelectedSummary(null)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto whitespace-pre-wrap text-gray-700 leading-relaxed">
              {selectedSummary}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedSummary(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Triage Processing Modal */}
      {triageState !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
            
            {triageState.status === "recording" && (
              <>
                <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6 animate-pulse">
                  <Mic className="w-12 h-12 text-red-600 animate-bounce" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Recording Consultation</h3>
                <p className="text-gray-500 mb-8">Speak clearly into your microphone...</p>
                <button
                  onClick={stopVoiceTriage}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-lg transition-all flex justify-center items-center shadow-lg hover:scale-105"
                >
                  Stop Voice Triage
                </button>
              </>
            )}

            {triageState.status === "transcribing" && (
              <>
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6 animate-pulse">
                  <Mic className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Transcribing Voice</h3>
                <p className="text-gray-500">Whisper AI is understanding the consultation...</p>
              </>
            )}

            {triageState.status === "generating" && (
              <>
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6 animate-spin">
                  <FileText className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Generating Summary</h3>
                <p className="text-gray-500">Llama-3 is creating structured insights...</p>
              </>
            )}
            
            {triageState.status === "sending" && (
              <>
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-pulse">
                  <Smartphone className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sending Protocol Active</h3>
                <p className="text-gray-500">Dispatching via WhatsApp Cloud API...</p>
              </>
            )}

            {triageState.status === "ready" && (
              <>
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Summary Ready!</h3>
                
                <div className="bg-gray-50 w-full p-4 rounded-xl border border-gray-200 mb-4 text-left max-h-[250px] overflow-y-auto">
                    <p className="text-sm font-semibold text-gray-500 uppercase mb-2">Generated by Llama-3:</p>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                        {triageState.summary}
                    </div>
                </div>

                <div className="w-full flex items-center justify-center gap-4 mb-6">
                    <button 
                        onClick={() => setSelectedFormat("text")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border-2 transition-all ${selectedFormat === "text" ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                        <MessageSquare className="w-4 h-4" /> Text
                    </button>
                    <button 
                        onClick={() => setSelectedFormat("audio")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border-2 transition-all ${selectedFormat === "audio" ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Volume2 className="w-4 h-4" /> Audio (TTS)
                    </button>
                    <div className="ml-auto flex flex-col text-right">
                        <span className="text-xs text-gray-500">Suggested:</span>
                        <span className="text-sm font-bold text-gray-800">{triageState.tag === "Blind" ? "Audio" : triageState.tag === "Deaf" ? "Text" : "Text"}</span>
                    </div>
                </div>

                <button
                  onClick={sendSummary}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#1ebd5a] text-white rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-2 shadow-lg hover:shadow-[#25D366]/30 hover:scale-105"
                >
                  <Smartphone className="w-5 h-5" /> Send Summary via WhatsApp
                </button>
              </>
            )}
            
            {triageState.status !== "recording" && triageState.status !== "sending" && (
                <button 
                   onClick={() => setTriageState(null)}
                   className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
