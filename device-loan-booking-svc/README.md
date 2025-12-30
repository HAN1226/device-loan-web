# Device Loan Booking Service

## Overview

The Device Loan Booking Service is a backend service responsible for managing the device loan lifecycle within the Campus Device Loan System. It handles reservation creation, loan collection, and device return workflows.

This service is implemented as a stateless cloud-native component and is deployed as an Azure Function App.

---

## Responsibilities

- Create and manage device reservations
- Assign standard loan durations
- Record collection and return events
- Enforce role-based access control for staff-only operations
- Coordinate with the inventory service to update device availability

---

## Architecture

- Runtime: Node.js (Azure Functions)
- Communication: HTTP-based APIs (JSON)
- Authentication: OAuth 2.0 / OpenID Connect (JWT validation)
- Authorisation: Role-based access control enforced server-side
- Data Storage: Managed cloud database accessed via environment variables

This service does not maintain session state and can scale horizontally.

---

## Security

- All protected endpoints require a valid JWT
- Role claims are validated on every request
- Staff-only endpoints return HTTP 403 for unauthorised access
- No secrets or credentials are stored in source control

---

## Deployment

- Deployed as an Azure Function App
- Automatically built and deployed via GitHub Actions
- Configuration is managed using environment variables

---

## Notes

This service forms part of the minimum viable system for the assessment. Some integrations shown in architecture diagrams are conceptual or post-MVP and are not fully implemented in this service.
