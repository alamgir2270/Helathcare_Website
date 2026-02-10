# 🚀 Healthcare Web App - Setup Guide

## **Architecture**

This is a professional healthcare system where:
- ✅ **Patients** can self-register via signup (creates patient role automatically)
- ✅ **Admins & Doctors** are created by database admins only (via seed script)
- ✅ Everyone logs in with their credentials
- ✅ Dashboard changes based on user role

---

## **Quick Start**

### **1. Install Dependencies**
```bash
# Backend
cd hwm_backend
npm install

# Frontend
cd ../hwm_frontend
npm install
```

---

### **2. Create Admin & Doctor Accounts (ONE TIME ONLY)**

Run the seed script to create test accounts:

```bash
cd hwm_backend
npm run seed
```

**Output:**
```
✅ Admin Account Created:
   Email: admin@healthcare.com
   Password: Admin@123456

✅ Doctor Account Created:
   Email: doctor@healthcare.com
   Password: Doctor@123456
```

---

### **3. Start Backend Server**
```bash
cd hwm_backend
npm start
```

Expected:
```
✅ All models synced
✅ Server running on port 5000
```

---

### **4. Start Frontend Server**
Open a **new terminal**:
```bash
cd hwm_frontend
npm run dev
```

Expected:
```
VITE v5.0.0  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## **🧪 Test Accounts**

### **Admin (Created by seed script)**
```
Email:    admin@healthcare.com
Password: Admin@123456
Role:     Access Admin Dashboard
```

### **Doctor (Created by seed script)**
```
Email:    doctor@healthcare.com
Password: Doctor@123456
Role:     Access Doctor Dashboard
```

### **Patient (Self-signup)**
```
1. Go to http://localhost:5173/signup
2. Fill the form (any email/password)
3. Automatically creates Patient role
4. Log in to access Patient Dashboard
```

---

## **📊 User Journeys**

### **Patient Flow:**
1. Click "Sign Up" → Create account → Auto-sets role to "patient"
2. Login → Patient Dashboard
3. View appointments, prescriptions, lab results
4. Book appointments, message doctors

### **Doctor Flow:**
1. Request admin to create account (seed script)
2. Login with credentials
3. Doctor Dashboard
4. View appointments, manage prescriptions
5. Access patient records

### **Admin Flow:**
1. Request system admin to run seed script
2. Login with credentials
3. Admin Dashboard
4. View analytics, doctor performance
5. System management

---

## **🔐 Security Features**

✅ Only patients can self-register  
✅ Admin/Doctor accounts need special database access  
✅ Role-based access control (RBAC)  
✅ JWT authentication with token validation  
✅ Password hashing with bcrypt  
✅ Email validation  
✅ Password strength requirements  
✅ Secure error handling  

---

## **📁 Project Structure**

```
hwm_backend/
├── models/              # Database models
├── controllers/         # Business logic
├── routes/             # API endpoints
├── middleware/         # Auth, validation, errors
├── scripts/
│   └── seed.js        # ⭐ Create admin/doctor accounts
├── config/
│   └── db.js          # Database connection
└── server.js          # Express app entry point

hwm_frontend/
├── src/
│   ├── pages/
│   │   ├── auth/      # Login, Signup, ForgotPassword
│   │   ├── admin/     # Admin Dashboard
│   │   ├── doctor/    # Doctor Dashboard
│   │   └── patient/   # Patient Dashboard
│   ├── routes/        # PrivateRoute, RoleRoute
│   └── App.jsx        # Main app router
```

---

## **⚡ Available APIs**

### **Authentication**
```
POST   /api/auth/signup              (Patients only)
POST   /api/auth/login               (All users)
POST   /api/auth/forgot-password    (All users)
POST   /api/auth/reset-password     (All users)
```

### **Patients**
```
GET    /api/patients                 (Get patient info)
PUT    /api/patients/:id             (Update profile)
```

### **Doctors**
```
GET    /api/doctors                  (List all doctors)
GET    /api/doctors/:id              (Get doctor details)
```

### **Appointments**
```
POST   /api/appointments             (Book appointment)
GET    /api/appointments             (View appointments)
PUT    /api/appointments/:id         (Update appointment)
DELETE /api/appointments/:id         (Cancel appointment)
```

### **Prescriptions**
```
POST   /api/prescriptions            (Create prescription)
GET    /api/prescriptions            (View prescriptions)
PUT    /api/prescriptions/:id        (Update prescription)
DELETE /api/prescriptions/:id        (Delete prescription)
```

### **Analytics (Admin Only)**
```
GET    /api/analytics/dashboard      (Overview stats)
GET    /api/analytics/appointments/stats
GET    /api/analytics/doctors/performance
GET    /api/analytics/revenue
GET    /api/analytics/users/growth
GET    /api/analytics/prescriptions/stats
GET    /api/analytics/lab-results/stats
GET    /api/analytics/system/health
```

---

## **🛠️ Troubleshooting**

### **Backend won't start?**
```bash
# Check PostgreSQL is running
psql -U postgres

# Create database if missing
createdb health_db

# Check .env file
cat .env
```

### **Frontend won't load?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### **Can't login?**
1. Verify backend is running on port 5000
2. Check credentials in seed output
3. Ensure database has users (run seed script)

### **CORS errors?**
- Backend is running on `http://localhost:5000`
- Frontend is running on `http://localhost:5173`
- Both should be running simultaneously

---

## **📝 Database Schema**

Key tables created automatically:
- `users` - All users (admin, doctor, patient)
- `patients` - Patient-specific data
- `doctors` - Doctor-specific data
- `admins` - Admin-specific data
- `appointments` - Appointment scheduling
- `prescriptions` - Medication prescriptions
- `lab_results` - Lab test results
- `medical_history` - Patient medical records
- `bills` - Billing/invoicing
- `feedback` - Doctor ratings
- `audit_logs` - System audit trail

---

## **🎯 Next Steps**

After testing locally:
1. Complete Bills/Invoice system (Task 5)
2. Add Swagger API documentation (Task 6)
3. Deploy to production (Azure, Heroku, AWS)
4. Add email notifications (optional)
5. Add SMS alerts (optional)

---

**Happy coding! 🚀**
