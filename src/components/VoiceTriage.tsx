import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Mic, MicOff, Loader2 } from 'lucide-react';

// Define SpeechRecognition types to avoid TypeScript errors
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  uid: string;
}

export default function VoiceTriage() {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Captured Data
  const [capturedData, setCapturedData] = useState({
    name: '',
    age: '',
    gender: '',
    doctorName: '',
    doctorId: '',
    specialization: '',
    timeDate: ''
  });

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(window.speechSynthesis);

  // Use refs to avoid stale closures inside event listeners without re-triggering useEffect
  const stepRef = useRef(step);
  const capturedDataRef = useRef(capturedData);
  const doctorsRef = useRef(doctors);
  const isActiveRef = useRef(isActive);

  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { capturedDataRef.current = capturedData; }, [capturedData]);
  useEffect(() => { doctorsRef.current = doctors; }, [doctors]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  console.log("SpeechRecognition exists:", !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  useEffect(() => {
    // Fetch doctors for matching
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

    // Setup Keyboard shortcut Alt + V
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        startTriage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    console.log("SpeechRecognition object:", SpeechRecognition);
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[0][0].transcript;

        console.log("🎤 USER SAID:", result);

        setTranscript(result);
        if (handleVoiceInputRef.current) {
          handleVoiceInputRef.current(result);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (isActiveRef.current) {
          if (speakRef.current) {
             speakRef.current("Sorry, I didn't catch that. Please try again.", () => {
               if (listenRef.current) setTimeout(listenRef.current, 2500);
             });
          }
        }
      };
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      synthRef.current.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []); // Empty dependency array: run only once!

  const speak = (text: string, callback?: () => void) => {
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    if (callback) {
      utterance.onend = callback;
    }

    synthRef.current.speak(utterance);
  };

  const listen = () => {
    if (recognitionRef.current) {
      console.log("🎙️ STARTING LISTENING");
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Recognition already started", e);
      }
    }
  };

  const startTriage = () => {
    if (isActive) return;
    setIsActive(true);
    setStep(1);

    speak("Voice triage started. Please tell your name.", () => {
      setTimeout(() => {
        if (listenRef.current) listenRef.current();
      }, 300);
    });
  };

  const extractAge = (text: string) => {
    const match = text.match(/\d+/);
    return match ? match[0] : '30'; // fallback
  };

  const handleVoiceInput = async (text: string) => {
    const lowerText = text.toLowerCase();
    const currentStep = stepRef.current;
    const currentData = capturedDataRef.current;
    const currentDoctors = doctorsRef.current;

    if (currentStep === 1) {
      // Step 1: Captured Name
      setCapturedData(prev => ({ ...prev, name: text }));
      setStep(2);
      speak(`Thank you ${text}. Please tell your age and gender.`, () => {
        if (listenRef.current) listenRef.current();
      });
    }
    else if (currentStep === 2) {
      // Step 2: Captured Age and Gender
      const age = extractAge(text);
      const gender = lowerText.includes('female') ? 'Female' : lowerText.includes('male') ? 'Male' : 'Other';

      setCapturedData(prev => ({ ...prev, age, gender }));
      setStep(3);
      speak("Great. Which doctor do you want to see? For example, Dr. Vipul Jain.", () => {
        if (listenRef.current) listenRef.current();
      });
    }
    else if (currentStep === 3) {
      // Step 3: Captured Doctor
      let matchedDoctor = currentDoctors.find(d => lowerText.includes(d.name.toLowerCase()));

      if (!matchedDoctor && currentDoctors.length > 0) {
        // Fallback to first doctor if none matched strictly
        matchedDoctor = currentDoctors[0];
      }

      setCapturedData(prev => ({
        ...prev,
        doctorName: matchedDoctor?.name || text,
        doctorId: matchedDoctor?.uid || matchedDoctor?.id || '',
        specialization: matchedDoctor?.specialization || 'General'
      }));
      setStep(4);
      speak(`You selected doctor ${matchedDoctor?.name || text}. What is your preferred time and date?`, () => {
        if (listenRef.current) listenRef.current();
      });
    }
    else if (currentStep === 4) {
      // Step 4: Captured Time/Date, Proceed to booking
      setCapturedData(prev => ({ ...prev, timeDate: text }));
      setStep(5);

      speak("Confirming your booking and generating your token number. Please wait a moment.");
      await submitBooking(text, { ...currentData, timeDate: text });
    }
  };

  // Need refs for the callbacks so the empty-array useEffect can use them
  const handleVoiceInputRef = useRef(handleVoiceInput);
  const speakRef = useRef(speak);
  const listenRef = useRef(listen);

  useEffect(() => {
    handleVoiceInputRef.current = handleVoiceInput;
    speakRef.current = speak;
    listenRef.current = listen;
  });

  const submitBooking = async (timeDateStr: string, currentData: typeof capturedData = capturedData) => {
    try {
      const formData = new FormData();
      formData.append("patientName", currentData.name);
      // Combine problem and time/date as expected by schema if needed,
      // but the API handles patientProblem as the description field.
      formData.append("patientProblem", `Voice booking for ${timeDateStr}. Gender: ${currentData.gender}`);
      formData.append("age", currentData.age || '30');
      formData.append("phone", "Voice-System-Booking"); // Matches schema expectation for a phone field
      formData.append("doctorName", `Dr. ${currentData.doctorName.replace(/^Dr\.\s*/i, '')}`);
      formData.append("doctorId", currentData.doctorId);
      formData.append("specialization", currentData.specialization);

      const response = await fetch("http://localhost:3000/api/book-with-ai", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error("Booking failed");
      }

      speak(`Booking confirmed. Your token number is ${result.token}. We are redirecting you now.`, () => {
        setIsActive(false);
        navigate(`/success?token=${result.token}&name=${encodeURIComponent(capturedData.name)}`);
      });

    } catch (err) {
      console.error(err);
      speak("I apologize, but there was an error processing your booking. Please try again.", () => {
        setIsActive(false);
        setStep(0);
      });
    }
  };

  const cancelTriage = () => {
    synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.abort();
    setIsActive(false);
    setIsListening(false);
    setStep(0);
  };

  return (
    <>
      <button
        onClick={startTriage}
        className="bg-[#007BFF] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#0056b3] transition-all shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 flex items-center gap-2"
        aria-label="Start Voice Triage"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            startTriage();
          }
        }}
      >
        <Mic className="w-6 h-6" />
        Start Voice Triage
      </button>

      {/* Voice Triage Modal Overlay */}
      {isActive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="voice-triage-title">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">

            <button
              onClick={cancelTriage}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              aria-label="Cancel Voice Triage"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all ${isListening ? 'bg-blue-100 text-[#007BFF] animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
              {step === 5 ? <Loader2 className="w-10 h-10 animate-spin text-[#007BFF]" /> :
                isListening ? <Mic className="w-10 h-10" /> : <MicOff className="w-10 h-10" />}
            </div>

            <h2 id="voice-triage-title" className="text-2xl font-poppins font-bold text-gray-900 mb-2">Voice Triage Active</h2>
            <p className="text-gray-500 mb-8 min-h-[3rem] text-lg font-roboto">
              {step === 1 && "Listening for your name..."}
              {step === 2 && "Listening for your age and gender..."}
              {step === 3 && "Listening for doctor preference..."}
              {step === 4 && "Listening for preferred time/date..."}
              {step === 5 && "Confirming booking..."}
            </p>

            {transcript && (
              <div className="w-full bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-inner">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-left mb-1 font-poppins">You said:</p>
                <p className="text-gray-800 text-lg italic font-roboto">"{transcript}"</p>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-6 mt-auto font-roboto">Speak clearly into your microphone.</p>
          </div>
        </div>
      )}
    </>
  );
}
