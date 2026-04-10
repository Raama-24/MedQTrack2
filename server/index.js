console.log("RUNNING CORRECT SERVER FILE ✅");
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');
const multer = require('multer');
const pdf = require('pdf-parse');
const { Groq } = require('groq-sdk');
const cors = require('cors');
const Tesseract = require("tesseract.js");
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { exec } = require('child_process');
// 1. Initialize Firebase Admin

try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized successfully.");
} catch (error) {
    console.warn("WARNING: Firebase Admin failed to initialize. Make sure 'serviceAccountKey.json' exists in the server folder.", error.message);
    // Optional: Init without credentials if running on GCP/Firebase environments natively,
    // but for local testing, the JSON file is required.
}

const db = admin.firestore?.() || null;

const app = express();
app.get("/test", (req, res) => {
    res.send("TEST WORKING ✅");
});
app.get("/api/book-with-ai", (req, res) => {
    console.log("GET API HIT ✅");
    res.send("API reachable ✅");
});
// Allow CORS for development
app.use(cors());
app.use(bodyParser.json());

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Environment variables
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

// Conversation In-Memory State Mapping
// Map struct: { "phone_number": { step: "string", data: { name: "", age: "", ... } } }
const sessions = {};

// Helper to run shell commands via promises
const runCommand = (cmd) => new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(stderr);
            reject(error);
        } else {
            resolve(stdout);
        }
    });
});

async function getDoctorsFromDB() {
    if (!db) return [];
    const snapshot = await db.collection("doctors").get();
    const doctors = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        // Use the 'uid' field if it exists, otherwise fallback to doc.id
        doctors.push({
            id: data.uid || doc.id,
            ...data
        });
    });
    return doctors;
}

// Helper: Send WhatsApp Message
async function sendWhatsAppMessage(to, text) {
    try {
        await axios({
            method: "POST",
            url: `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
            headers: {
                Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            },
            data: {
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: { body: text },
            },

        });
        console.log(`✅ Text Message Successfully Sent to ${to}`);
    } catch (error) {
        console.error("❌ WhatsApp Send Error:", error?.response?.data || error.message);
        const metaError = error?.response?.data?.error;
        if (metaError) {
            console.error("Meta Error:", JSON.stringify(metaError, null, 2));
            throw new Error(`WhatsApp API Error: ${metaError.message} (Code: ${metaError.code})`);
        }
        throw error;
    }
}


// ==========================================
// Webhook Verification (WhatsApp required)
// ==========================================
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});


// ==========================================
// Webhook Message Receiver
// ==========================================
app.post("/webhook", async (req, res) => {
    const body = req.body;

    if (body.object) {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0] &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            const waMessage = body.entry[0].changes[0].value.messages[0];
            const from = waMessage.from; // Phone number
            const msgBody = waMessage.text ? waMessage.text.body : "";

            console.log(`Received message from ${from}: ${msgBody}`);

            // Route message through conversation flow
            await handleConversationFlow(from, msgBody);
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// ==========================================
// Bot Conversation Logic
// ==========================================
async function handleConversationFlow(from, message) {
    const msgLower = message.trim().toLowerCase();

    // Initialize session if it doesn't exist or if user restarts
    if (!sessions[from] || msgLower === 'hi' || msgLower === 'hello' || msgLower === 'restart') {
        sessions[from] = { step: 'AWAITING_NAME', data: {} };
        await sendWhatsAppMessage(from, "Welcome to MedQTrack Hospital! Let's book your appointment. \n\nPlease reply with your *Full Name*:");
        return;
    }

    const session = sessions[from];

    switch (session.step) {
        case 'AWAITING_NAME':
            session.data.name = message.trim();
            session.step = 'AWAITING_AGE';
            await sendWhatsAppMessage(from, `Nice to meet you, ${session.data.name}! \n\nWhat is your *Age*?`);
            break;

        case 'AWAITING_AGE':
            if (isNaN(message.trim())) {
                await sendWhatsAppMessage(from, "Please reply with a valid age number (e.g. 25).");
                return;
            }
            session.data.age = message.trim();
            session.step = 'AWAITING_GENDER';
            await sendWhatsAppMessage(from, "Got it. Please reply with your *Gender* (e.g. Male/Female/Other):");
            break;

        case 'AWAITING_GENDER':
            session.data.gender = message.trim();
            session.step = 'AWAITING_DOCTOR';

            const doctors = await getDoctorsFromDB();

            if (doctors.length === 0) {
                await sendWhatsAppMessage(from, "Sorry, no doctors are available right now.");
                return;
            }

            let doctorList = "Available Doctors:\n\n";
            doctors.forEach((doc, index) => {
                doctorList += `${index + 1}. Dr. ${doc.name} (${doc.specialization})\n`;
            });

            await sendWhatsAppMessage(
                from,
                `Great. Which doctor would you like to see? Reply with the doctor's name.\n\n${doctorList}`
            );
            break;

        case 'AWAITING_DOCTOR':
            const doctorsList = await getDoctorsFromDB();

            const selectedDoctor = doctorsList.find(doc =>
                msgLower.includes(doc.name.toLowerCase())
            );

            if (!selectedDoctor) {
                let doctorListAgain = "Please choose a doctor from this list:\n\n";
                doctorsList.forEach((doc, index) => {
                    doctorListAgain += `${index + 1}. Dr. ${doc.name} (${doc.specialization})\n`;
                });
                await sendWhatsAppMessage(from, doctorListAgain);
                return;
            }

            // NEW: Store these specific fields for the Dashboard
            session.data.doctorId = selectedDoctor.id;
            session.data.doctorName = `Dr. ${selectedDoctor.name}`;
            session.data.specialization = selectedDoctor.specialization;

            session.step = 'AWAITING_SYMPTOMS';

            await sendWhatsAppMessage(
                from,
                `You selected ${session.data.doctorName}.\n\nPlease briefly describe your *Symptoms or Reason for visit*:`
            );
            break;

        case 'AWAITING_SYMPTOMS':
            session.data.symptoms = message.trim();

            // All data collected -> finalize and save to Firestore
            try {
                await finalizeAppointment(from, session.data);
            } catch (err) {
                console.error("Error finalizing:", err);
                await sendWhatsAppMessage(from, "Sorry, there was a system error booking your appointment. Please try again later by typing 'Hi'.");
            }

            // Clear session state
            delete sessions[from];
            break;

        default:
            await sendWhatsAppMessage(from, "I'm not sure how to respond. Type 'Hi' to start a new booking.");
            delete sessions[from];
            break;
    }
}

// ==========================================
// Firestore Saving & Token Generation
// ==========================================
async function finalizeAppointment(userPhone, data) {
    if (!db) {
        console.error("Firestore DB is not initialized. Cannot save appointment.");
        await sendWhatsAppMessage(userPhone, "Our database is currently unavailable. We could not save your appointment.");
        return;
    }

    // Generate a random token number logic (or query the highest token for the day)
    const tokenNumber = Math.floor(Math.random() * 100) + 1;

    // Map the session data to the fields the Dashboard expects
    const appointmentData = {
        age: parseInt(data.age),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        doctorId: data.doctorId,           // CRITICAL: Dashboard usually filters by this
        doctorName: data.doctorName,       // Matches "Dr. Vipul Jainn" format
        patientName: data.name,
        patientProblem: data.symptoms,     // Field name from screenshot
        phone: userPhone,                  // Field name from screenshot
        specialization: data.specialization, // Field name from screenshot
        status: "pending",         // Case-sensitive status
        token: tokenNumber                 // Field name from screenshot
    };

    await db.collection('bookings').add(appointmentData);

    // Send Success Message Over WA
    const msg = `✅ *Success!*\nYour appointment is booked with ${data.doctorName}.\n\n*Name:* ${data.name}\n*Token no:* ${tokenNumber}\n*Expected wait time:* ~30 minutes.\n\nPlease show this message at the reception counter.`;
    await sendWhatsAppMessage(userPhone, msg);
}

// ==========================================
// AI Medical Report Summarizer & Booking
// ==========================================
app.post("/api/book-with-ai", upload.single('file'), async (req, res) => {
    console.log("BOOK API HIT ✅");

    try {
        const {
            patientName,
            patientProblem,
            age,
            phone,
            doctorName,
            doctorId,
            specialization
        } = req.body;

        let aiSummary = "No report provided.";

        // ✅ SAFE PDF PARSING
        if (req.file) {
            const isPDF = req.file.originalname.toLowerCase().endsWith(".pdf");
            const isImage = req.file.mimetype.startsWith("image/");

            if (!isPDF && !isImage) {
                throw new Error("Only PDF or image files allowed");
            }
            try {
                let reportText = "";

                // 🟢 IMAGE → Direct OCR
                if (isImage) {
                    console.log("🖼️ Image detected → Running OCR...");

                    const result = await Tesseract.recognize(
                        req.file.buffer,
                        "eng",
                        { logger: m => console.log(m) }
                    );

                    reportText = result.data.text;
                }

                // 🔵 PDF → Try parse → fallback OCR (if you still want PDF support)
                if (isPDF) {
                    console.log("📄 PDF detected");

                    try {
                        const data = await pdf(req.file.buffer);
                        reportText = data.text;
                        console.log("PDF text length:", reportText.length);
                    } catch (err) {
                        console.log("pdf-parse failed");
                    }

                    // If empty → skip or later add conversion logic
                    if (!reportText || reportText.trim().length < 20) {
                        throw new Error("Scanned PDF not supported yet. Upload image instead.");
                    }
                }

                // ❌ If still empty
                if (!reportText || reportText.trim().length < 20) {
                    throw new Error("No readable text found");
                }

                // 🤖 Send to Groq
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "You are a senior medical consultant. Summarize the medical report with key abnormalities and important findings in a clear, structured way."
                        },
                        {
                            role: "user",
                            content: reportText
                        }
                    ],
                    model: "llama-3.3-70b-versatile",
                });

                aiSummary = completion.choices[0]?.message?.content || "Failed to generate summary."; aiSummary = completion.choices[0]?.message?.content || "Failed to generate summary.";

            } catch (err) {
                console.error(err.message);
                aiSummary = `⚠️ ${err.message}`;
            }
        }

        // ✅ TOKEN + WAIT TIME
        const token = Math.floor(1000 + Math.random() * 9000);
        const waitTime = Math.floor(Math.random() * 5) * 15;

        // ✅ SAVE TO FIRESTORE
        if (db) {
            await db.collection("bookings").add({
                patientName,
                patientProblem,
                age: parseInt(age),
                phone,
                doctorName,
                doctorId,
                specialization,
                token,
                aiSummary,
                status: "Pending",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        // ✅ RESPONSE
        res.status(200).json({
            success: true,
            token,
            waitTime,
            aiSummary
        });

    } catch (error) {
        console.error("AI Booking Error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Server error"
        });
    }
});

// ==========================================
// Voice Triage Workflow
// ==========================================
app.post("/api/voice-triage-process", upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No audio file provided" });
        }

        const tempFilePath = path.join(__dirname, `temp_${Date.now()}.webm`);
        fs.writeFileSync(tempFilePath, req.file.buffer);

        // 1. STT via Groq Whisper
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-large-v3",
        });
        const transcriptText = transcription.text;
        
        // Clean up
        fs.unlinkSync(tempFilePath);

        if (!transcriptText) throw new Error("No transcription generated");

        // 2. LLM Summarization via Groq Llama 3
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a professional medical assistant. Create a structured, patient-friendly summary of the doctor's consultation in concise bullet points. Use simple, non-technical language. Do not add any assumptions outside of the transcript. Do NOT include introductory phrases, just output the bullet points."
                },
                {
                    role: "user",
                    content: transcriptText
                }
            ],
            model: "llama-3.3-70b-versatile",
        });

        const summary = completion.choices[0]?.message?.content || "Failed to generate summary.";

        res.status(200).json({
            success: true,
            transcript: transcriptText,
            summary: summary
        });

    } catch (err) {
        console.error("Voice Triage Process Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post("/api/voice-triage-send", async (req, res) => {
    try {
        const { summary, format, patientPhone, patientName } = req.body;
        
        let targetPhone = patientPhone ? String(patientPhone).replace(/\D/g, '') : "";
        
        // WhatsApp requires country code. If 10 digits, prepend 91 (India)
        if (targetPhone.length === 10) {
            targetPhone = "91" + targetPhone; 
        }

        if (format === "audio") {
            // 1. Generate Conversational Text
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a medical assistant. Convert the following medical summary into natural conversational sentences. Avoid bullet points, abbreviations, and symbols. Start exactly with: 'Hello, here is your medical summary.'"
                    },
                    {
                        role: "user",
                        content: summary
                    }
                ],
                model: "llama-3.3-70b-versatile",
            });
            const conversationalText = completion.choices[0]?.message?.content || `Hello, here is your medical summary. ${summary}`;

            // 2. Generate Audio using Python gTTS
            const tempTxtPath = path.join(__dirname, `temp_${Date.now()}.txt`);
            const tempMp3Path = path.join(__dirname, `summary_${Date.now()}.mp3`);
            
            fs.writeFileSync(tempTxtPath, conversationalText);
            
            await runCommand(`python gtts_script.py "${tempTxtPath}" "${tempMp3Path}"`);
            
            const audioBuffer = fs.readFileSync(tempMp3Path);

            // Cleanup
            fs.unlinkSync(tempTxtPath);
            fs.unlinkSync(tempMp3Path);
            
            // 3. Upload to WA Media API
            const mediaForm = new FormData();
            mediaForm.append('file', audioBuffer, { filename: 'summary.mp3', contentType: 'audio/mpeg' });
            mediaForm.append('type', 'audio');
            mediaForm.append('messaging_product', 'whatsapp');

            let mediaId = null;
            try {
                if (WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
                    const uploadRes = await axios.post(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/media`, mediaForm, {
                        headers: {
                            ...mediaForm.getHeaders(),
                            Authorization: `Bearer ${WHATSAPP_TOKEN}`
                        }
                    });
                    mediaId = uploadRes.data.id;
                }
            } catch(waErr) {
                console.error("❌ Media Upload Error:", waErr.response?.data || waErr.message);
                if (waErr.response?.data) {
                    console.error("Meta Detail:", JSON.stringify(waErr.response.data.error, null, 2));
                }
            }

            // 4. Send Media Message
            if (mediaId && WHATSAPP_TOKEN) {
                 const response = await axios.post(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
                    messaging_product: "whatsapp",
                    to: targetPhone,
                    type: "audio",
                    audio: { id: mediaId },
                }, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
                 console.log(`✅ Audio Message Successfully Sent to ${targetPhone} (Meta ID: ${response.data.messages[0].id})`);
            } else {
                 throw new Error("Media ID not generated or WhatsApp token missing");
            }
            
        } else {
            // Text Message
            const msg = `*Medical Summary for ${patientName || "Patient"}*\n\n${summary}`;
            if (WHATSAPP_TOKEN && PHONE_NUMBER_ID && targetPhone) {
                await sendWhatsAppMessage(targetPhone, msg);
            } else {
                throw new Error("WhatsApp Credentials (Token/ID) missing in .env");
            }
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Voice Triage Send Error:", err);
         res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// Server Bootup
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`WhatsApp Appointment Webhook running on port ${PORT}`);
});
