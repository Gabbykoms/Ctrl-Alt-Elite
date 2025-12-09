# 🚀 Bantam Shuttle - Quick Start Scripts

Complete automation scripts to set up and run the entire Bantam Shuttle system.

## 📋 Available Scripts

### 🎯 Main Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `start-everything.sh` | **Complete setup and startup** - Sets up dependencies, databases, and starts all services | `./start-everything.sh` |
| `stop-everything.sh` | **Stop all services** - Cleanly stops all running services and Docker containers | `./stop-everything.sh` |
| `run-tests.sh` | **Test all services** - Runs comprehensive test suite | `./run-tests.sh` |
| `check-env.sh` | **Verify environment** - Checks if all environment variables are set | `./check-env.sh` |
| `setup-databases.sh` | **Setup Docker databases** - Only sets up PostgreSQL + Redis | `./setup-databases.sh` |
| `setup-supabase.sh` | **Supabase guide** - Interactive guide for Supabase setup | `./setup-supabase.sh` |

---

## 🚀 Quick Start (Recommended)

### **Option 1: Complete Automated Setup (Easiest)**

Run one command to set up everything:

```bash
chmod +x *.sh  # Make all scripts executable
./start-everything.sh
```

**What it does:**
1. ✅ Checks prerequisites (Docker, Node, Python, Java)
2. ✅ Starts PostgreSQL + Redis in Docker
3. ✅ Installs backend dependencies (npm)
4. ✅ Installs frontend dependencies (npm)
5. ✅ Creates Python virtual environment for AI service
6. ✅ Installs AI service dependencies (pip)
7. ✅ Guides you through Supabase setup
8. ✅ Starts all 4 services in separate terminals
9. ✅ Verifies everything is running

**Time:** ~5-10 minutes (depending on download speeds)

---

### **Option 2: Step-by-Step Manual Setup**

If you prefer more control:

#### **Step 1: Check Environment**
```bash
./check-env.sh
```

#### **Step 2: Setup Databases**
```bash
./setup-databases.sh  # Docker databases
./setup-supabase.sh   # Follow Supabase guide
```

#### **Step 3: Install Dependencies**
```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# AI Service
cd AI_Intergration_Service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

#### **Step 4: Start Services Manually**

Open 4 separate terminals:

```bash
# Terminal 1 - Backend (Port 8080)
cd backend
npm run dev

# Terminal 2 - Tracking Service (Port 8081)
cd tracking-service
./gradlew bootRun

# Terminal 3 - AI Service (Port 8083)
cd AI_Intergration_Service
source .venv/bin/activate
uvicorn app.main:app --reload --port 8083

# Terminal 4 - Frontend (Port 5173)
cd frontend
npm run dev
```

---

## 🧪 Testing

After starting services, verify everything works:

```bash
./run-tests.sh
```

**Test Results:**
- ✅ Environment configuration
- ✅ Docker containers (PostgreSQL, Redis)
- ✅ Backend API endpoints
- ✅ Tracking service APIs
- ✅ AI service endpoints
- ✅ Frontend accessibility
- ✅ Dependencies installed

---

## 🛑 Stopping Services

Stop all running services cleanly:

```bash
./stop-everything.sh
```

**What it does:**
- Stops Docker containers (PostgreSQL + Redis)
- Kills backend server (port 8080)
- Kills tracking service (port 8081)
- Kills AI service (port 8083)
- Kills frontend (port 5173)
- Cleans up process ID files

---

## 📊 Accessing Services

Once everything is running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Student/Driver/Admin dashboards |
| **Backend API Docs** | http://localhost:8080/api-docs | Swagger UI for backend API |
| **Backend Health** | http://localhost:8080/health | Health check endpoint |
| **Tracking Swagger** | http://localhost:8081/swagger-ui.html | Tracking service API docs |
| **Tracking Health** | http://localhost:8081/actuator/health | Spring Boot actuator |
| **AI Service Docs** | http://localhost:8083/docs | FastAPI interactive docs |
| **AI Service Health** | http://localhost:8083/health | AI service health check |

### **Databases:**
- **PostgreSQL** (Tracking): `localhost:5432` (tracking_db)
- **Redis** (Cache): `localhost:6379`
- **Backend Supabase**: https://supabase.com/dashboard/project/iarrtqyfimoukixvcizb
- **AI Supabase**: https://supabase.com/dashboard/project/bwijyokpoqewpwbwwfso

---

## 🔧 Troubleshooting

### **Services won't start?**
```bash
# Check what's using the ports
lsof -i :8080  # Backend
lsof -i :8081  # Tracking
lsof -i :8083  # AI
lsof -i :5173  # Frontend

# Stop everything and try again
./stop-everything.sh
./start-everything.sh
```

### **Docker issues?**
```bash
# Verify Docker is running
docker ps

# Restart Docker containers
cd tracking-service
docker-compose down
docker-compose up -d
```

### **Dependencies not installing?**
```bash
# Backend/Frontend
rm -rf node_modules package-lock.json
npm install

# AI Service
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### **Check logs:**
```bash
# If services were started in background
cat logs/backend.log
cat logs/tracking.log
cat logs/ai-service.log
cat logs/frontend.log
```

---

## 📝 Environment Variables

All environment variables are configured in:
- **Root**: `.env` (master configuration)
- **Backend**: `backend/.env`
- **AI Service**: `AI_Intergration_Service/.env`
- **Frontend**: Uses root `.env` via Vite

Verify with:
```bash
./check-env.sh
```

---

## 🔄 Development Workflow

### **Daily Development:**
```bash
# Start everything
./start-everything.sh

# Make your changes...

# Test changes
./run-tests.sh

# Stop when done
./stop-everything.sh
```

### **Quick restart after changes:**
```bash
# Just restart the service you're working on
# Backend:
cd backend && npm run dev

# Frontend:
cd frontend && npm run dev
```

---

## 📚 What Each Service Does

### **Backend (Node.js/Express)**
- User authentication (JWT)
- REST API for shuttles, routes, stops, rides
- WebSocket for real-time updates
- Supabase integration

### **Tracking Service (Java/Spring Boot)**
- Driver location tracking
- Ride assignment
- Real-time GPS updates
- PostgreSQL + Redis caching

### **AI Service (Python/FastAPI)**
- RAG chatbot with LangChain
- Vector search with pgvector
- OpenAI integration
- Real-time weather

### **Frontend (React/TypeScript)**
- Student dashboard (track shuttles)
- Driver dashboard (accept rides)
- Admin dashboard (manage system)
- Real-time maps with Mapbox

---

## 🎯 Next Steps

1. **Run the setup:** `./start-everything.sh`
2. **Verify it works:** `./run-tests.sh`
3. **Open frontend:** http://localhost:5173
4. **Register an account** with @trincoll.edu email
5. **Test features:** Login, request ride, track shuttle
6. **Check AI chatbot:** Click floating button, ask about shuttle hours

---

## 🆘 Need Help?

- Check test results: `./run-tests.sh`
- Check environment: `./check-env.sh`
- View main README: `README.md`
- Backend docs: `backend/README.md`
- Tracking docs: `tracking-service/README.md`
- AI docs: `AI_Intergration_Service/README.md`

---

**Happy Coding! 🚀**
