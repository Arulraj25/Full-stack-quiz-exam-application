#!/bin/bash

echo "🔧 FINAL DASHBOARD FIX"

# 1. Stop and remove everything
docker-compose stop dashboard
docker rm quiz_dashboard 2>/dev/null || true
docker rmi quiz-portal-1-dashboard 2>/dev/null || true

# 2. Create final Dockerfile
cat > dashboard/Dockerfile << 'DOCKER'
FROM python:3.9-slim

WORKDIR /app

# Install base packages
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    unixodbc \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Microsoft ODBC driver
RUN curl -sSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/ubuntu/20.04/prod focal main" > /etc/apt/sources.list.d/mssql-release.list \
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

# 3. Build
echo "Building dashboard..."
docker-compose build --no-cache dashboard

# 4. Start
echo "Starting dashboard..."
docker-compose up -d dashboard

# 5. Wait
sleep 15

# 6. Check
echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "📝 Dashboard Logs:"
docker-compose logs dashboard --tail=30

echo ""
echo "🧪 Testing Dashboard..."
curl -s http://localhost:5002/ || echo "Dashboard may take a moment"
echo ""
curl -s http://localhost:5002/api/dashboard || echo "API not ready yet"

echo ""
echo "✅ Done! Dashboard: http://localhost:5002"
