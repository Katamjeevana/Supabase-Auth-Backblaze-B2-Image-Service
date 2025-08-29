# 📸 Supabase + Backblaze B2 Image Upload Backend

A Node.js + Express backend that allows authenticated users to upload, view, and manage images with secure cloud storage.

---

## ✨ Features

- 🔐 **User Authentication** – Sign up & log in using Supabase Auth with JWT tokens
- 📤 **Image Upload** – Store images in Backblaze B2 cloud storage
- 📋 **Image Management** – View, list, and delete uploaded images
- 🛡️ **Security** – Row-level security ensures users only access their own content
- ☁️ **Cloud Native** – Fully deployed on AWS EC2 with Docker

---

## 🏗️ Architecture

### Backend Stack

- **Supabase** – Authentication (JWT) + Database (PostgreSQL)
- **Backblaze B2** – File storage (S3-compatible)
- **Express.js** – REST API framework
- **JWT Middleware** – Secure request validation
- **Docker** – Containerization
- **AWS EC2** – Cloud deployment

### Data Flow

- User authentication via Supabase
- Image upload to Backblaze B2 cloud storage
- Metadata storage in Supabase database
- Secure access control with JWT tokens

---

## 🗂️ Database Schema (Supabase)

**Table: `images`**

- `id` (UUID) – Primary key (auto-generated)
- `user_id` (UUID) – References Supabase auth users
- `filename` (Text) – Unique filename in Backblaze
- `original_name` (Text) – Original uploaded filename
- `url` (Text) – Public Backblaze URL
- `size` (Integer) – File size in bytes
- `created_at` (Timestamptz) – Upload timestamp

---

## 🚀 API Endpoints

### 🔐 Authentication Endpoints

- **POST /auth/signup** – Register new user with email/password → Returns: User object + JWT tokens
- **POST /auth/login** – Authenticate user with email/password → Returns: User object + JWT tokens
- **POST /auth/resend-verification** – Resend email verification link

### 📸 Image Endpoints (Protected – Require JWT)

- **POST /api/images** – Upload image (multipart/form-data)
- **GET /api/images** – Get all images for authenticated user
- **GET /api/images/:id** – Get specific image by ID
- **DELETE /api/images/:id** – Delete image from Backblaze + database

### 🩺 Health Check

- **GET /health** → Returns: `{"status":"OK","message":"Server is running"}`

---

## ⚙️ Setup & Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo/backend
   ```

## 📸 Supabase + Backblaze B2 Image Upload Backend

A Node.js + Express backend that allows authenticated users to upload, view, and manage images with secure cloud storage.

---

## ✨ Features

- 🔐 **User Authentication** – Sign up & log in using Supabase Auth with JWT tokens
- 📤 **Image Upload** – Store images in Backblaze B2 cloud storage
- 📋 **Image Management** – View, list, and delete uploaded images
- 🛡️ **Security** – Row-level security ensures users only access their own content
- ☁️ **Cloud Native** – Fully deployed on AWS EC2 with Docker

---

## 🏗️ Architecture

### Backend Stack

- **Supabase** – Authentication (JWT) + Database (PostgreSQL)
- **Backblaze B2** – File storage (S3-compatible)
- **Express.js** – REST API framework
- **JWT Middleware** – Secure request validation
- **Docker** – Containerization
- **AWS EC2** – Cloud deployment

### Data Flow

- User authentication via Supabase
- Image upload to Backblaze B2 cloud storage
- Metadata storage in Supabase database
- Secure access control with JWT tokens

---

## 🗂️ Database Schema (Supabase)

**Table: `images`**

- `id` (UUID) – Primary key (auto-generated)
- `user_id` (UUID) – References Supabase auth users
- `filename` (Text) – Unique filename in Backblaze
- `original_name` (Text) – Original uploaded filename
- `url` (Text) – Public Backblaze URL
- `size` (Integer) – File size in bytes
- `created_at` (Timestamptz) – Upload timestamp

---

## 🚀 API Endpoints

### 🔐 Authentication Endpoints

- **POST /auth/signup** – Register new user with email/password → Returns: User object + JWT tokens
- **POST /auth/login** – Authenticate user with email/password → Returns: User object + JWT tokens
- **POST /auth/resend-verification** – Resend email verification link

### 📸 Image Endpoints (Protected – Require JWT)

- **POST /api/images** – Upload image (multipart/form-data)
- **GET /api/images** – Get all images for authenticated user
- **GET /api/images/:id** – Get specific image by ID
- **DELETE /api/images/:id** – Delete image from Backblaze + database

### 🩺 Health Check

- **GET /health** → Returns: `{"status":"OK","message":"Server is running"}`

---

## ⚙️ Setup & Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo/backend
   Install Dependencies
   ```

npm install

Environment Configuration – Create .env file with:

PORT=3000
NODE_ENV=development

# Supabase

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Backblaze B2

B2_APPLICATION_KEY_ID=your-backblaze-key-id
B2_APPLICATION_KEY=your-backblaze-application-key
B2_BUCKET_NAME=your-bucket-name
B2_BUCKET_ID=your-bucket-id
B2_ENDPOINT=https://s3.eu-central-003.backblazeb2.com

Database Setup – Run this SQL in Supabase SQL editor:

CREATE TABLE images (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id UUID REFERENCES auth.users(id) NOT NULL,
filename TEXT NOT NULL,
original_name TEXT NOT NULL,
url TEXT NOT NULL,
size INTEGER NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own images" ON images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own images" ON images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own images" ON images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own images" ON images FOR DELETE USING (auth.uid() = user_id);
Start Development Server
npm run dev

Runs at: http://localhost:3000

🧪 Testing with Postman
Signup → POST /auth/signup
Login → POST /auth/login → Save JWT token
Upload Image → POST /api/images (Bearer token + form-data)
List Images → GET /api/images (Bearer token)
Delete Image → DELETE /api/images/:id (Bearer token)

🐳 Docker Deployment

Build & Run
docker-compose up -d --build
docker-compose.yml
version: '3.8'
services:
app:
build: .
ports: - "3000:3000"
env_file: - .env
restart: unless-stopped

☁️ AWS EC2 Deployment
Launch EC2 (Amazon Linux 2023, t2.micro, open ports 22, 3000, 80)
SSH into EC2 and install Docker + Docker Compose
Transfer project → scp -i "your-key.pem" ./backend ec2-user@your-ec2-ip:/home/ec2-user/
Run docker-compose up -d --build
(Optional) Configure Nginx as reverse proxy

📋 Project Structure
backend/
├── src/
│ ├── config/ # Supabase + Backblaze configs
│ ├── controllers/ # Auth + Image controllers
│ ├── middleware/ # JWT authentication middleware
│ ├── routes/ # Auth + Image routes
│ ├── utils/ # Multer upload config
│ └── index.js # Main server file
├── .env
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md

🛡️ Security Features

JWT token authentication for all protected routes
Row-level security in Supabase database
File type validation (images only)
File size limits (10MB max)
Secure environment variable management
CORS protection enabled

🚀 Performance Features
Docker containerization for easy deployment
Efficient file streaming to Backblaze B2
Database indexing for fast queries
Memory-efficient file handling with Multer
Horizontal scaling capability

📝 License
This project is licensed under the ISC License.

## 🤝 Contributing

Fork the repository
Create a feature branch → git checkout -b feature/amazing-feature
Commit changes → git commit -m 'Add amazing feature'
Push branch → git push origin feature/amazing-feature
Open a Pull Request
