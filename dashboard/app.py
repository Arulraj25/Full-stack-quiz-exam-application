from flask import Flask, jsonify, render_template
import pyodbc
import os

app = Flask(__name__)

# Azure Synapse Connection
SERVER = os.getenv('SERVER', "quizportal-synapse-ondemand.sql.azuresynapse.net")
DATABASE = os.getenv('DATABASE', "quizportal_db")
USERNAME = os.getenv('USERNAME', "sqladminuser")
PASSWORD = os.getenv('PASSWORD', "Arul_2025")

connection_string = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    f"SERVER={SERVER};"
    f"DATABASE={DATABASE};"
    f"UID={USERNAME};"
    f"PWD={PASSWORD};"
    "Encrypt=yes;"
    "TrustServerCertificate=no;"
)

def get_connection():
    return pyodbc.connect(connection_string)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/dashboard")
def dashboard():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT TOP 1
            total_users,
            total_quizzes,
            total_questions,
            total_attempts,
            completed_attempts,
            abandoned_attempts,
            overall_avg_score
        FROM OPENROWSET
        (
            BULK 'curated/summary_metrics/*.parquet',
            DATA_SOURCE='QuizStorage',
            FORMAT='PARQUET'
        ) AS result
        """

        cursor.execute(query)
        row = cursor.fetchone()

        data = {
            "total_users": row.total_users,
            "total_quizzes": row.total_quizzes,
            "total_questions": row.total_questions,
            "total_attempts": row.total_attempts,
            "completed_attempts": row.completed_attempts,
            "abandoned_attempts": row.abandoned_attempts,
            "overall_avg_score": row.overall_avg_score
        }

        cursor.close()
        conn.close()

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv('PORT', 5002))
    app.run(host="0.0.0.0", port=port, debug=False)
