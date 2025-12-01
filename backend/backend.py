from flask import Flask, request, jsonify
import psycopg2
from datetime import datetime
import os

# Flask application for Medication Tracker API

app = Flask(__name__)

DB_NAME = os.getenv('DB_NAME', 'medtracker')
DB_USER = os.getenv('DB_USER', 'meduser')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'medpass')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')

DEMO_USERNAME = os.getenv('DEMO_USERNAME', 'kermit')


def get_db_connection():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
    )


def get_demo_user_id(cur):
    """Get the demo user's id (e.g. kermit) using an existing cursor."""
    cur.execute("SELECT id FROM users WHERE user_name = %s", (DEMO_USERNAME,))
    row = cur.fetchone()
    if row is None:
        raise RuntimeError(f"Demo user '{DEMO_USERNAME}' not found in users table")
    return row[0]


def get_or_create_medication(cur, user_id, med_name):
    """
    Look up or create a medication for this user using an existing cursor.
    """
    cur.execute(
        "SELECT id FROM medications WHERE user_id = %s AND name = %s",
        (user_id, med_name),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        """
        INSERT INTO medications (user_id, name, dosage_amount, dosage_unit, route, notes)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (user_id, med_name, 1.0, "mg", "oral", "Created via /log endpoint"),
    )
    new_id = cur.fetchone()[0]
    return new_id


@app.route("/")
def index():
    return "Medication Tracker API is running."


@app.route("/log", methods=["POST"])
def log_med():
    """
    Log a new medication event into medication_events.

    Expects JSON with:
    - medication: name of medication (required)
    - timestamp: ISO string when the dose was taken (required)
    - source: event source (optional, defaults to 'manual')
    - notes: any additional information (optional)
    """
    data = request.get_json(force=True)
    medication = data.get("medication")
    timestamp_str = data.get("timestamp")
    source = data.get("event_source",data.get("source", "manual"))
    notes = data.get("notes", "")

    if not medication or not timestamp_str:
        return jsonify({"error": "Medication and timestamp are required!"}), 400

    try:
        ts = datetime.fromisoformat(timestamp_str)
    except ValueError:
        return jsonify({"error": "Invalid timestamp format; use ISO 8601."}), 400

    if source not in ("manual", "nfc", "smart_bottle", "scanner"):
        return jsonify({"error": f"Invalid source '{source}'"}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                user_id = get_demo_user_id(cur)
                medication_id = get_or_create_medication(cur, user_id, medication)

                cur.execute(
                    """
                    INSERT INTO medication_events (
                        user_id,
                        medication_id,
                        scheduled_time,
                        actual_time,
                        event_type,
                        event_source,
                        exception_code,
                        notes
                    )
                    VALUES (%s, %s, %s, %s, 'taken', %s, 'none', %s)
                    RETURNING id
                    """,
                    (user_id, medication_id, ts, ts, source, notes),
                )
                event_id = cur.fetchone()[0]
                conn.commit()

        return jsonify({"message": "Medication logged successfully!", "event_id": event_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/medications", methods=["GET"])
def list_medications():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Reuse existing cursor-aware helper
                user_id = get_demo_user_id(cur)

                cur.execute(
                    """
                    SELECT
                        e.id,
                        m.name AS medication,
                        COALESCE(e.actual_time, e.scheduled_time) AS event_time,
                        e.event_source,
                        e.notes
                    FROM medication_events e
                    JOIN medications m ON m.id = e.medication_id
                    WHERE e.user_id = %s
                    ORDER BY event_time DESC
                    """,
                    (user_id,),
                )
                rows = cur.fetchall()
        result = []
        for r in rows:
            event_time = r[2]
            ts_str = event_time.isoformat() if event_time is not None else None
            result.append([r[0], r[1], ts_str, r[3], r[4]])

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
