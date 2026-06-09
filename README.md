# Wakhar Warehouse Management System (WMS)

Welcome to the **Wakhar Warehouse Management System (WMS)** repository. This is a monorepo containing the web frontend, mobile application, database schemas, and shared modules for the Wakhar Digital Agriculture Ecosystem.

## 📁 Repository Structure

The project is structured as a monorepo with the following workspace packages:
* **`backend/`**: FastAPI (Python) backend application utilizing SQLAlchemy, Alembic migrations, and MariaDB.
* **`frontend/`**: React + Vite web dashboard application for warehouse administrators, FPO managers, and aggregators.
* **`mobile/`**: React Native + Expo mobile application for farmers and FPO staff.
* **`shared/`**: Common JavaScript utility modules (`@wakhar/shared`) shared between the frontend and mobile apps.

---

## 🚀 Setup & Installation Guide

Follow these steps to set up and run the entire ecosystem on a new device.

### 📋 Prerequisites
Ensure the machine has the following tools installed:
* **Node.js** (v20+ recommended)
* **Python** (v3.10+)
* **MariaDB** or MySQL database server
* **Git**
* **Expo Go** application installed on a physical mobile device (Android or iOS) for mobile testing.

---

### 1️⃣ Clone the Repository
Clone the repository and enter the project root folder:
```bash
git clone -b wakhar-wms https://github.com/preranas-source/wakhar.git
cd wakhar
```

### 2️⃣ Install Node.js Workspace Dependencies
From the **root folder**, install all node dependencies for the frontend, mobile, and shared workspaces:
```bash
npm install
```

---

### 3️⃣ Local Database Setup
Start your local MariaDB/MySQL service, log in, and execute the following SQL script to create the database and user:
```sql
CREATE DATABASE wakharwms;
CREATE USER 'wakhar'@'localhost' IDENTIFIED BY 'wakhar123';
GRANT ALL PRIVILEGES ON wakharwms.* TO 'wakhar'@'localhost';
FLUSH PRIVILEGES;
```

---

### 4️⃣ Backend Setup (FastAPI + SQLAlchemy)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   * **On Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate
     ```
   * **On Linux / macOS / WSL**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure local environment variables:
   * Copy the example file to `.env`:
     ```bash
     cp .env.example .env
     ```
   * *Note: If your local database credentials differ, update `DATABASE_URL` inside the newly created `.env` file.*
5. Run the database migrations to generate the 13 tables:
   ```bash
   alembic upgrade head
   ```
6. Seed the database with initial demo data:
   ```bash
   python scripts/seed.py
   ```
7. Start the API development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API will run locally at `http://127.0.0.1:8000`.

---

### 5️⃣ Run the Web Frontend (React + Vite)
1. Open a new terminal window.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open the link (usually `http://localhost:5173`) in your web browser.

---

### 6️⃣ Run the Mobile App (React Native + Expo)
1. Open a new terminal window.
2. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
3. Start the Expo bundler:
   ```bash
   npx expo start
   ```
4. Scan the QR code using your phone:
   * **Android**: Open the **Expo Go** app and scan the QR code.
   * **iOS**: Scan the QR code using the built-in iOS **Camera** app.
