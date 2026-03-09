# MedQTrack WhatsApp Appointment Server

This is a lightweight Node.js/Express backend that powers the WhatsApp Cloud API appointment booking feature. It receives messages via secure webhooks, runs a stateful interactive questionnaire, and securely writes the generated token and data into Firebase Firestore (`appointments` collection).

## Quick Start Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` -> `.env`.
   - Add your [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) tokens (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`).
   - Add your personalized `VERIFY_TOKEN` (used to link the webhook).

3. **Firebase Connection**
   - Download your Firebase Service Account JSON file.
   - Rename it to `serviceAccountKey.json` and place it directly inside this `/server` directory.

4. **Boot Up Server**
   ```bash
   node index.js
   ```

5. **Expose to WhatsApp**
   For local testing, use a tool like Ngrok to expose port 3000 to the internet securely.
   ```bash
   ngrok http 3000
   ```
   Take the generated HTTPS URL (e.g., `https://1234.ngrok-free.app/webhook`) and configure it under your Meta App Webhook dashboard.

## Firebase Dashboard Sync
Once configured, users texting you "Hi" will generate appointments mapped securely into your Firebase `appointments` collection natively. Because your React dashboard uses Firestores real-time capabilities globally, these will populate instantly inside your UI assuming you write a snapshot listener mirroring what we did for `beds`!
