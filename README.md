# VAULTOPS
> **Your Personal Secure Digital Command Center**

VaultOps is a premium, secure digital command-center application designed for storing application credentials, API keys, important emails, secure notes, project information, attachments, and encrypted backups. It is architected with security, backup, recovery, and disaster tolerance as first-class requirements.

---

## 🛡️ Security Architecture

1. **Password Hashing:** Argon2id via `argon2-cffi` package (using recommended parameters: time_cost=3, memory_cost=65536, parallelism=4).
2. **Authenticated Encryption:** AES-256-GCM authenticated encryption for sensitive fields.
3. **Envelope Encryption Architecture:**
   - Every secret is encrypted using a unique Data Encryption Key (DEK) generated dynamically (`secrets.token_bytes(32)`).
   - The DEK is encrypted (wrapped) with a master Key Encryption Key (KEK).
   - The envelope package contains: `nonce (12 bytes) + encrypted_dek (wrapped KEK) + tag (16 bytes) + payload_ciphertext`.
   - Production uses AWS KMS Key wrapping. Local development simulates this using a base64 KEK loaded from environment variables.
4. **Session Management:** Secure database-backed sessions with HTTP-only SameSite cookies.
5. **No Secrets in Logs:** Dedicated interceptor filters in Python logging ensuring no sensitive payload elements are ever written.
6. **User Isolation:** Resource ownership filters in every API controller.

---

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router.
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy, PostgreSQL.
- **Infrastructure:** Docker, Docker Compose.

---

## 🚀 How to Run (Development)

### Prerequisites
Make sure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Instructions

1. **Prepare Environment Variables:**
   Copy the example environment configuration to create `.env`:
   ```bash
   cp .env.example .env
   ```

2. **Spin Up the Containers:**
   Launch the database, backend FastAPI, and Vite frontend containers:
   ```bash
   docker-compose up --build
   ```

3. **Access the Interfaces:**
   - **Frontend UI:** [http://localhost:3000](http://localhost:3000)
   - **Backend API (Swagger Docs):** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **PostgreSQL Database:** Port `5432` inside Docker network.

4. **Default Developer Account:**
   Upon container startup, the database automatically seeds a secure demo user:
   - **Email:** `demo@vaultops.io`
   - **Password:** `password123` (PIN `1234` also accepted)

---

## 📂 Project Structure

```
vaultops/
├── frontend/             # React SPA (Vite + TS + Tailwind CSS)
│   ├── src/
│   │   ├── components/   # UI components (Sidebar, Topbar)
│   │   ├── pages/        # Dashboard, Projects, Credentials pages
│   │   ├── layouts/      # DashboardLayout & Lock Overlay screen
│   │   ├── security/     # VaultLock inactivity monitors
│   │   └── App.tsx       # Main router and layout context
│   └── Dockerfile
├── backend/              # Python FastAPI Server
│   ├── app/
│   │   ├── api/          # REST Endpoint Routers (Auth, CRUD, Search)
│   │   ├── database/     # DB Session management and tables seeding
│   │   ├── models/       # SQLAlchemy models (PostgreSQL tables)
│   │   ├── schemas/      # Pydantic schema validation
│   │   ├── security/     # Argon2id password and Session management
│   │   ├── encryption/   # AES-256-GCM Envelope Encryption service
│   │   └── main.py       # FastAPI application entrypoint
│   └── Dockerfile
└── docker-compose.yml    # Service orchestration config
```
