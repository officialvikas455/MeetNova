# 🚀 MeetNova — Video Conferencing Platform

> A modern, real-time video conferencing platform built for seamless virtual meetings, collaboration, and communication.

**MeetNova** is a Zoom-inspired video conferencing application that enables users to create and join virtual meetings with real-time video/audio communication. It is built using modern web technologies with a focus on **real-time communication, scalability, authentication, and responsive UI**.

---

## 🌐 Live Demo

🔗 *Live*:** `https://meetnovafrontend.onrender.com`

🎥 **Demo Video:** `Coming Soon`

---

## ✨ Features

### 🎥 Video Conferencing

* Real-time video and audio communication
* Join meetings using a meeting ID
* Multiple participants in a meeting
* Camera and microphone controls
* Leave meeting functionality

### 🔐 Authentication

* User registration and login
* Secure authentication
* Protected routes
* Persistent user sessions

### 💬 Real-Time Communication

* Real-time signaling using Socket.IO
* WebRTC-based peer-to-peer communication
* Instant participant updates
* Real-time meeting events

### 🖥️ Meeting Experience

* Create a new meeting
* Join an existing meeting
* Participant management
* Responsive meeting interface
* Meeting controls

### 🎨 Modern UI

* Responsive design
* Clean and minimal interface
* Mobile-friendly layout
* Modern dashboard
* Interactive meeting controls

---

## 🛠️ Tech Stack

### Frontend

| Technology          | Purpose                   |
| ------------------- | ------------------------- |
| ⚛️ React.js         | Frontend UI               |
| ⚡ Vite              | Development & Build Tool  |
| 🎨 Tailwind CSS     | Styling                   |
| 🔀 React Router     | Client-side Routing       |
| 🔌 Socket.IO Client | Real-time communication   |
| 🌐 WebRTC           | Video/Audio communication |

### Backend

| Technology    | Purpose             |
| ------------- | ------------------- |
| 🟢 Node.js    | Backend Runtime     |
| 🚂 Express.js | REST API            |
| 🔌 Socket.IO  | Real-time signaling |
| 🍃 MongoDB    | Database            |
| 🧩 Mongoose   | MongoDB ODM         |
| 🔐 JWT        | Authentication      |
| 🔒 bcrypt     | Password Hashing    |

---

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │       MeetNova       │
                    │   Video Conferencing │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
          ┌──────▼──────┐             ┌──────▼──────┐
          │   Frontend  │             │   Backend   │
          │    React    │             │ Node/Express│
          └──────┬──────┘             └──────┬──────┘
                 │                           │
                 │                     ┌─────▼─────┐
                 │                     │  MongoDB  │
                 │                     └───────────┘
                 │
          ┌──────▼──────┐
          │   WebRTC    │
          │ Video/Audio │
          └──────┬──────┘
                 │
          ┌──────▼──────┐
          │  Socket.IO  │
          │  Signaling  │
          └─────────────┘
```

---

## 📂 Project Structure

```text
MeetNova/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── socket/
│   ├── app.js
│   └── package.json
│
├── .gitignore
├── README.md
└── package.json
```

---

# ⚙️ Getting Started

Follow the steps below to run MeetNova locally.

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/MeetNova.git

cd MeetNova
```

---

## 2️⃣ Install Frontend Dependencies

```bash
cd frontend

npm install
```

---

## 3️⃣ Install Backend Dependencies

Open another terminal:

```bash
cd backend

npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=5001

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173
```

> ⚠️ Never commit your `.env` file to GitHub.

Make sure `.gitignore` contains:

```gitignore
node_modules/
.env
dist/
```

---

# ▶️ Run the Application

### Start Backend

```bash
cd backend

npm run dev
```

Backend will run on:

```text
http://localhost:5001
```

### Start Frontend

Open another terminal:

```bash
cd frontend

npm run dev
```

Frontend will run on:

```text
http://localhost:5173
```

---

# 🔄 How MeetNova Works

### 1. User Authentication

```text
User
 ↓
Register/Login
 ↓
Backend API
 ↓
MongoDB
 ↓
JWT Authentication
 ↓
Authenticated User
```

### 2. Creating a Meeting

```text
User
 ↓
Create Meeting
 ↓
Generate Meeting ID
 ↓
Meeting Room Created
 ↓
Share Meeting ID
```

### 3. Joining a Meeting

```text
User
 ↓
Enter Meeting ID
 ↓
Backend validates meeting
 ↓
Join Socket.IO Room
 ↓
WebRTC Signaling
 ↓
Peer Connection
 ↓
Real-Time Video/Audio
```

---

# 🧠 Key Technologies Explained

## WebRTC

MeetNova uses **WebRTC** for real-time peer-to-peer audio and video communication.

WebRTC allows browsers to communicate directly with each other without sending the actual media stream through the backend server.

```text
Browser A
    │
    │ WebRTC
    │
    ▼
Browser B
```

---

## Socket.IO

Socket.IO is used for real-time signaling and meeting events.

It handles things like:

* User joining
* User leaving
* Offer/Answer exchange
* ICE candidates
* Participant updates
* Meeting room events

```text
Client A
   │
   │
   ▼
Socket.IO Server
   │
   │
   ▼
Client B
```

---

# 🔐 Security

MeetNova implements several security practices:

* Password hashing with bcrypt
* JWT-based authentication
* Protected API routes
* Environment variables for secrets
* `.env` excluded from Git
* Server-side authentication validation

---

# 📸 Screenshots

### 🏠 Landing Page

> Add your screenshot here.

```text
![MeetNova Landing Page](./screenshots/home.png)
```

### 📊 Dashboard

```text
![MeetNova Dashboard](./screenshots/dashboard.png)
```

### 🎥 Video Meeting

```text
![MeetNova Meeting](./screenshots/meeting.png)
```

---

# 🚀 Future Improvements

MeetNova is continuously evolving. Planned features include:

* [ ] Screen sharing
* [ ] In-meeting chat
* [ ] Meeting recording
* [ ] Virtual backgrounds
* [ ] Noise cancellation
* [ ] Host controls
* [ ] Participant mute controls
* [ ] Waiting room
* [ ] Meeting scheduling
* [ ] Meeting history
* [ ] Cloud recording
* [ ] TURN/STUN server optimization
* [ ] Better scalability for large meetings
* [ ] Deployment with CI/CD
* [ ] Redis-based Socket.IO scaling

---

# 📈 Learning Outcomes

Building MeetNova helped me gain practical experience with:

* Full-stack development
* React application architecture
* REST API development
* Authentication & authorization
* MongoDB database design
* WebRTC
* Socket.IO
* Real-time communication
* Client-server architecture
* Environment configuration
* Git & GitHub
* Debugging production-like issues

---

# 🧪 Testing

Run frontend tests:

```bash
npm test
```

Run backend tests:

```bash
npm test
```

> Testing setup may vary depending on the current project configuration.

---

# 🤝 Contributing

Contributions are welcome!

### Fork the repository

```bash
git clone https://github.com/YOUR_USERNAME/MeetNova.git
```

### Create a branch

```bash
git checkout -b feature/new-feature
```

### Commit your changes

```bash
git add .

git commit -m "Add new feature"
```

### Push your branch

```bash
git push origin feature/new-feature
```

Then open a Pull Request.

---

# 📄 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

**Vikas Gangwar**

💻 Full Stack Developer
🎯 Interested in Software Engineering, Backend Development & AI


---

# ⭐ Support

If you found **MeetNova** useful or interesting, consider giving the repository a ⭐.

It helps support the project and motivates further development.

---

## 💡 Built With

```text
React + Node.js + Express + MongoDB
              +
        Socket.IO + WebRTC
              =
           MeetNova 🚀
```

**MeetNova — Connect. Collaborate. Communicate.**
