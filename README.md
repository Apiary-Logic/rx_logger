# Medication Tracker

A full-stack application for tracking medication intake with a Flask backend and React/TypeScript frontend. Responsive UI built with Material UI components.

![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- Log medication intake with timestamps
- View medication history with user-friendly time formatting
- NFC tag support for quick medication logging
- Backend API for storing and retrieving medication data

## Project Structure

```
med_logs/
├── backend/                  # Flask backend
│   ├── backend.py            # Main Flask application
├── frontend/                 # React frontend
│   ├── public/               # Static files
│   ├── src/                  # React source code
│   │   ├── components/       # React components
│   │   ├── App.tsx           # Main application component
│   │   └── index.tsx         # Application entry point
│   ├── package.json          # Frontend dependencies
│   └── tsconfig.json         # TypeScript configuration
└── README.md
|__ scripts/
|   |___run_dev.sh
│   └── populate_db.py        # Sample data generation script
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- pip (Python package manager)

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install Python dependencies:

   ```bash
   pip install flask
   ```

3. Run the Flask backend:

   ```bash
   python3 backend.py
   ```

4. (Optional) Generate sample data:
   ```bash
   python3 populate_db.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Access the application:
   Open your browser and go to `http://localhost:3000`

## Programming and Using NFC Tags

You can use NFC tags to log medications with a single tap via iPhone Shortcuts.

### You Will Need

    - An iPhone
    - Blank NFC Tags
    - The Shortcuts app (pre-installed on iOS)
    - NFC Tools app (optional but helpful)

### Create a New Shortcut

1. Tap + to create a new shortcut in the Shortcuts app
2. Add the following actions:
   - Get contents of URL
     - `Method`: POST
     - `URL`: `http://<your-ipv4-address>:5000/log
     - `Headers`: { Content-Type: application/json}
     - `Request Body`:
       ```json
       {
         "medication": "Example Med Name",
         "timestamp": "CURRENT_DATE",
         "source": "nfc"
       }
       ```
   - Replace "CURRENT_DATE" with the current date variable and Format date as ISO 8601
3. (Optional) Add Notification
   - `If` → [Get Contents of URL] `contains` "Medication logged successfully!"
     - `Show Notification`: "Med Logged"
   - `Otherwise`:
     - `Show Notification`: "Logging Failed"
4. Add Automation
   - Go to Shortcuts > Automation
   - Create Personal Automation
   - Choose `NFC`
   - Scan and name the tag you want to use
   - Add `Run Shortcut` and select the shorcut you just made

#### Now You Can:

    - Tap your phone to the NFC tag
    - Your shortcut runs and sends a POST request to your local server
    - Your med log is instantly recorded in the database

- **Note**: Be sure your iPhone and computer are on the same Wi-Fi network and your Flask server is running with `host='0.0.0.0'`

## API Endpoints

| Endpoint       | Method | Description             | Request Body                             | Response                    |
| -------------- | ------ | ----------------------- | ---------------------------------------- | --------------------------- |
| `/`            | GET    | API health check        | None                                     | Text confirmation           |
| `/log`         | POST   | Log a medication        | `{medication, timestamp, source, notes}` | Success/error message       |
| `/medications` | GET    | Get all medication logs | None                                     | Array of medication entries |

## Future Improvements

- Medication scheduling and reminders
- Medication database integration
- Data visualization for adherence tracking

## License

This project is licensed under the MIT License - see the LICENSE file for details.

Copyright © 2025 Apiary Logic
