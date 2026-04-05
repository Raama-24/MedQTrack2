require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');

// 1. Initialize Firebase Admin
// Important: Download your Firebase Service Account JSON from the Firebase Console 
// (Project Settings > Service Accounts > Generate new private key)
// and save it as "serviceAccountKey.json" inside this server folder.
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
app.use(bodyParser.json());

// Environment variables
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

// Conversation In-Memory State Mapping
// Map struct: { "phone_number": { step: "string", data: { name: "", age: "", ... } } }
const sessions = {};
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
    } catch (error) {
        console.error("Error sending WA message:", error?.response?.data || error.message);
    }
}
console.log("WHATSAPP_TOKEN:", !!WHATSAPP_TOKEN);
console.log("PHONE_NUMBER_ID:", PHONE_NUMBER_ID);

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
// Server Bootup
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`WhatsApp Appointment Webhook running on port ${PORT}`);
});
