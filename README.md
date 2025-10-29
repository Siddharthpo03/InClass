# InClass

InClass is a web-based attendance management system for educational institutions.

## Project Structure

```
InClass/
├── frontend/          # React + Vite frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/           # Express.js backend API
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── package.json
│   └── server.js
└── inclass.db         # SQLite database
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm run server
```

The backend server will run on `http://localhost:3000` (or the port specified in your configuration).

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend application will be available at `http://localhost:5173` (or the port shown in the terminal).

## Features

- User authentication and authorization
- Student, Faculty, and Admin dashboards
- Real-time attendance tracking
- Geolocation-based attendance verification
- Email notifications

## Technologies Used

### Frontend

- React 19
- Vite
- React Router
- Axios

### Backend

- Node.js
- Express.js
- SQLite
- JWT Authentication
- bcrypt
- Nodemailer
- Googleapis
