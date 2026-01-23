# Comprehensive Test Plan - Mauli Dairy

This plan focuses on verifying core functionality for each role, key backend APIs, cron logic, notifications, and integrations. It is designed to be executed manually or turned into automated tests.

---

## 0) Environment & Preconditions

**P0.1 - Backend running**
- Steps: Start backend with correct `.env` (JWT secret, Razorpay keys, Firebase).
- Expected: Server starts without errors, database connected.

**P0.2 - Frontend running**
- Steps: Start frontend dev server.
- Expected: App loads without console errors.

**P0.3 - Test data**
- Setup:
  - One `super_admin`
  - One `admin` with `dairy_name` + rates + delivery charges
  - Users: morning, evening, both, pending approval, inactive
  - Delivery boys: at least 1
  - Farmers: at least 1 with payment history
  - DeliveryStatus rows for today + last month
  - Additional orders today
  - Vacation records for users
  - Payment details (UPI + QR)

---

## 1) Authentication & Role Routing

**A1 - Login success (each role)**
- Steps: Login with valid credentials (admin/user/super_admin/farmer/delivery_boy).
- Expected: Redirect to correct dashboard based on role.

**A2 - Login failure - invalid password**
- Steps: Login with invalid password.
- Expected: Error message, no cookie/token stored.

**A3 - Login failure - unknown email/phone**
- Steps: Login with unknown identifier.
- Expected: Error message, no redirect.

**A4 - Role-based route protection**
- Steps: Login as user, attempt `/admin-dashboard`.
- Expected: Redirect to `/`.

**A5 - Token missing**
- Steps: Delete cookie and navigate to protected routes.
- Expected: Redirect to `/`.

**A6 - Cookie role decrypt error**
- Steps: Corrupt cookie role value.
- Expected: Redirect to `/`, error popup.

---

## 2) Super Admin

**SA1 - Admin registration**
- Steps: Register admin with unique dairy name, logo upload.
- Expected: Admin created, visible in admin list.

**SA2 - Duplicate dairy name**
- Steps: Register with existing dairy name.
- Expected: Validation error.

**SA3 - Duplicate email/phone across roles**
- Steps: Register admin with email/phone that exists in another role.
- Expected: Validation error.

**SA4 - Admin status update**
- Steps: Change admin approval status.
- Expected: Admin access updated accordingly.

**SA5 - Admin payment update**
- Steps: Update admin payment status (subscription/payment).
- Expected: Status updated.

**SA6 - SuperAdmin login**
- Steps: Login as super_admin.
- Expected: Redirect to superadmin dashboard.

**SA7 - Festival test endpoint**
- Steps: Call `/api/superadmin/test-festival-greetings` with date.
- Expected: Festival greetings sent to customer tokens.

---

## 3) Admin - Core Dashboard & Users

**AD1 - Admin dashboard loads**
- Steps: Login as admin, open `/admin-dashboard`.
- Expected: Metrics load without errors.

**AD2 - Approve pending user**
- Steps: Approve user from `/user-request`.
- Expected: User status updated, becomes active.

**AD3 - Reject pending user**
- Steps: Reject or keep pending user.
- Expected: User remains inactive.

**AD4 - Add new customer**
- Steps: Admin adds user from UI.
- Expected: User created with dairy_name.

**AD5 - Duplicate user email/phone across roles**
- Steps: Add user with email in another role.
- Expected: Error on validation.

**AD6 - Customer list**
- Steps: Open `/admin-customer-list`.
- Expected: Shows customers for this dairy only.

---

## 4) Admin - Rates & Milk

**AR1 - Add rates**
- Steps: Add cow/buffalo/pure rate and delivery charges.
- Expected: Rates saved and displayed on UI.

**AR2 - Update rates**
- Steps: Update existing rates.
- Expected: Rates updated and reflected in user payment calc.

**AR3 - Rates validation**
- Steps: Submit negative or empty rate.
- Expected: Validation error.

---

## 5) Admin - Orders (Morning/Evening/Additional)

**AO1 - Morning orders list**
- Steps: Open `/customer-morning`.
- Expected: Only morning/both shift users.

**AO2 - Evening orders list**
- Steps: Open `/customer-evening`.
- Expected: Only evening/both shift users.

**AO3 - Additional orders**
- Steps: Open `/additional-orders`.
- Expected: Shows additional orders for today.

**AO4 - Delivered morning list**
- Steps: Open delivered morning endpoint.
- Expected: Shows delivered morning users only.

**AO5 - Delivered evening list**
- Steps: Open delivered evening endpoint.
- Expected: Shows delivered evening users only.

---

## 6) Delivery Boy

**DB1 - Delivery boy login**
- Steps: Login as delivery_boy.
- Expected: Access to delivery screens.

**DB2 - Pending morning orders**
- Steps: Open morning pending list.
- Expected: Only morning/both, not delivered, not on vacation.

**DB3 - Pending evening orders**
- Steps: Open evening pending list.
- Expected: Only evening/both, not delivered, not on vacation.

**DB4 - Mark delivered (morning)**
- Steps: Submit delivery with status true.
- Expected: DeliveryStatus created, user.delivered_morning = true.

**DB5 - Mark not present (morning)**
- Steps: Submit delivery with status false.
- Expected: DeliveryStatus created, user.delivered_morning remains false.

**DB6 - Time gate for morning**
- Steps: Attempt morning update after 14:00.
- Expected: Error message.

**DB7 - Time gate for evening**
- Steps: Attempt evening update before 14:00.
- Expected: Error message.

**DB8 - Delivered orders history**
- Steps: Fetch delivered orders for user.
- Expected: Shows correct records, with quantities parsed.

---

## 7) Admin - Delivery Boy Management

**AB1 - Register delivery boy**
- Steps: Add new delivery boy via admin.
- Expected: Created, appears in list.

**AB2 - Delete delivery boy**
- Steps: Delete delivery boy.
- Expected: Removed from list.

**AB3 - Milk distribution**
- Steps: Update milk distribution for a delivery boy.
- Expected: Values saved for today.

**AB4 - Monthly report**
- Steps: Open monthly report.
- Expected: Aggregated totals per delivery boy.

---

## 8) Admin - Daily Report & PDF Export

**DR1 - Daily report default**
- Steps: Open `/daily-report`.
- Expected: Shows today data.

**DR2 - Date filter**
- Steps: Set start/end date; apply filter.
- Expected: Data filtered correctly.

**DR3 - Empty range**
- Steps: Date range with no records.
- Expected: "No data" states; export disabled.

**DR4 - Export PDF**
- Steps: Export with filtered range.
- Expected: PDF includes same data as UI.

---

## 9) Admin - Payments (User + Farmer)

**AP1 - User payment details**
- Steps: Open user payment details list.
- Expected: Shows QR images (if uploaded) and summary.

**AP2 - User payment update**
- Steps: Update received payment for a user.
- Expected: Pending/total updated.

**AP3 - Advance payment**
- Steps: Add advance payment.
- Expected: Advances updated in user profile/history.

**AP4 - Farmer pending payments**
- Steps: Open farmer pending payments.
- Expected: List of unpaid farmers.

**AP5 - Farmer payment status update**
- Steps: Mark farmer payment as paid.
- Expected: Status updated.

---

## 10) User - Dashboard & Orders

**U1 - User dashboard loads**
- Steps: Login as user.
- Expected: Dashboard data renders.

**U2 - Add item (additional order)**
- Steps: Add item with quantity.
- Expected: Order appears on admin additional orders.

**U3 - Shift validation**
- Steps: Morning-only user tries evening delivery in UI.
- Expected: Not shown / not allowed.

**U4 - Start date**
- Steps: Check start date display.
- Expected: Matches backend value.

---

## 11) User - Payments & QR Upload

**UP1 - View admin payment details**
- Steps: User opens payment section.
- Expected: Admin's UPI + QR visible.

**UP2 - Upload payment proof (valid)**
- Steps: Upload JPG/PNG under size limit.
- Expected: Success message; admin can view.

**UP3 - Upload payment proof (no file)**
- Steps: Submit without file.
- Expected: Error message.

**UP4 - Upload payment proof (invalid type)**
- Steps: Upload non-image.
- Expected: Validation error.

**UP5 - Payment summary**
- Steps: Open payment summary.
- Expected: Totals match records.

---

## 12) User - Vacation Requests

**UV1 - Create vacation (single day)**
- Steps: Create vacation with same start/end.
- Expected: Vacation saved, admin notification created.

**UV2 - Create vacation (range)**
- Steps: Start/end different.
- Expected: Vacation saved for range.

**UV3 - Shift-specific vacation**
- Steps: Morning only, evening only.
- Expected: Correct vacation flags set.

**UV4 - Admin popup**
- Steps: Admin login.
- Expected: Popup shows new vacation requests.

**UV5 - Admin acknowledges**
- Steps: Click "Got it, OK".
- Expected: Vacation marked notified; popup not shown again.

---

## 13) Notifications

**N1 - Admin custom notification**
- Steps: Admin sets message (<=20 chars) + active.
- Expected: Saved; user popup shows on next login.

**N2 - Admin notification inactive**
- Steps: Admin sets inactive.
- Expected: User popup not shown.

**N3 - User dismisses**
- Steps: User clicks "Got it".
- Expected: Same notification not shown again.

**N4 - Festival greeting (UI)**
- Steps: Open user dashboard on festival date.
- Expected: Greeting appears only for users.

**N5 - Festival greeting (cron)**
- Steps: Run festival cron or test endpoint.
- Expected: FCM sent only to user tokens.

---

## 14) Farmer

**F1 - Farmer todays orders**
- Steps: Login as farmer.
- Expected: Shows today’s orders.

**F2 - Farmer daily order history**
- Steps: Open daily history.
- Expected: List includes last month.

**F3 - Farmer payment history**
- Steps: Open payment history.
- Expected: Data matches backend.

---

## 15) Delivery Flags + Cron Logic

**C1 - Reset delivered flags at night**
- Steps: Run cron at 23:45.
- Expected: Flags reset after logic.

**C2 - Not present handling**
- Steps: Mark user not present; run cron.
- Expected: delivered_morning/evening remains false.

**C3 - No record auto-deliver**
- Steps: No DeliveryStatus for user; run cron.
- Expected: delivered_morning/evening set true.

---

## 16) Google Translate Widget

**GT1 - Dropdown languages**
- Steps: Open dropdown.
- Expected: Only English, Hindi, Marathi.

**GT2 - Translation**
- Steps: Select Hindi.
- Expected: Page reloads, content translated.

**GT3 - Persist language**
- Steps: Navigate to other page.
- Expected: Translation persists.

**GT4 - Spinner hidden**
- Steps: Load page.
- Expected: No Google Translate spinner overlay visible.

---

## 17) Security & Permissions

**S1 - Unauthorized API access**
- Steps: Call admin routes with user token.
- Expected: 403/401.

**S2 - Unauthorized data access**
- Steps: Delivery boy tries to fetch user from other dairy.
- Expected: Access denied.

**S3 - CSRF/cookie tamper**
- Steps: Modify cookie role.
- Expected: Logout / redirect.

---

## 18) Regression Areas (High Risk)

- Payment uploads: verify file buffer, admin view.
- Delivery status update: time gates and not-present logic.
- Daily report date filters + PDF export.
- Vacation notifications: avoid re-showing.
- Custom notification active/inactive state.
- FCM tokens update & sending.

---

## Notes / Assumptions
- Backend uses MySQL with correct migrations applied.
- FCM keys exist in `serviceAccountKey.json`.
- Razorpay keys exist in `.env`.
- Cron jobs enabled in `backend/server.js`.

