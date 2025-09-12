# Payment System Testing Guide

This comprehensive guide will help you test all the payment system features that have been implemented in the educational center management application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend API Testing](#backend-api-testing)
4. [Frontend Component Testing](#frontend-component-testing)
5. [End-to-End Workflows](#end-to-end-workflows)
6. [Error Handling Tests](#error-handling-tests)
7. [Performance & Load Testing](#performance--load-testing)
8. [Security Testing](#security-testing)

---

## Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **MySQL** (v8 or higher)
- **Git**
- **Postman** or **Insomnia** (for API testing)
- Modern web browser (Chrome, Firefox, Edge)

### Environment Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend dependencies
   cd backend && npm install
   
   # Frontend dependencies  
   cd .. && npm install
   ```

3. Set up environment variables:
   ```bash
   # Copy and configure .env file
   cp backend/env.example backend/.env
   ```

---

## Database Setup

### 1. Run Migrations
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name add_payment_system
```

### 2. Seed Database
```bash
# Run the payment system seed
npx prisma db seed
```

### 3. Verify Database Structure
Check that these tables exist:
- `payments`
- `payment_subjects`
- `payment_status` (enum)
- `payment_method` (enum)

**SQL Verification:**
```sql
-- Check payment tables
DESCRIBE payments;
DESCRIBE payment_subjects;

-- Check sample data
SELECT COUNT(*) FROM payments;
SELECT * FROM payments LIMIT 5;
```

---

## Backend API Testing

### 1. Start Backend Server
```bash
cd backend
npm run dev
```
**Expected:** Server running on `http://localhost:3001`

### 2. Test Authentication
```bash
# Test login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"D8fd5D5694"}'
```
**Expected Response:** JWT tokens

### 3. Test Payment API Endpoints

#### Get All Payments
```bash
curl -X GET "http://localhost:3001/api/v1/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected:** List of payments with pagination

#### Create Payment
```bash
curl -X POST "http://localhost:3001/api/v1/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_UUID",
    "month": "2024-01",
    "amount": 500.00,
    "paidAmount": 500.00,
    "subjects": [
      {"subjectId": "SUBJECT_UUID", "amount": 300.00},
      {"subjectId": "SUBJECT_UUID_2", "amount": 200.00}
    ],
    "method": "cash",
    "paymentDate": "2024-01-15T00:00:00Z",
    "note": "Test payment"
  }'
```
**Expected:** Created payment object

#### Get Student Monthly Status
```bash
curl -X GET "http://localhost:3001/api/v1/payments/student/STUDENT_UUID/monthly-status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected:** Array of monthly payment statuses

#### Get Payment Summary
```bash
curl -X GET "http://localhost:3001/api/v1/payments/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected:** Analytics summary object

#### Update Payment
```bash
curl -X PUT "http://localhost:3001/api/v1/payments/PAYMENT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "paidAmount": 500.00,
    "paymentDate": "2024-01-20T00:00:00Z"
  }'
```
**Expected:** Updated payment object

#### Delete Payment
```bash
curl -X DELETE "http://localhost:3001/api/v1/payments/PAYMENT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected:** Success confirmation

---

## Frontend Component Testing

### 1. Start Frontend Server
```bash
npm run dev
```
**Expected:** Application running on `http://localhost:5173`

### 2. Login and Navigation
1. **Login Test:**
   - Navigate to login page
   - Enter credentials: `admin@admin.com` / `D8fd5D5694`
   - **Expected:** Successful login and redirect to dashboard

2. **Navigation Test:**
   - Click "Payments" in sidebar
   - **Expected:** Payment page loads without errors

### 3. Payment Management Testing

#### Main Payments Page (`/payments`)
1. **Page Load:**
   - Check analytics cards display properly
   - Verify payment history table loads
   - **Expected:** No console errors, data displays

2. **Analytics Toggle:**
   - Click "Show Analytics" button
   - **Expected:** PaymentAnalytics component expands
   - Verify metrics display correctly

3. **Search & Filtering:**
   - Test search functionality with student names
   - Test status filter (paid, pending, overdue)
   - Test month filter
   - **Expected:** Results filter correctly

4. **Payment Actions:**
   - Click "Record Payment" button
   - **Expected:** PaymentRecordModal opens
   - Click "View" on a payment
   - **Expected:** Payment detail modal opens
   - Click "Edit" on a payment
   - **Expected:** PaymentEditModal opens

#### Payment Record Modal
1. **Modal Open:**
   - Click "Record Payment" or "Pay" button
   - **Expected:** Modal opens with form

2. **Form Validation:**
   - Try submitting empty form
   - **Expected:** Validation errors display
   - Enter invalid data (negative amounts, etc.)
   - **Expected:** Appropriate error messages

3. **Subject Selection:**
   - Select a student
   - **Expected:** Student's subjects auto-populate
   - Toggle subjects on/off
   - **Expected:** Total amount updates

4. **Payment Submission:**
   - Fill all required fields correctly
   - Click "Record Payment"
   - **Expected:** Payment created, modal closes, data refreshes

#### Student Drawer Payment Tab
1. **Open Student Drawer:**
   - Go to Students page
   - Click on any student
   - **Expected:** Student drawer opens

2. **Payment Tab:**
   - Click "Payments" tab in drawer
   - **Expected:** Payment history displays
   - Check monthly payment status
   - **Expected:** Current year months with status badges

3. **Record Payment from Drawer:**
   - Click "Pay" button for any month
   - **Expected:** PaymentRecordModal opens with pre-filled month

### 4. Analytics Components Testing

#### Payment Analytics
1. **Component Load:**
   - Toggle analytics on payments page
   - **Expected:** Metrics cards load with real data

2. **Month Filter:**
   - Change month selector
   - **Expected:** Data updates for selected month

3. **Growth Metrics:**
   - Check month-over-month comparisons
   - **Expected:** Growth percentages calculate correctly

#### Monthly Payment Tracker
1. **Create Route (Optional):**
   - Add route for `/payments/monthly` if needed
   - Or integrate into existing page

2. **Month Selection:**
   - Change month dropdown
   - **Expected:** Student payment statuses update

3. **Student Filtering:**
   - Use search and status filters
   - **Expected:** List filters correctly

#### Payment Notifications
1. **Notification Display:**
   - Check for overdue payment notifications
   - **Expected:** Alerts show with correct priority

2. **Notification Actions:**
   - Click notifications to view details
   - Dismiss notifications
   - **Expected:** Appropriate actions trigger

### 5. Reports Testing

#### Payment Reports Component
1. **Period Selection:**
   - Test different time periods
   - Test custom date ranges
   - **Expected:** Data updates accordingly

2. **Export Functions:**
   - Test CSV exports for each report type
   - **Expected:** Files download with correct data

3. **Print Function:**
   - Click print button
   - **Expected:** Print dialog opens with formatted report

---

## End-to-End Workflows

### Workflow 1: Complete Payment Cycle
1. **Create Student** (if needed)
2. **Enroll Student in Subjects**
3. **Record Monthly Payment:**
   - Go to Payments page
   - Click "Record Payment"
   - Select student and month
   - Choose subjects
   - Enter payment details
   - Submit
4. **Verify Payment:**
   - Check payment appears in history
   - Verify student's payment status updated
   - Check analytics reflect new payment

### Workflow 2: Partial Payment Handling
1. **Record Partial Payment:**
   - Create payment with amount less than total due
   - **Expected:** Status shows as "partial"
2. **Complete Payment:**
   - Edit the same payment
   - Update paid amount to full amount
   - **Expected:** Status changes to "paid"

### Workflow 3: Overdue Payment Management
1. **Create Overdue Payment:**
   - Create payment for past month with pending status
   - **Expected:** System shows as overdue
2. **Check Notifications:**
   - View payment notifications
   - **Expected:** Overdue alert appears
3. **Resolve Overdue:**
   - Record payment for overdue amount
   - **Expected:** Notification disappears, status updates

### Workflow 4: Bulk Monthly Review
1. **Use Monthly Tracker:**
   - Navigate to monthly tracking view
   - Select current month
   - Review all student statuses
2. **Process Payments:**
   - Record payments for multiple students
   - **Expected:** Status updates reflect in real-time

### Workflow 5: Report Generation
1. **Generate Monthly Report:**
   - Go to Payment Reports
   - Select "Current Month"
   - Export CSV
   - **Expected:** File contains all current month payments
2. **Analyze Trends:**
   - Select "Current Year" period
   - Review analytics
   - **Expected:** Yearly trends display correctly

---

## Error Handling Tests

### 1. Network Errors
- **Disconnect Internet** and try operations
- **Expected:** Graceful error messages, no crashes

### 2. Invalid Data
- **Submit Invalid Amounts:** Negative, zero, excessive decimals
- **Invalid Dates:** Future dates, invalid formats
- **Missing Required Fields:** Test form validation
- **Expected:** Clear error messages, form doesn't submit

### 3. Permission Errors
- **Test with Different User Roles** (if implemented)
- **Expected:** Appropriate access controls

### 4. Concurrent Operations
- **Open Multiple Tabs** and modify same payment
- **Expected:** Proper conflict resolution or warnings

---

## Performance & Load Testing

### 1. Large Dataset Testing
```sql
-- Create test data (be careful in production!)
INSERT INTO payments (student_id, month, amount, status, center_id, recorded_by, due_date, created_at)
SELECT 
  student_id,
  '2024-01',
  ROUND(RAND() * 1000 + 100, 2),
  CASE WHEN RAND() > 0.7 THEN 'paid' WHEN RAND() > 0.5 THEN 'partial' ELSE 'pending' END,
  center_id,
  recorded_by,
  DATE('2024-01-31'),
  NOW()
FROM (SELECT s.id as student_id, s.center_id, u.id as recorded_by 
      FROM students s 
      CROSS JOIN users u 
      WHERE u.role = 'center_admin' 
      LIMIT 1000) as temp;
```

### 2. Page Load Performance
- **Monitor Load Times:** Use browser dev tools
- **Target:** < 3 seconds for initial load
- **Target:** < 1 second for data refreshes

### 3. Memory Usage
- **Long Running Session:** Use application for extended period
- **Expected:** No significant memory leaks

---

## Security Testing

### 1. Authentication Tests
- **Invalid Tokens:** Try API calls with expired/invalid tokens
- **Expected:** 401 Unauthorized responses

### 2. Authorization Tests
- **Cross-Center Access:** Try accessing other center's payments
- **Expected:** Proper access restrictions

### 3. Input Validation
- **SQL Injection Attempts:** Try malicious SQL in form fields
- **XSS Attempts:** Try script injection in text fields
- **Expected:** All inputs properly sanitized

### 4. Data Exposure
- **Check API Responses:** Ensure no sensitive data leaked
- **Browser Storage:** Verify no sensitive data in localStorage

---

## Testing Checklist

### Pre-Testing Setup ✅
- [ ] Database migrated and seeded
- [ ] Backend server running without errors  
- [ ] Frontend server running without errors
- [ ] Test user logged in successfully
- [ ] Sample data available

### Backend API Tests ✅
- [ ] All payment CRUD operations work
- [ ] Student monthly status endpoint functional
- [ ] Payment summary analytics working
- [ ] Proper error responses for invalid requests
- [ ] Authentication/authorization working

### Frontend Component Tests ✅
- [ ] Payment page loads without errors
- [ ] Payment record modal functions correctly
- [ ] Payment edit modal works properly
- [ ] Student drawer payment tab displays correctly
- [ ] Search and filtering work as expected
- [ ] Analytics components display real data
- [ ] Export functions generate correct files

### Workflow Tests ✅
- [ ] Complete payment recording workflow
- [ ] Partial payment handling workflow
- [ ] Overdue payment management workflow  
- [ ] Monthly payment tracking workflow
- [ ] Report generation workflow

### Error Handling ✅
- [ ] Network error handling
- [ ] Invalid data validation
- [ ] Permission error handling
- [ ] Concurrent operation handling

### Performance ✅
- [ ] Page load times acceptable
- [ ] Large dataset handling
- [ ] Memory usage stable

### Security ✅
- [ ] Authentication properly enforced
- [ ] Authorization correctly implemented
- [ ] Input validation prevents attacks
- [ ] No sensitive data exposure

---

## Troubleshooting Common Issues

### Backend Issues
1. **Database Connection Errors:**
   - Check MySQL is running
   - Verify connection string in .env
   - Ensure database exists

2. **Migration Failures:**
   ```bash
   npx prisma migrate reset
   npx prisma generate
   ```

3. **Port Conflicts:**
   - Change PORT in backend .env
   - Update frontend API base URL

### Frontend Issues
1. **API Connection Errors:**
   - Check backend server is running
   - Verify API base URL in frontend config
   - Check browser console for CORS errors

2. **Component Not Loading:**
   - Check import paths
   - Verify component exports
   - Check for TypeScript errors

3. **Data Not Updating:**
   - Check React Query cache settings
   - Verify mutation success callbacks
   - Check network tab in browser dev tools

### Data Issues
1. **No Students/Subjects Available:**
   - Run database seed again
   - Create test data manually
   - Check user's center association

2. **Payment Calculations Wrong:**
   - Verify subject monthly fees
   - Check payment amount calculations
   - Ensure proper number formatting

---

## Success Criteria

The payment system is working correctly if:

✅ **All API endpoints respond correctly**
✅ **Payment CRUD operations function properly**  
✅ **Analytics display accurate data**
✅ **Search and filtering work as expected**
✅ **Export functions generate correct reports**
✅ **Error handling is graceful**
✅ **Performance is acceptable**
✅ **Security measures are effective**
✅ **End-to-end workflows complete successfully**
✅ **No critical console errors or crashes**

---

## Next Steps After Testing

Once testing is complete and issues are resolved:

1. **Deploy to staging environment**
2. **Conduct user acceptance testing**
3. **Performance optimization if needed**
4. **Security audit**
5. **Documentation finalization**
6. **Production deployment**

---

*This testing guide ensures comprehensive validation of all payment system features. Follow each section methodically to verify the system works as intended before production deployment.*
