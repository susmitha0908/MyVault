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

---

## ☁️ End-to-End AWS EC2 Production Deployment Guide

Follow these comprehensive steps to deploy VaultOps onto an **AWS EC2 Ubuntu Instance** with Docker.

### 1. Launch AWS EC2 Instance
1. Log into your **AWS Management Console** and navigate to **EC2**.
2. Click **Launch Instance** and configure:
   - **Name:** `VaultOps-Production`
   - **AMI (OS):** `Ubuntu Server 24.04 LTS` (or `22.04 LTS`)
   - **Instance Type:** `t3.small` (Recommended: 2 vCPU, 2 GiB RAM) or `t3.micro` (Free tier)
   - **Key Pair:** Select or create a new key pair (e.g. `vaultops-key.pem`)
3. **Network Settings (Security Group):**
   Ensure the following Inbound Security Group Rules are added:
   | Type | Protocol | Port Range | Source | Purpose |
   | :--- | :--- | :--- | :--- | :--- |
   | **SSH** | TCP | `22` | Your IP | Secure Terminal Access |
   | **HTTP** | TCP | `80` | `0.0.0.0/0` | Web Traffic / Nginx |
   | **HTTPS** | TCP | `443` | `0.0.0.0/0` | Secure SSL Traffic |
   | **Custom TCP** | TCP | `3001` | `0.0.0.0/0` | Frontend UI Port |
   | **Custom TCP** | TCP | `8000` | `0.0.0.0/0` | Backend API (Optional/Swagger) |

---

### 2. Connect & Install Docker on EC2
From your local terminal, SSH into the EC2 instance:
```bash
ssh -i "vaultops-key.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
```

Update packages and install **Docker Engine & Docker Compose**:
```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker using official script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Add ubuntu user to docker group (run without sudo)
sudo usermod -aG docker ubuntu
newgrp docker

# 4. Verify Docker installation
docker --version
docker compose version
```

---

### 3. Clone Repository & Setup Environment
Clone your repository directly from GitHub:
```bash
# Clone the repository
git clone https://github.com/susmitha0908/MyVault.git
cd MyVault

# Copy environment template
cp .env.example .env

# Edit production configurations
nano .env
```

Set your production environment variables inside `.env`:
```ini
APP_ENV=production
SECRET_KEY=change_this_to_a_random_secure_64_character_string_for_prod
POSTGRES_USER=vaultops_admin
POSTGRES_PASSWORD=your_super_strong_database_password_here
POSTGRES_DB=vaultops_db

# (Optional) AWS S3 & KMS Configuration for Cloud Backups
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```
*(Press `CTRL + O`, then `Enter` to save, and `CTRL + X` to exit `nano`).*

---

### 4. Build & Launch Containers
Launch all three services (PostgreSQL Database, FastAPI Backend, and Vite Frontend) in detached background mode:
```bash
docker compose up -d --build
```

Verify that all containers are healthy:
```bash
docker compose ps
```

To view live container logs:
```bash
# View backend logs
docker compose logs -f backend

# View frontend logs
docker compose logs -f frontend
```

---

### 5. Access Application
Open your browser and visit:
* **Frontend Web App:** `http://<YOUR-EC2-PUBLIC-IP>:3001`
* **Interactive API Docs (Swagger):** `http://<YOUR-EC2-PUBLIC-IP>:8000/docs`
* **Default Login:** `demo@vaultops.io` / `password123` (or PIN `1234`)

---

### 6. (Optional) Custom Domain & Free SSL Setup (Nginx + Certbot)
To access your vault securely at `https://myvault.yourdomain.com`:

1. Point your domain's **DNS A Record** to your EC2 Public IP address.
2. Install **Nginx** and **Certbot**:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```
3. Create an Nginx server configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/vaultops
   ```
   Add:
   ```nginx
   server {
       server_name myvault.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api {
           proxy_pass http://127.0.0.1:8000/api;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
4. Enable the site and obtain a free SSL certificate:
   ```bash
   sudo ln -s /etc/nginx/sites-available/vaultops /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d myvault.yourdomain.com
   ```

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

