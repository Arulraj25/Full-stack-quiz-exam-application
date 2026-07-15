#!/bin/bash

echo "🚀 Integrating Dashboard with Quiz Portal"

# 1. Create dashboard directory structure
echo "📁 Creating dashboard directories..."
mkdir -p dashboard/static dashboard/templates

# 2. Create Dashboard Dockerfile
echo "📝 Creating Dashboard Dockerfile..."
cat > dashboard/Dockerfile << 'DOCKER'
FROM python:3.9-slim

WORKDIR /app

# Install ODBC driver for SQL Server
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    unixodbc \
    unixodbc-dev \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/10/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5002

CMD ["python", "app.py"]
DOCKER

# 3. Create dashboard app.py
echo "📝 Creating Dashboard app.py..."
cat > dashboard/app.py << 'APP'
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
APP

# 4. Create requirements.txt
echo "📝 Creating Dashboard requirements.txt..."
cat > dashboard/requirements.txt << 'REQ'
Flask==2.3.3
pyodbc==5.0.1
REQ

# 5. Create .dockerignore
echo "📝 Creating Dashboard .dockerignore..."
cat > dashboard/.dockerignore << 'IGNORE'
venv
__pycache__
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info
dist
build
.env
.git
.gitignore
README.md
IGNORE

# 6. Update docker-compose.yml
echo "📝 Updating docker-compose.yml..."
cat > docker-compose.yml << 'COMPOSE'
services:
  mysql:
    image: mysql:8.0
    container_name: quiz_mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: quiz_portal
      MYSQL_USER: quizuser
      MYSQL_PASSWORD: quizpassword
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    networks:
      - quiz-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-prootpassword"]
      interval: 10s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: quiz_backend
    environment:
      NODE_ENV: production
      PORT: 5000
      DB_HOST: mysql
      DB_USER: quizuser
      DB_PASSWORD: quizpassword
      DB_NAME: quiz_portal
      JWT_SECRET: your_very_secure_jwt_secret_key_change_this
    ports:
      - "5000:5000"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - quiz-network
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: quiz_frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - quiz-network
    restart: unless-stopped

  dashboard:
    build: ./dashboard
    container_name: quiz_dashboard
    ports:
      - "5002:5002"
    environment:
      - SERVER=quizportal-synapse-ondemand.sql.azuresynapse.net
      - DATABASE=quizportal_db
      - USERNAME=sqladminuser
      - PASSWORD=Arul_2025
      - PORT=5002
    networks:
      - quiz-network
    restart: unless-stopped

volumes:
  mysql_data:

networks:
  quiz-network:
    driver: bridge
COMPOSE

# 7. Build and start everything
echo "🚀 Building and starting all services..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo ""
echo "✅ Integration Complete!"
echo ""
echo "🌐 Services Available:"
echo "   📱 Frontend: http://localhost:3000"
echo "   🔧 Backend API: http://localhost:5000"
echo "   📊 Dashboard: http://localhost:5002"
echo "   🗄️  Database: localhost:3306"
echo ""
echo "📝 Dashboard Credentials:"
echo "   🔗 URL: http://localhost:5002"
echo "   📊 Shows Azure Synapse analytics"
echo ""
echo "📝 View all logs: docker-compose logs -f"
echo "🛑 Stop all: docker-compose down"
echo "🔄 Restart: docker-compose restart"
