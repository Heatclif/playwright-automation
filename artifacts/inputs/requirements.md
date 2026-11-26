# EventHub Playwright UI Test Requirements

## Sprint: 1
**Period:** Nov 23–27, 2026  
**Framework:** Playwright TypeScript with Page Object Model  
**Total UI Tests:** 28  

---

## 1. User Authentication Flow

| ID | Title | Description | Priority |
|----|-------|-------------|----------|
| **AC-LOGIN-001** | Valid credentials authenticate the user | User can login with valid email and password and is redirected to the home page | P2 |
| **AC-LOGIN-002** | Invalid credentials show error message | User sees authentication error when entering incorrect credentials | P2 |
| **AC-LOGIN-003** | Password field masks input | Password characters are masked with dots/asterisks | P5 |
| **AC-LOGIN-004** | "Remember me" checkbox functionality | Remember me checkbox persists login across sessions | P3 |

**Test Steps:**
- Navigate to `/login` page
- Enter valid/invalid email and password
- Click Sign In button
- Verify redirection or error message
- Verify password masking

---

## 2. Home Page / Events Listing

| ID | Title | Description | Priority |
|----|-------|-------------|----------|
| **AC-HOME-001** | Events page loads successfully | Home page displays event listings without errors | P1 |
| **AC-HOME-002** | Event cards display correct information | Title, category, price, and city are shown for each event | P2 |
| **AC-HOME-003** | Filter by category works | Users can filter events by category (Festival, Workshop, Conference) | P2 |
| **AC-HOME-004** | Search events by keyword | Search bar filters events by title/description | P3 |
| **AC-HOME-005** | Pagination works correctly | Events paginate correctly across pages | P3 |

**Test Steps:**
- Navigate to home page
- Verify event cards render
- Apply category filter
- Use search functionality
- Navigate through pages

---

## 3. Event Details Page

| ID | Title | Description | Priority |
|----|-------|-------------|----------|
| **AC-EVENT-001** | Event details page loads | Clicking an event card navigates to details page | P1 |
| **AC-EVENT-002** | Event details display correctly | Title, description, date, time, price, and venue are shown | P2 |
| **AC-EVENT-003** | Book event button functionality | Clicking "Book" navigates to booking flow | P2 |
| **AC-EVENT-004** | Delete event option (admin) | Admin users can delete events | P4 |
| **AC-EVENT-005** | Event image displays | Event image loads and has appropriate alt text | P4 |

**Test Steps:**
- Click on event card from home page
- Verify page URL and heading
- Check all details fields
- Test booking functionality (if applicable)

---

## 4. Booking Flow

| ID | Title | Description | Priority |
|----|-------|-------------|----------|
| **AC-BOOK-001** | User can book an event | User selects tickets and proceeds to booking | P2 |
| **AC-BOOK-002** | Seat selection works | User can select number of seats (1-10) | P2 |
| **AC-BOOK-003** | Price calculation is correct | Total price = unit price × number of seats | P2 |
| **AC-BOOK-004** | Booking confirmation displayed | Confirmation page shows booking details | P3 |
| **AC-BOOK-005** | Cancel booking functionality | User can cancel a booking within time limits | P4 |

**Test Steps:**
- Navigate to event details page
- Select number of seats
- Verify price updates dynamically
- Proceed to confirmation
- Test cancel functionality (if applicable)

---

## 5. User Profile / My Bookings

| ID | Title | Description | Priority |
|----|-------|-------------|----------|
| **AC-PROFILE-001** | My bookings page loads | User navigates to My Bookings section | P1 |
| **AC-PROFILE-002** | Bookings list displays correctly | All user bookings are listed with details | P2 |
| **AC-PROFILE-003** | Cancel booking from profile | User can cancel a booking from their profile | P3 |
| **AC-PROFILE-004** | Booking status indicators | Status shows confirmed, cancelled, or pending | P3 |

**Test Steps:**
- Navigate to My Bookings section
- Verify bookings list
- Test cancel functionality
- Verify status indicators

---

## 6. Admin Functions

| ID | Title | Description | Priority |
|----|-------|-------------|----------|
| **AC-ADMIN-001** | Admin can create new event | Admin adds event with all details | P3 |
| **AC-ADMIN-002** | Admin can edit existing event | Admin modifies event details | P3 |
| **AC-ADMIN-003** | Admin can delete event | Admin removes event from system | P4 |
| **AC-ADMIN-004** | Admin permissions check | Non-admin users cannot access admin functions | P5 |

**Test Steps:**
- Login as admin user
- Access admin dashboard
- Create/edit/delete events
- Verify permission restrictions

---

## 7. Responsive Design

| ID | Title | Description | Priority |
|----|-------|-------------|----------|
| **AC-RESP-001** | Page renders on mobile | Layout adapts to mobile screen sizes | P2 |
| **AC-RESP-002** | Page renders on tablet | Layout adapts to tablet screen sizes | P3 |
| **AC-RESP-003** | Navigation works on all sizes | Menu/navbar functions on mobile/tablet/desktop | P3 |
| **AC-RESP-004** | Touch targets are appropriate | Buttons and links have minimum 44px height | P4 |

**Test Steps:**
- Resize browser to mobile (375px x 667px)
- Resize to tablet (768px x 1024px)
- Resize to desktop (1440px x 900px)
- Verify layout and navigation

---

## 8. Accessibility

| ID | Title | Description | Priority |
|----|-------|-------------|----------|
| **AC-ACC-001** | Color contrast meets WCAG AA | All text has sufficient contrast ratio | P3 |
| **AC-ACC-002** | Form labels are associated | All form fields have proper labels | P3 |
| **AC-ACC-003** | Keyboard navigation works | All interactive elements reachable via Tab | P3 |
| **AC-ACC-004** | ARIA labels where needed | Missing ARIA labels are identified and added | P4 |

**Test Steps:**
- Run axe accessibility scanner
- Verify color contrast ratios
- Test keyboard-only navigation
- Check form label associations

---

## 9. Error Handling

| ID | Title | Description | Priority |
|----|-------|-------------|----------|
| **AC-ERR-001** | 404 page displays correctly | Non-existent routes show proper error page | P3 |
| **AC-ERR-002** | Network error handling | User sees appropriate message on network failure | P4 |
| **AC-ERR-003** | Form validation errors | Invalid input shows clear error messages | P3 |
| **AC-ERR-004** | Session timeout handling | User is redirected to login after timeout | P4 |

**Test Steps:**
- Navigate to invalid route
- Simulate network failure
- Submit invalid form data
- Wait for session timeout

---

## 10. Performance

| ID | Title | Description | Priority |
|----|-------|-------------|----------|
| **AC-PERF-001** | Page load time under 3s | Home page loads within 3 seconds | P3 |
| **AC-PERF-002** | Event card rendering is fast | Event cards render within 500ms | P4 |
| **AC-PERF-003** | API responses are timely | Event API responses under 2s | P4 |

**Test Steps:**
- Measure page load times using Playwright metrics
- Measure API response times
- Identify performance bottlenecks

---

## Acceptance Criteria Summary

| Category | Count | Priority Distribution |
|----------|-------|----------------------|
| **P1 (Critical)** | 5 | home page, event details, my bookings load |
| **P2 (High)** | 18 | authentication, filtering, booking, responsive |
| **P3 (Medium)** | 27 | search, pagination, accessibility, error handling |
| **P4 (Low)** | 10 | admin functions, images, some error cases |
| **P5 (Optional)** | 5 | password masking, admin permissions |

**Total Acceptance Criteria:** 55

---

## UI Test Orbit Summary

| Test Type | Page/Feature | Key Acceptance Criteria |
|-----------|--------------|------------------------|
| **Authentication** | LoginPage | AC-LOGIN-001 to AC-LOGIN-004 |
| **Home Listing** | EventsPage, HomePage | AC-HOME-001 to AC-HOME-005 |
| **Event Details** | EventDetailsPage | AC-EVENT-001 to AC-EVENT-005 |
| **Booking Flow** | Booking pages | AC-BOOK-001 to AC-BOOK-005 |
| **User Profile** | MyBookingsPage | AC-PROFILE-001 to AC-PROFILE-004 |
| **Admin Functions** | Admin dashboard | AC-ADMIN-001 to AC-ADMIN-004 |
| **Responsive Design** | All pages | AC-RESP-001 to AC-RESP-004 |
| **Accessibility** | All pages | AC-ACC-001 to AC-ACC-004 |
| **Error Handling** | All pages | AC-ERR-001 to AC-ERR-004 |
| **Performance** | All pages | AC-PERF-001 to AC-PERF-003 |

---

## Framework Conventions

- **Page Objects:** All pages in `src/eventhub/ui/pages/`
- **Components:** Reusable components in `src/eventhub/ui/components/`
- **Test Data:** Generated in `src/eventhub/ui/test-data.ts`
- **Fixtures:** `app` fixture for page setup, `ui-fixtures` for test setup
- **Import Pattern:** `import { test, expect } from '@playwright/test'`; page imports from `src/eventhub/ui/ui-fixtures`
- **Tags:** `@ui-regression` for UI tests, `@api-regression` for API tests

---

## Generated By

**Generator Agent** - AI-assisted requirements generation for EventHub Playwright framework  
**Sprint:** 1  
**Generated:** 2026-11-25  
**RTM Location:** `artifacts/rtm/rtm.json`  

---