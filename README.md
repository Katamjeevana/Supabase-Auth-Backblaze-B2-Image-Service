📸 Supabase + Backblaze B2 Image Upload Backend
.A Node.js + Express backend that allows authenticated users to upload, view, and manage images with secure cloud storage.
✨ Features
🔐 User Authentication - Sign up & log in using Supabase Auth with JWT tokens
📤 Image Upload - Store images in Backblaze B2 cloud storage
📋 Image Management - View, list, and delete uploaded images
🛡️ Security - Row-level security ensures users only access their own content
☁️ Cloud Native - Fully deployed on AWS EC2 with Docker

🏗️ Architecture

=> Backend Stack
-Supabase - Authentication (JWT) + Database (PostgreSQL)
-Backblaze B2 - File storage (S3-compatible)
-Express.js - REST API framework
-JWT Middleware - Secure request validation
-Docker - Containerization
-AWS EC2 - Cloud deployment

=> Data Flow
-User authentication via Supabase
-Image upload to Backblaze B2 cloud storage
-Metadata storage in Supabase database
-Secure access control with JWT tokens

🗂️ Database Schema (Supabase)
Table: images

Column Type Description
-id UUID Primary key (auto-generated)
-user_id UUID References Supabase auth users
-filename Text Unique filename in Backblaze
-original_name Text Original uploaded filename
-url Text Public Backblaze URL
-size Integer File size in bytes
-created_at Timestamptz Upload Timestamptz

🚀 API Endpoints
🔐 Authentication Endpoints
-POST /auth/signup
Register new user with email/password
Returns: User object + JWT tokens
-POST /auth/login
Authenticate user with email/password
Returns: User object + JWT tokens
-POST /auth/resend-verification
Resend email verification link

📸 Image Endpoints (Protected - Require JWT)

POST /api/images
Upload image (multipart/form-data)
Headers: Authorization: Bearer <token>
Body: image file field
Returns: Uploaded image metadata

GET /api/images
Get all images for authenticated user
Returns: Array of image objects

GET /api/images/:id
Get specific image by ID
Returns: Single image object

DELETE /api/images/:id
Delete image from Backblaze + database
Returns: Success message

🩺 Health Check
GET /health
Server status check
Returns: {"status":"OK","message":"Server is running"}

⚙️ Setup & Installation

1. Clone Repository
   bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo/backend
2. Install Dependencies
   bash
   npm install
3. Environment Configuration
   Create .env file:

env

# Server

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
B2_ENDPOINT=https://s3.eu-central-003.backblazeb2.com 4. Database Setup
Run this SQL in Supabase SQL editor:

sql
CREATE TABLE images (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id UUID REFERENCES auth.users(id) NOT NULL,
filename TEXT NOT NULL,
original_name TEXT NOT NULL,
url TEXT NOT NULL,
size INTEGER NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Users can view own images" ON images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own images" ON images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own images" ON images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own images" ON images FOR DELETE USING (auth.uid() = user_id); 5. Start Development Server
bash
npm run dev
Server runs at: http://localhost:3000

🧪 Testing with Postman

1. User Registration
   http
   POST http://localhost:3000/auth/signup
   Content-Type: application/json

{
"email": "test@example.com",
"password": "password123"
} 2. User Login
http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
"email": "test@example.com",
"password": "password123"
}
Save the JWT token from response for authenticated requests.

3. Upload Image
   http
   POST http://localhost:3000/api/images
   Authorization: Bearer <your-jwt-token>
   Content-Type: multipart/form-data

# Body: form-data with key "image" and select image file

4. List Images
   http
   GET http://localhost:3000/api/images
   Authorization: Bearer <your-jwt-token>
5. Delete Image
   http
   DELETE http://localhost:3000/api/images/:image-id
   Authorization: Bearer <your-jwt-token>
   🐳 Docker Deployment
   Build and Run with Docker
   bash
   docker-compose up -d --build
   Docker Compose File
   yaml
   version: '3.8'
   services:
   app:
   build: .
   ports: - "3000:3000"
   env_file: - .env
   restart: unless-stopped
   ☁️ AWS EC2 Deployment
6. Launch EC2 Instance
   Amazon Linux 2023 AMI

t2.micro (free tier)

Open ports: 22 (SSH), 3000 (App), 80 (HTTP)

2. Connect to EC2
   bash
   ssh -i "your-key.pem" ec2-user@your-ec2-ip
3. Install Dependencies
   bash
   sudo dnf install docker -y
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -a -G docker ec2-user

# Install Docker Compose

sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose 4. Deploy Application
bash

# Transfer code to EC2

scp -i "your-key.pem" -r ./backend ec2-user@your-ec2-ip:/home/ec2-user/

# On EC2: Setup environment and start

cd /home/ec2-user/backend
nano .env # Add your environment variables
docker-compose up -d --build 5. Configure Nginx (Optional)
bash
sudo yum install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
🔧 Environment Variables
Variable Description Required
PORT Server port Yes
NODE_ENV Environment mode Yes
SUPABASE_URL Supabase project URL Yes
SUPABASE_ANON_KEY Supabase anonymous key Yes
SUPABASE_SERVICE_ROLE_KEY Supabase service role key Yes
B2_APPLICATION_KEY_ID Backblaze key ID Yes
B2_APPLICATION_KEY Backblaze application key Yes
B2_BUCKET_NAME Backblaze bucket name Yes
B2_BUCKET_ID Backblaze bucket ID Yes
B2_ENDPOINT Backblaze endpoint URL Yes

📋 Project Structure

backend/
├── src/
│ ├── config/
│ │ ├── supabase.js # Supabase configuration
│ │ └── backblaze.js # Backblaze B2 configuration
│ ├── controllers/
│ │ ├── auth.js # Authentication logic
│ │ └── images.js # Image handling logic
│ ├── middleware/
│ │ └── auth.js # JWT authentication middleware
│ ├── routes/
│ │ ├── auth.js # Authentication routes
│ │ └── images.js # Image management routes
│ ├── utils/
│ │ └── upload.js # Multer upload configuration
│ └── index.js # Main server file
├── .env # Environment variables
├── .gitignore # Git ignore rules
├── Dockerfile # Docker configuration
├── docker-compose.yml # Docker compose setup
├── package.json # Dependencies and scripts
└── README.md # Project documentation

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

🤝 Contributing
Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit changes (git commit -m 'Add amazing feature')
Push to branch (git push origin feature/amazing-feature)
Open a Pull Request
