# Trinity College Campus Safety Shuttle Tracker

## Overview

The **Trinity College Campus Safety Shuttle Tracker** is a modern, student-focused web application designed to enhance mobility and safety around campus. It enables students to track campus shuttles in real time, receive arrival estimates, and access a built-in chatbot for quick assistance — all while ensuring secure authentication through institutional email verification.

This project promotes accessibility and reliability, helping students navigate campus confidently regardless of New England's challenging weather conditions.

---

## Contributors

- Shamsher Ghising Tamang
- Noella Uwayisenga
- Gabriel Koomson

---

## System Modules

| Module | Description |
|--------|-------------|
| **Student Portal** | Allows students to view live shuttle locations, ETAs, and recommended departure times to reach the nearest stop. |
| **Driver Dashboard** | Lets drivers clock in/out, update their status, and share GPS data used for real-time tracking. |
| **Admin Console** | Provides administrative controls to assign drivers, monitor routes, and view analytics or usage statistics. |
| **Chatbot Assistant** | Integrated AI chatbot powered by the OpenAI API to answer common transportation queries and provide route guidance. |
| **Email Verification System** | Ensures only verified Trinity College users (@trincoll.edu) can access the service, maintaining safety and privacy. |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React |
| **Backend** | Java (Spring Boot) |
| **Database & Authentication** | Supabase |
| **AI / NLP** | OpenAI API |
| **Web Server & Deployment** | Nginx |

---

## Key Features

### For Students
- **Real-time Tracking**: Live map displaying shuttle position and estimated time of arrival
- **Smart Notifications**: Intelligent alerts suggesting optimal departure times to reach the nearest stop
- **AI Chatbot**: Instant answers to FAQs about schedules, routes, delays, and more
- **Secure Access**: Email-based authentication restricted to @trincoll.edu addresses

### For Drivers
- **Simple Clock-In/Out**: Streamlined interface for shift management
- **Automatic GPS Tracking**: Real-time location updates with minimal driver interaction
- **Performance Visibility**: Integration with admin dashboard for route monitoring

### For Administrators
- **Driver Management**: Assign, monitor, and manage driver accounts
- **Route Monitoring**: Real-time oversight of shuttle operations and route performance
- **Analytics Dashboard**: Comprehensive usage statistics and system performance metrics
- **Operation Logs**: Detailed history of shuttle activities and system events

---

## System Architecture

The application follows a **modular microservice architecture** with clear separation of concerns:

```
┌─────────────────┐
│  React Frontend │ ← User Interface & Real-time Updates
└────────┬────────┘
         │
┌────────▼────────┐
│  Nginx Gateway  │ ← Routing & Load Distribution
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──────┐  │
│  Spring  │  │  ┌──────────┐
│   Boot   │◄─┴──► Supabase │ ← Centralized Storage
│ Backend  │     └──────────┘
└────┬─────┘
     │
┌────▼─────┐
│ OpenAI   │ ← Natural Language Processing
│   API    │
└──────────┘
```

### Component Breakdown

1. **Frontend (React)** — Responsive user interface with real-time updates
2. **Backend (Spring Boot)** — RESTful API handling business logic and data processing
3. **Database (Supabase)** — User management, route data, and GPS telemetry storage
4. **AI Service (OpenAI)** — Powers the intelligent chatbot for natural language queries
5. **Nginx Gateway** — Manages request routing, load balancing, and deployment traffic

---

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Java JDK 17+
- Maven
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/Gabbykoms/Ctrl-Alt-Elite.git
cd trinity-shuttle-tracker

# Frontend setup
cd frontend
npm install
npm start

# Backend setup
cd ../backend
mvn clean install
mvn spring-boot:run
```

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Frontend `.env`:**
```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_KEY=your_supabase_key
```

**Backend `application.properties`:**
```
openai.api.key=your_openai_key
supabase.url=your_supabase_url
supabase.key=your_supabase_service_key
```

---

## Security & Privacy

- **Email Verification**: Access restricted to verified @trincoll.edu email addresses
- **Secure Authentication**: Token-based authentication via Supabase
- **Data Protection**: GPS data and user information encrypted in transit and at rest
- **Privacy First**: Location data retained only for operational purposes

---

## Future Enhancements

- [ ] Push notifications for shuttle arrival alerts and route delays
- [ ] Integration with Trinity's ID system for single sign-on (SSO)
- [ ] Native mobile applications (iOS & Android)
- [ ] Multi-language support for international students
- [ ] Accessibility features (screen reader optimization, high contrast mode)
- [ ] Route optimization based on demand patterns

---

## Acknowledgments

This project was developed as part of CPSC 415 – Cloud Native Applications, Trinity College, Fall 2025.
Special thanks to the course instructor (@javajon) for his guidance and support.

---

## Contact

For questions, feedback, or contributions, please contact the development team through Trinity College email addresses.

**Project Repository**: https://github.com/Gabbykoms/Ctrl-Alt-Elite.git  
