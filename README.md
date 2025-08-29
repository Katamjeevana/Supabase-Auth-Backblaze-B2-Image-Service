📸 Supabase + Backblaze B2 Image Upload Backend

=> This project is a Node.js + Express backend that allows authenticated users to:

Sign up & log in using Supabase Auth (JWT tokens)

Upload images → stored in Backblaze B2 bucket

View their uploaded images (stored in Supabase DB + linked to Backblaze URLs)

Delete images securely

It uses:

Supabase → Authentication (JWT), Database (Postgres table images)

Backblaze B2 → File storage (like AWS S3, but cheaper)

Express → REST APIs

JWT Middleware → Validates users on every request

⚙️ Backend Architecture

Authentication (Supabase)

User signs up or logs in with email/password via /auth routes.

Supabase generates a JWT access token.

This token must be sent in every request (Authorization: Bearer <token>).

Image Upload

User sends a POST /api/images request with multipart/form-data (image field).

Backend:

Extracts file info

Generates a unique filename (userId_timestamp.png)

Uploads file to Backblaze B2 bucket

Creates a public file URL

Saves metadata in Supabase table images:

id, user_id, filename, original_name, url, size, created_at

Returns JSON with image details.

Image Retrieval

GET /api/images → Get all images for logged-in user.

GET /api/images/:id → Get a specific image (only if belongs to user).

Image Deletion

DELETE /api/images/:id → Deletes from Backblaze + Supabase DB.

🗂 Database (Supabase)

Table: images

Column Type Description
id UUID Primary key
user_id UUID From Supabase auth
filename Text Unique file name stored in Backblaze
original_name Text Original uploaded name
url Text Public Backblaze URL
size Integer File size in bytes
created_at Timestamptz Upload timestamp
🚀 API Endpoints
🔐 Authentication

Handled by Supabase.
You get JWT access token after login.

📤 Upload Image

POST /api/images

Headers:

Authorization: Bearer <supabase-jwt-token>
Content-Type: multipart/form-data

Body:

image → file

Response:

{
"message": "Image uploaded successfully",
"image": {
"id": "uuid",
"user_id": "uuid",
"filename": "user_uuid_timestamp.png",
"original_name": "logo.png",
"url": "https://bucket.backblazeb2.com/...",
"size": 3334,
"created_at": "2025-08-29T..."
}
}

📂 Get All Images

GET /api/images

Headers:

Authorization: Bearer <token>

Response:

{
"images": [
{
"id": "uuid",
"url": "https://bucket.backblazeb2.com/...png",
"original_name": "logo.png",
"created_at": "2025-08-29T..."
}
]
}

🖼 Get Single Image

GET /api/images/:id

❌ Delete Image

DELETE /api/images/:id

🛠 Setup & Run Locally
1️⃣ Clone repo
git clone https://github.com/your-username/your-repo.git
cd your-repo

2️⃣ Install dependencies
npm install

3️⃣ Setup .env

Create a .env file with:

# Supabase

SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_KEY=your-service-role-or-anon-key

# Backblaze B2

B2_APPLICATION_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-app-key
B2_BUCKET_ID=your-bucket-id
B2_BUCKET_NAME=Supabasestoragebucket
B2_ENDPOINT=https://s3.eu-central-003.backblazeb2.com

4️⃣ Start server
npm run dev

Server runs at: http://localhost:3000

🧪 Testing with Postman

Sign up/login → Get JWT token from Supabase

Upload image:

POST http://localhost:3000/api/images

Add Authorization: Bearer <token>

Upload file as form-data key image

List images:

GET http://localhost:3000/api/images

View one image:

GET http://localhost:3000/api/images/:id

Delete image:

DELETE http://localhost:3000/api/images/:id

☁️ Deployment (AWS Example)

Deploy Express app on EC2 / ECS / Fargate

Store .env as Secrets Manager / SSM Parameter Store

Supabase handles Auth & Database (cloud-hosted)

Backblaze handles Storage (S3-compatible, works same as AWS S3 SDKs)
