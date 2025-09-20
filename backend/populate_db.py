import random
from datetime import datetime, timedelta
import sqlite3
import os

# Path to the SQLite database file
DB_PATH = 'medications.db'

def generate_med_logs(days=30):
    """
    Generate synthetic medication logs for the past specified number of days
    
    Parameters:
    - days: Number of days to generate data for (default: 30)
    
    Returns:
    - List of medication log dictionaries with 'medication' and 'timestamp' fields
    """
    missed_days = set(random.sample(range(1, days + 1), k=2))  # Randomly select 2 missed days
    late_days = set(random.sample(range(1, days + 1), k=3))  # Randomly select 3 late days
    log = []
    for i in range(1, days + 1):
        date = datetime.now() - timedelta(days=i)
        if i in missed_days:
            continue  # Skip missed days
        hour = random.randint(7, 8)  # Morning time range
        minute = random.randint(0, 59)
        time = datetime(date.year, date.month, date.day, hour, minute)
        if i in late_days:
            time += timedelta(hours=random.randint(1, 2))  # Make some entries late
        log.append({
            'medication': 'Medication A',
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        })
    return log

def update_db(log):
    """
    Insert a medication log entry into the database
    
    Parameters:
    - log: Dictionary containing medication log data
    """
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO medications (medication, timestamp, source, notes)
            VALUES (?, ?, ?, ?)
        ''', (log['medication'], log['timestamp'], '', ''))
        conn.commit()

def main():
    """
    Main function to generate and insert sample medication data
    """
    logs = generate_med_logs()
    for log in logs:
        update_db(log)

if __name__ == "__main__":
    main()