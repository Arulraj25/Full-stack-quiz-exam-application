#!/bin/bash

echo "🔧 Fixing Dashboard Dockerfile..."

# 1. Update Dashboard Dockerfile
cat > dashboard/Dockerfile << 'DOCKER'
FROM python:3.9-slim

WORKDIR /app

# Install ODBC driver for SQL Server (updated method)
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    unixodbc \
    unixodbc-dev \
    && curl -sSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft-prod.gpg \
    && curl -sSL https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
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

# 2. Stop dashboard container
echo "Stopping dashboard container..."
docker-compose stop dashboard

# 3. Remove old dashboard image
echo "Removing old dashboard image..."
docker rmi quiz-portal-1-dashboard 2>/dev/null || true

# 4. Rebuild dashboard
echo "Rebuilding dashboard..."
docker-compose build --no-cache dashboard

# 5. Start dashboard
echo "Starting dashboard..."
docker-compose up -d dashboard

# 6. Wait for dashboard to start
sleep 5

# 7. Check status
echo ""
echo "📊 Container Status:"
docker-compose ps

# 8. Test dashboard
echo ""
echo "🧪 Testing Dashboard..."
curl -s http://localhost:5002/health || echo "Dashboard may take a moment to start"
echo ""
curl -s http://localhost:5002/api/dashboard || echo "API not ready yet"

echo ""
echo "✅ Dashboard fix applied!"
echo "🌐 Access Dashboard: http://localhost:5002"
echo ""
echo "📝 View logs: docker-compose logs dashboard -f"
