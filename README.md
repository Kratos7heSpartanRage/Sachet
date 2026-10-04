# Sachet 

**Sachet** is a multilingual, voice-first investment-scam checker built specifically for Indian retail investors. It helps users identify fraudulent investment schemes, fake stock tips, and phishing attempts across WhatsApp, Telegram, and SMS before they send any money.

## Features 
- **Multilingual Support:** Natively understands and translates English, Hindi, Tamil, Telugu, Bengali, and Marathi, including "Hinglish" combinations.
- **Privacy First (On-Device Masking):** Uses client-side regex masking to scrub sensitive Personal Identifiable Information (PII) like Phone Numbers, UPI IDs, Aadhaar, PAN, and Bank Account numbers *before* anything is sent to the server.
- **Dual Engine Architecture:**
  - **Ultra-fast AI Analysis:** Powered by high-speed Groq open-source LLMs (like `openai/gpt-oss-120b`) to instantly detect complex scam semantics.
  - **Offline Rules Engine:** A robust fallback mechanism that scans for guaranteed returns, urgency patterns, unregistered advisors, and insider tip keywords locally if the AI API is unavailable.
- **Voice & Image Ready:** Built-in Speech-to-Text and offline OCR (Tesseract.js) to effortlessly check screenshots and voice notes.
- **Actionable Next Steps:** Direct links to SEBI intermediaries search and the National Cyber Crime portal (1930).

## Tech Stack 🛠️
- **Frontend:** Vanilla HTML, CSS, JavaScript (Zero build step for maximum portability and speed).
- **Backend:** Node.js (Zero dependencies, using native `http` module for minimal overhead).
- **Icons:** Lucide
- **AI Integration:** Groq API

## Getting Started 

### Prerequisites
- Node.js (v18 or higher)
- A Groq API Key (Optional, but recommended for AI features)

### Installation
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd Sachet
   ```

2. Set up the environment variables:
   Copy the example environment file and add your Groq API key.
   ```bash
   cp .env.example .env
   ```
   *Note: Edit `.env` to include your actual `GROQ_API_KEY`.*

3. Run the server:
   Because this project uses native Node modules, there's no `npm install` needed!
   ```bash
   node server.js
   ```
   *(Or run `set -a; source .env; set +a; node server.js` if you are on Linux/WSL and want to inject the env variables inline).*

4. Open `http://localhost:3000` in your browser.

## Security & Privacy 
Sachet is designed with a defense-in-depth approach. No user messages, masked texts, or analysis results are logged or stored on the server. The client-side masking ensures that even if the server is compromised, no financial PII is exposed.

## Disclaimer ⚠️
Sachet is a safety helper and **not** a source of financial or legal advice. It does not provide stock tips, price predictions, or product recommendations. Always verify investment opportunities through official SEBI portals.
