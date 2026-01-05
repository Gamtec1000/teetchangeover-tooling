# Futuristic Changeover App (V2)

## Project Overview

This is a **Shop Floor Kiosk Application** designed to manage and display changeover procedures for manufacturing machines. It allows users to view step-by-step instructions, manage machine/part data, and upload reference images/PDFs.

The project uses a **Hybrid Architecture**:
*   **Frontend:** A modern React application (Vite + TypeScript) for the user interface.
*   **Database & Auth:** **Firebase** (Firestore & Authentication) is used for syncing data (Machines, Parts, Tools, Templates) across devices.
*   **File Storage:** A **Local Node.js Backend** is used to store and serve heavy files (images, PDFs) locally, likely to avoid cloud storage costs or strictly for local network performance/privacy.

## Directory Structure

*   **`client/`**: The main Frontend application.
    *   `src/`: Source code (React components, hooks, utils).
    *   `dist/`: Production build output.
    *   `vite.config.ts`: Vite configuration.
*   **`uploads/`**: Directory where the local backend stores uploaded files (images, PDFs).
*   **`server.js`**: The Local Backend entry point. A simple Express server that handles file uploads and serves them statically.
*   **`src/` (Root)**: Appears to be legacy code or assets. The active frontend is in `client/`.
*   **`firebase.json`**: Firebase Hosting configuration (points to `client/dist`).

## Architecture Details

### 1. Frontend (`client/`)
*   **Framework:** React 18+ with TypeScript.
*   **Build Tool:** Vite.
*   **State/Data:** Uses Firebase SDK (`client/src/firebase.ts`) to interact with Firestore.
*   **File Uploads:** Custom logic in `firebase.ts` bypasses Firebase Storage and instead `POST`s files to the local `server.js` endpoint (`http://localhost:3001/api/upload`).
*   **UI Library:** Uses `react-icons`, `recharts` / `react-chartjs-2` for data visualization.

### 2. Backend (`server.js`)
*   **Runtime:** Node.js.
*   **Framework:** Express.js.
*   **Port:** `3001`.
*   **Function:**
    *   Receives file uploads via `/api/upload` (using `multer`).
    *   Stores files in the `uploads/` directory in the project root.
    *   Serves files statically under `/uploads`.

### 3. Data (Firebase)
*   **Firestore Collections:** `machines`, `parts`, `tools`, `pipe_sizes`, `changeover_templates`, `changeover_logs`, `consumable_items`, `consumable_logs`.
*   **Auth:** Anonymous login is handled in `firebase.ts`.

## Getting Started

### Prerequisites
*   Node.js installed.
*   Git installed.

### Setup

1.  **Install Root Dependencies (Backend):**
    ```bash
    npm install
    ```

2.  **Install Client Dependencies (Frontend):**
    ```bash
    cd client
    npm install
    ```

### Running the Application

You need to run **both** the backend and the frontend.

1.  **Start the Backend (Terminal 1):**
    ```bash
    # From the project root
    npm start
    # Output: Server running on http://localhost:3001
    ```

2.  **Start the Frontend (Terminal 2):**
    ```bash
    # From the client directory
    cd client
    npm run dev
    # Output: Local: http://localhost:5173/
    ```

3.  **Access the App:**
    Open your browser to `http://localhost:5173`.

## Development Notes

*   **IP Addresses:** The frontend currently points to `http://localhost:3001` for file uploads. If deploying to a network where kiosks access a central server, this URL in `client/src/firebase.ts` (and `client/src/utils/urlHelpers.ts` if it exists) must be updated to the server's LAN IP address.
*   **Legacy Code:** The `src/` directory in the root appears to be from a previous version. Active development should happen in `client/src/`.
*   **Firebase Config:** The Firebase configuration is located in `client/src/firebase.ts`. Ensure you have valid credentials if setting up a fresh environment.
