# Device Inventory Service

## Overview

The Device Inventory Service manages the catalogue of supported devices and tracks current availability levels. It provides read and update operations required to support reservation and loan workflows.

The service is implemented as a stateless backend component and deployed as an Azure Function App.

---

## Responsibilities

- Maintain the device catalogue
- Track the number of available devices per model
- Provide read-only endpoints for device browsing
- Apply controlled updates when devices are reserved or returned

---

## Architecture

- Runtime: Node.js (Azure Functions)
- Communication: HTTP-based APIs (JSON)
- Data Storage: Managed cloud database service
- State Management: Stateless service with externalised persistence

The service is designed to scale independently and does not share a database directly with other services.

---

## Security

- Public read endpoints are restricted to authenticated users
- Update operations are protected by JWT validation
- All access control decisions are enforced server-side

---

## Deployment

- Deployed as an Azure Function App
- Built and deployed automatically using GitHub Actions
- Environment-specific configuration is provided via environment variables

---

## Notes

This service supports the minimum viable functionality required for the assessment. Additional features such as advanced consistency control are considered out of scope.
