#!/bin/bash

echo "🔧 Rebuilding Dashboard with Ubuntu base..."

# 1. Stop and remove dashboard container
docker-compose stop dashboard
docker rm quiz_dashboard 2>/dev/null || true
docker rmi quiz-portal-1-dashboard 2>/dev/null || true

# 2. Create new Dockerfile with Ubuntu base
cat > dashboard/Dockerfile << 'DOCKER'
FROM python:3.9

WORKDIR /app

# Install ODBC driver for SQL Server
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    unixodbc \
    unixodbc-dev \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list > /etc/apt/sources.list.d/mssql-release.list \
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

# 3. Rebuild dashboard
echo "Building dashboard..."
docker-compose build --no-cache dashboard

# 4. Start dashboard
echo "Starting dashboard..."
docker-compose up -d dashboard

# 5. Wait for dashboard to start
sleep 10

# 6. Check status
echo ""
echo "📊 Container Status:"
docker-compose ps

# 7. Test dashboard
echo ""
echo "🧪 Testing Dashboard..."
curl -s http://localhost:5002/ || echo "Dashboard starting..."
echo ""
curl -s http://localhost:5002/api/dashboard || echo "API not ready yet"

echo ""
echo "✅ Dashboard rebuild complete!"
echo "🌐 Access Dashboard: http://localhost:5002"
echo ""
echo "📝 View logs: docker-compose logs dashboard -f"
