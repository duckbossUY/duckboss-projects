<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Duckboss - AI Project Manager

Duckboss is an intelligent project management application that leverages the power of AI to automatically generate comprehensive project timelines, milestones, and tasks from a simple project idea. 

## Features

- **AI-Powered Timeline Generation:** Input a brief project idea, and the application uses Google's Gemini AI to create a structured timeline with logical milestones and estimated task durations.
- **Interactive Timeline Management:** View, edit, add, and delete tasks within the generated milestones to fine-tune your project plan.
- **Progress Tracking:** Easily mark tasks as complete and track the overall progress of your project visually with progress bars.
- **Cloud Synchronization:** All projects, milestones, and tasks are securely stored and synced using Firebase Firestore.
- **User Authentication:** Secure user authentication powered by Firebase Auth ensures that your projects remain private and accessible only to you.

## Technologies Used

- **Frontend:** React, TypeScript, Tailwind CSS, Lucide React (Icons), Framer Motion (Animations)
- **Backend/API:** Node.js, Express
- **AI Integration:** Google Gen AI SDK (Gemini)
- **Database & Auth:** Firebase (Firestore, Authentication)
- **Build Tool:** Vite, esbuild

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in `.env` to your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. Ensure your Firebase configuration is correctly set up in `src/firebase.ts`.
4. Run the app:
   ```bash
   npm run dev
   ```
