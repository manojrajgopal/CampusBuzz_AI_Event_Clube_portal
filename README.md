# CampusBuzz - College Club & Event Management Platform

CampusBuzz is a web-based platform that allows students to create clubs, apply to join clubs, manage events, and interact with teachers and club leaders. It has separate roles for **students, club admins, and system admins**, with a robust backend built using **FastAPI** and frontend using **React**.

---

## System Structure

CampusBuzz/
│
├── backend/ # FastAPI backend
│ ├── main.py # Entry point for backend
│ ├── routes/ # API route files
│ ├── models/ # Pydantic models
│ ├── middleware/ # Auth and other middleware
│ ├── utils/ # Helper functions
│ └── config/ # Database and environment configuration
│
├── frontend/ # React frontend
│ ├── src/
│ │ ├── pages/ # React pages
│ │ ├── components/ # React components
│ │ └── api.js # API helper for backend calls
│ └── package.json
│
└── README.md # Project documentation


---

## Features

- Student profile creation & management
- Club creation and join requests
- Club leader & subleader management
- Teacher assignment to clubs
- Admin approval for clubs and applications
- Event creation and management
- Role-based access control (Student / Club / Admin)

---

## Backend Setup

1. Navigate to backend folder:
```bash(our folder path)
... cd backend

2. Create Python virtual environment:

python -m venv venv

3. Activate the virtual environment:->

4. Windows:
source venv/Scripts/activate

5. Linux / Mac:
source venv/bin/activate

6.Install required packages:
pip install -r requirements.txt

7.Setup .env file in backend/ folder:
MONGODB_URI="your_MONGODB_URI"
DB_NAME="campusbuzz"
JWT_SECRET="Random-secret-code"
JWT_ALGORITHM=HS256
JWT_EXP_MINUTES=10080


8.Run the backend server:
uvicorn main:app --reload
# or
python app.py

9.Frontend Setup
Navigate to frontend folder:
cd frontend


10.Install dependencies:
npm install

11.Start the development server:
npm start


Notes

The backend uses FastAPI and connects to MongoDB.
JWT-based authentication is used for role management.
Frontend uses React for dynamic UI and API integration.
Ensure the .env file is properly configured before running the backend.
The system has role-based access control: student, club, and admin.
