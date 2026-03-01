# Pages Inventory

- route: /
  component: src/App.tsx
  data-objects: [devices, bookings, user]
  data-sources:
    devices: inventory API (/getDevices)
    bookings: booking API (/bookings)
    user: booking API (/login)
  backend-status: existing API
