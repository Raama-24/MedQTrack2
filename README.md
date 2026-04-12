MedQTrack

PROBLEM
Healthcare isn’t failing because of lack of doctors — it’s failing because of lack of systems.
Imagine walking into a government hospital OPD at 9 AM… and not knowing whether your turn will come at 10 AM… or 3 PM. Long queues. No transparency. Manual registers. Delayed admissions. Stock-outs of essential medicines. And for many patients — especially the elderly, disabled, or those unfamiliar with technology — even accessing the system itself becomes a challenge.

That’s the problem we’re solving with MedQTrack — an integrated hospital operations management system.


SOLUTION
MedQTrack combines AI, real-time systems, and multi-channel accessibility to:

Enable smart appointment booking with automated voice triage
Provide real-time queue visibility and transparency
Equip doctors with AI-generated patient context before consultation
Improve accessibility through voice and WhatsApp-based interactions
Digitize hospital infrastructure like beds and inventory

KEY FEATURES
AI-Powered Summarization
AI analyzes patient reports to identify key symptoms and generates concise summaries
Multi-Channel Booking (WhatsApp + Voice)
Webhook-based WhatsApp automation with speech-to-text pipelines for hands-free booking
Real-Time Queue Management Engine
Token generation, live queue updates, and wait-time estimation based on throughput
Doctor Dashboard
Displays live queue, patient details, AI summaries, and supports real-time status updates with emergency prioritization
Voice Triage System
Records consultations, converts them into structured summaries, and sends outputs in both text and audio formats
Smart Bed Allocation System
Tracks real-time bed availability with equipment validation (oxygen, monitors, pumps)


TECH STACK

Frontend:
React 18 (TypeScript)
Tailwind CSS
Framer Motion

Backend:
Node.js
Express.js

Database:
Firebase Firestore

AI & Integrations:
LLM APIs (triage + summarization)
Speech-to-Text
WhatsApp Cloud API


SYSTEM FLOW
Patient books via text, WhatsApp, or voice
System generates token, assigns queue, and estimates wait time
Doctor views live queue with AI-generated summaries
Doctor updates consultation status, updating queue in real time
Consultation can be recorded and sent as text/audio summaries
Admin manages bed availability and equipment
Users view hospitals and real-time available beds


SETUP AND INSTALLATION
# Clone the repository
git clone https://github.com/your-username/medqtrack.git

# Install dependencies
cd medqtrack
npm install

# Run frontend
npm run dev

# Run backend
cd server
npm install
node index.js
