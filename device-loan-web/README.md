# Campus Device Loan Web Application

## Overview

The Campus Device Loan Web Application provides a browser-based interface for students and staff to interact with the Campus Device Loan System. It enables users to browse devices, make reservations, and perform staff operations where authorised.

The frontend does not contain business logic or security enforcement and communicates exclusively with backend services via HTTPS.

---

## Features

- Device browsing and availability display
- Secure user login via external identity provider
- Reservation creation for student users
- Staff-only interfaces for collection and return actions
- Role-aware user interface rendering

---

## Architecture

- Framework: React
- Communication: HTTPS requests to backend APIs
- Authentication: OAuth 2.0 / OpenID Connect via external provider
- State Management: Client-side only (no persistent storage)

The frontend is intentionally kept lightweight and delegates all business logic and security decisions to backend services.

---

## Security Considerations

- The frontend does not store credentials
- JWTs are obtained via the authentication provider
- All access control is enforced server-side
- UI-level role checks are for usability only

---

## Deployment

- Deployed as a cloud-hosted web application
- Automatically built and deployed via CI/CD pipeline
- No local environment configuration is required for demonstration

---

## Notes

The frontend is designed to support the assessed system scope. Advanced UI features and visual enhancements were deprioritised in favour of architectural clarity and backend security.