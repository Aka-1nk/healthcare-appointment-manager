\# 🏥 Healthcare Appointment Manager



A full-featured healthcare appointment platform with AI-powered pre-visit and post-visit summaries.



\## 🚀 Features



\### Authentication \& Authorization

\- JWT-based authentication with refresh tokens

\- Role-based access control (Patient, Doctor, Admin)

\- Secure password hashing with bcrypt



\### User Management

\- Patient registration and profile management

\- Doctor profiles with specializations and working hours

\- Admin dashboard for managing doctors



\### Appointment System

\- Real-time availability checking

\- Double-booking prevention with optimistic locking

\- Slot hold mechanism (15-minute hold)

\- Automated appointment reminders



\### AI Integration

\- \*\*Pre-visit Summary\*\*: Analyzes symptoms and generates:

&#x20; - Urgency level (Low/Medium/High)

&#x20; - Chief complaint

&#x20; - Suggested questions for the doctor

\- \*\*Post-visit Summary\*\*: Converts clinical notes to patient-friendly language with:

&#x20; - Medication schedule

&#x20; - Follow-up steps

&#x20; - Red flags to watch for



\### Notifications \& Calendar

\- Email notifications for booking, reminders, and cancellations

\- Google Calendar integration (event creation and updates)



\## 🛠️ Tech Stack



| Technology | Purpose |

|------------|---------|

| Node.js + Express | Backend API |

| TypeScript | Type safety |

| MySQL | Database |

| Prisma | ORM |

| JWT | Authentication |

| OpenAI API | LLM summaries |

| Nodemailer | Email notifications |

| Google Calendar API | Calendar integration |

| BullMQ | Background jobs |



\## 📊 Database Schema



```prisma

model User {

&#x20; id        String   @id @default(cuid())

&#x20; email     String   @unique

&#x20; password  String

&#x20; name      String

&#x20; role      String   // PATIENT, DOCTOR, ADMIN

&#x20; patient   Patient?

&#x20; doctor    Doctor?

}



model Doctor {

&#x20; id              String    @id @default(cuid())

&#x20; userId          String    @unique

&#x20; specialization  String

&#x20; workingHours    Json      // { start: "09:00", end: "17:00" }

&#x20; slotDuration    Int       @default(30)

&#x20; consultationFee Float

&#x20; appointments    Appointment\[]

}



model Patient {

&#x20; id              String    @id @default(cuid())

&#x20; userId          String    @unique

&#x20; dateOfBirth     DateTime?

&#x20; phoneNumber     String?

&#x20; medicalHistory  String?

&#x20; appointments    Appointment\[]

}



model Appointment {

&#x20; id                String   @id @default(cuid())

&#x20; doctorId          String

&#x20; patientId         String

&#x20; datetime          DateTime

&#x20; status            String   // PENDING, CONFIRMED, CANCELLED, COMPLETED

&#x20; symptoms          String   @db.Text

&#x20; preVisitSummary   Json?

&#x20; postVisitSummary  Json?

&#x20; doctorNotes       String?  @db.Text

&#x20; prescription      String?  @db.Text

&#x20; calendarEventId   String?

}

```



\## 📡 API Endpoints



\### Authentication

```

POST   /api/auth/register     - Register new user

POST   /api/auth/login        - Login and get JWT token

GET    /api/auth/me           - Get current user (Protected)

```



\### Doctors

```

GET    /api/doctors           - Get all doctors

GET    /api/doctors/search    - Search by specialization

GET    /api/doctors/:id       - Get doctor by ID

POST   /api/doctors           - Create doctor (Admin only)

PUT    /api/doctors/:id       - Update doctor (Doctor/Admin)

DELETE /api/doctors/:id       - Delete doctor (Admin only)

```



\### Patients

```

POST   /api/patients          - Create patient profile (Protected)

GET    /api/patients/:userId  - Get patient by user ID (Protected)

```



\### Appointments

```

GET    /api/appointments/doctors/:doctorId/slots?date=YYYY-MM-DD

POST   /api/appointments/book (Protected)

GET    /api/appointments/my-appointments (Protected)

PUT    /api/appointments/:id/cancel (Protected)

PUT    /api/appointments/:id/complete (Doctor only)

```



\## 🤖 LLM Prompts



\### Pre-visit Summary

```

Analyze these symptoms and return: urgency level (Low/Medium/High), 

chief complaint, and three suggested questions for the doctor.

Symptoms: {symptoms}

```



\### Post-visit Summary

```

Convert these clinical notes into a patient-friendly summary 

with medication schedule and follow-up steps: {notes}

```



\## 🚀 Installation



\### Prerequisites

\- Node.js (v18+)

\- MySQL (v8+)

\- npm or yarn



\### Setup



1\. \*\*Clone the repository\*\*

```bash

git clone https://github.com/yourusername/healthcare-appointment-manager.git

cd healthcare-appointment-manager

```



2\. \*\*Install dependencies\*\*

```bash

cd backend

npm install

```



3\. \*\*Configure environment variables\*\*

```bash

cp .env.example .env

```

Edit `.env` with your values:

```env

DATABASE\_URL="mysql://root:password@localhost:3306/healthcare\_db"

JWT\_SECRET="your-secret-key"

OPENAI\_API\_KEY="your-openai-key"

EMAIL\_USER="your-email@gmail.com"

EMAIL\_PASS="your-app-password"

GOOGLE\_CLIENT\_ID="your-google-client-id"

GOOGLE\_CLIENT\_SECRET="your-google-client-secret"

```



4\. \*\*Setup database\*\*

```bash

npx prisma migrate dev --name init

npx prisma generate

```



5\. \*\*Start the server\*\*

```bash

npm run dev

```



\## 📦 Project Structure



```

backend/

├── src/

│   ├── controllers/     # Request handlers

│   ├── routes/          # API routes

│   ├── middleware/      # Auth, validation

│   ├── services/        # LLM, Email, Calendar

│   ├── utils/           # Helpers

│   └── types/           # TypeScript types

├── prisma/

│   └── schema.prisma    # Database schema

├── .env.example         # Environment variables template

├── package.json

└── README.md

```



\## 🔒 Security Features



\- JWT tokens with 7-day expiration

\- Password hashing with bcrypt (10 rounds)

\- Role-based access control

\- Input validation and sanitization

\- SQL injection prevention (Prisma)

\- Rate limiting (coming soon)



\## 📝 License



MIT



\## 👨‍💻 Author



Your Name

