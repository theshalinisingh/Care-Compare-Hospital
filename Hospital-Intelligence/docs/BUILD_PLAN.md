# Build and learning plan

## Phase 1 — Understand the app
1. Open `frontend/src/App.jsx` and identify the React state variables.
2. Trace how `filtered` is derived from search, city, speciality and emergency filters.
3. Follow `toggle()` to understand selecting hospitals for comparison.
4. Inspect `frontend/src/styles.css` and identify responsive breakpoints.

## Phase 2 — Understand the backend
1. Start with `backend/src/server.js` and follow middleware registration.
2. Read `backend/src/routes/hospitals.js` to understand REST endpoints.
3. Read `backend/src/prisma.js` and `backend/prisma/schema.prisma`.
4. Read `backend/src/services/scoring.js`; change one weight and test the output.

## Phase 3 — Extend safely
- Add pagination and server-side sorting.
- Add protected admin CRUD routes and corresponding screens.
- Add form validation and accessible loading/error/empty states.
- Add tests for filtering, scoring, auth and comparison limits.
- Add source name, last-updated timestamp and verification status to every externally sourced data record.

## Suggested manual test cases
- Search for `Meerut` and verify only Meerut records appear.
- Select Orthopaedics and verify records without that service are excluded.
- Toggle emergency filter.
- Select two hospitals and compare; verify selecting fewer than two does not open comparison.
- Select five hospitals; verify the UI caps selection at four.
- Stop the API and verify the frontend enters Demo mode.
- Try registering twice with the same email; the second request should return a conflict.
