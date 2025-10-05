# Trinity College Campus Safety Shuttle Tracker

## Overview

The Trinity College Campus Safety Shuttle Tracker is a modern, student-focused web application designed to enhance mobility and safety around campus.
It enables students to track campus shuttles in real time, receive arrival estimates, and access a built-in chatbot for quick assistance — all while ensuring secure authentication through institutional email verification.

This project promotes accessibility and reliability, helping students brave New England’s wind, rain, and snow with confidence.

---

## Contributors

- Shamsher Ghising Tamang
- Noella Uwayisenga
- Gabriel Koomson

---

## System Modules
Module	Description
Student Portal	Allows students to view live shuttle locations, ETAs, and recommended departure times to reach the nearest stop.
Driver Dashboard	Lets drivers clock in/out, update their status, and share GPS data used for real-time tracking.
Admin Console	Provides administrative controls to assign drivers, monitor routes, and view analytics or usage statistics.
Chatbot Assistant	Integrated AI chatbot powered by the OpenAI API to answer common transportation queries and provide route guidance.
Email Verification System	Ensures only verified Trinity College users (@trincoll.edu) can access the service, maintaining safety and privacy.

---

# Languages and Frameworks

- **Frontend**:	React
- **Backend**: Java (Spring Boot)
- Database / Auth	Supabase
- AI / NLP	OpenAI API
- Web Server / Deployment	Nginx


🧭 User Interface & Core Features
For Students

Real-time map to track shuttle position and ETA.

Smart notifications to suggest when to start walking to the nearest stop.

Integrated chatbot for FAQs (schedules, routes, delays, etc.).

Secure email-based login using @trincoll.edu.

For Admins

Manage driver accounts and assignments.

Monitor route activity and system performance metrics.

Review shuttle operation logs and usage analytics.

🚐 For Drivers

Simple clock-in/clock-out interface.

Automatic GPS-based shuttle tracking updates.

Integration with admin dashboard for performance visibility.

Architecture Summary

The application follows a modular microservice architecture, consisting of:

Frontend (React App) — for user interaction and live updates.

Backend (Spring Boot) — REST API for logic and data processing.

Database (Supabase) — centralized storage for users, routes, and telemetry.

AI Service (OpenAI) — enables natural language queries via the chatbot.

Nginx Gateway — manages routing and deployment traffic.

Future Enhancements

Push notifications for shuttle arrival and route delays.

Historical analytics dashboard for administrators.

Integration with Trinity’s ID system for single sign-on (SSO).

Dark mode and mobile app version.

Acknowledgments

This project was developed as part of CPSC 415 – Cloud Native Applications, Trinity College, Fall 2025.
Special thanks to the course instructors and teaching assistants for their guidance and support.
