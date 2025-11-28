from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime
import os

# Flask application for Medication Tracker API
# Provides endpoints for logging medications and retrieving medication history
app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'medications.db')

def init_db():
    """Initialize database with medications table if it doesn't exist"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS medications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                medication TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                source TEXT,
                notes TEXT
            )
        ''')
        conn.commit()

@app.route('/')
def index():
    """Root endpoint that confirms API is running"""
    return "Welcome to the Medication Tracker API!"

@app.route('/log', methods=['POST'])
def log_med():
    """
    Endpoint to log a new medication entry
    
    Expects JSON with:
    - medication: name of medication (required)
    - timestamp: time medication was taken (required)
    - source: how the medication was logged (optional, defaults to 'nfc')
    - notes: any additional information (optional)
    """
    data = request.json
    medication = data.get('medication')
    timestamp = data.get('timestamp')
    source = data.get('source', 'manual')
    notes = data.get('notes', '')
    if not medication or not timestamp:
        return jsonify({'error': 'Medication and timestamp are required!'}), 400
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO medications (medication, timestamp, source, notes)
            VALUES (?, ?, ?, ?)
        ''', (medication, timestamp, source, notes))
        conn.commit()
    return jsonify({'message': 'Medication logged successfully!'}), 201

@app.route('/medications', methods=['GET'])
def get_medications():
    """
    Endpoint to retrieve all medication logs
    
    Returns a list of medication entries ordered by timestamp (most recent first)
    Each entry is an array with: [id, medication, timestamp, source, notes]
    """
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM medications ORDER BY timestamp DESC')
        medications = cursor.fetchall()
        return jsonify(medications), 200
    
if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        init_db()
    # For testing, nuke the database on each run
    # else:
    #     os.remove(DB_PATH)
    #     init_db()
    
    app.run(debug=True, host='0.0.0.0', port=5000)