#!/bin/bash

# ============================================
# ShiftHub - AI Workforce Scheduling Platform
# Start Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║                                                  ║"
echo "║   🏢  ShiftHub - AI Workforce Scheduler          ║"
echo "║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ║"
echo "║   Starting application...                        ║"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Load environment variables ----
if [ -f "$PROJECT_DIR/.env" ]; then
    echo -e "${GREEN}✓ Loading environment variables${NC}"
    export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
else
    echo -e "${RED}✗ .env file not found! Please create one from .env.example${NC}"
    exit 1
fi

# ---- Kill processes on used ports ----
echo -e "\n${YELLOW}▸ Cleaning up ports...${NC}"

cleanup_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "  ${YELLOW}Killing processes on port $port: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    else
        echo -e "  ${GREEN}Port $port is free${NC}"
    fi
}

cleanup_port 3000
cleanup_port 4000

# ---- Check PostgreSQL ----
echo -e "\n${YELLOW}▸ Checking PostgreSQL...${NC}"
if command -v pg_isready &> /dev/null; then
    if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ PostgreSQL is running${NC}"
    else
        echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
        else
            sudo service postgresql start 2>/dev/null || true
        fi
        sleep 2
        if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓ PostgreSQL started successfully${NC}"
        else
            echo -e "  ${RED}✗ Could not start PostgreSQL. Please start it manually.${NC}"
            exit 1
        fi
    fi
else
    echo -e "  ${YELLOW}⚠ pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ---- Create Database ----
echo -e "\n${YELLOW}▸ Setting up database...${NC}"
DB_EXISTS=$(psql -U ${DB_USER:-postgres} -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME:-shift_planner}'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    echo -e "  ${YELLOW}Creating database '${DB_NAME:-shift_planner}'...${NC}"
    createdb -U ${DB_USER:-postgres} -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} ${DB_NAME:-shift_planner} 2>/dev/null || true
    echo -e "  ${GREEN}✓ Database created${NC}"
else
    echo -e "  ${GREEN}✓ Database '${DB_NAME:-shift_planner}' exists${NC}"
fi

# ---- Run Schema ----
echo -e "\n${YELLOW}▸ Running database schema...${NC}"
psql -U ${DB_USER:-postgres} -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -d ${DB_NAME:-shift_planner} -f "$PROJECT_DIR/backend/db/schema.sql" > /dev/null 2>&1
echo -e "  ${GREEN}✓ Schema applied${NC}"

# ---- Seed Data ----
echo -e "\n${YELLOW}▸ Seeding database with sample data...${NC}"
psql -U ${DB_USER:-postgres} -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -d ${DB_NAME:-shift_planner} -f "$PROJECT_DIR/backend/db/seed.sql" > /dev/null 2>&1
echo -e "  ${GREEN}✓ Database seeded (15+ items per feature)${NC}"

# ---- Install Dependencies ----
echo -e "\n${YELLOW}▸ Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
if [ ! -d "node_modules" ]; then
    npm install --silent 2>&1 | tail -1
    echo -e "  ${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "  ${GREEN}✓ Backend dependencies already installed${NC}"
fi

echo -e "\n${YELLOW}▸ Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install --silent 2>&1 | tail -1
    echo -e "  ${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "  ${GREEN}✓ Frontend dependencies already installed${NC}"
fi

cd "$PROJECT_DIR"

# ---- Start Backend with Hot Reload ----
echo -e "\n${YELLOW}▸ Starting backend server (port 4000)...${NC}"
cd "$PROJECT_DIR/backend"

# Use nodemon if available, otherwise use node --watch
if npx --yes nodemon --version > /dev/null 2>&1; then
    npx nodemon server.js &
    BACKEND_PID=$!
    echo -e "  ${GREEN}✓ Backend started with nodemon (hot reload)${NC}"
else
    node --watch server.js &
    BACKEND_PID=$!
    echo -e "  ${GREEN}✓ Backend started with --watch (hot reload)${NC}"
fi

cd "$PROJECT_DIR"

# ---- Start Frontend with Hot Reload ----
echo -e "\n${YELLOW}▸ Starting frontend dev server (port 3000)...${NC}"
cd "$PROJECT_DIR/frontend"
npx vite --port 3000 &
FRONTEND_PID=$!
echo -e "  ${GREEN}✓ Frontend started with Vite HMR (hot reload)${NC}"

cd "$PROJECT_DIR"

# ---- Cleanup on Exit ----
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✓ Application stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ---- Ready ----
sleep 3
echo -e "\n${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║                                                  ║"
echo "║   🚀  ShiftHub is ready!                         ║"
echo "║                                                  ║"
echo "║   Frontend:  http://localhost:3000                ║"
echo "║   Backend:   http://localhost:4000                ║"
echo "║   API Docs:  http://localhost:4000/api/health     ║"
echo "║                                                  ║"
echo "║   Login:     admin@shifthub.com / password123     ║"
echo "║                                                  ║"
echo "║   Press Ctrl+C to stop                           ║"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Wait for processes
wait
