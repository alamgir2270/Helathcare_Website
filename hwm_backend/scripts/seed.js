/**
 * SEED SCRIPT - Run once to create default Clinic, Departments, Admin and Doctor accounts
 * 
 * Usage: node scripts/seed.js
 * 
 * Creates:
 * - Default Clinic
 * - 4 Departments (General Medicine, Cardiology, Orthopedics, Pediatrics)
 * - Admin account (admin@healthcare.com / Admin@123456)
 * - Doctors in each department
 */

const bcrypt = require("bcrypt");
const { sequelize, User, Doctor, Admin, Department, Clinic } = require("../models");
require("dotenv").config();

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...\n");

    // Sync database
    await sequelize.sync({ alter: false });
    console.log("✅ Database synced\n");

    // ===== CREATE DEFAULT CLINIC =====
    console.log("🏥 Creating default clinic...");
    const clinic = await Clinic.create({
      name: "Central Hospital",
      address: "123 Main Street, Healthcare City",
      contact: "+88012345678",
    }).catch(() => Clinic.findOne({ where: { name: "Central Hospital" } }));
    console.log("✅ Clinic created:", clinic.clinic_id, "\n");

    // ===== CREATE DEPARTMENTS =====
    console.log("📋 Creating departments...");
    const deptData = [
      { name: "General Medicine", description: "General healthcare and preventive medicine" },
      { name: "Cardiology", description: "Heart and cardiovascular diseases" },
      { name: "Orthopedics", description: "Bones, joints, and musculoskeletal system" },
      { name: "Pediatrics", description: "Healthcare for children" },
    ];

    const departments = {};
    for (const dept of deptData) {
      let d = await Department.findOne({
        where: { name: dept.name, clinic_id: clinic.clinic_id },
      });
      if (!d) {
        d = await Department.create({
          clinic_id: clinic.clinic_id,
          name: dept.name,
          description: dept.description,
        });
      }
      departments[dept.name] = d;
      console.log(`  ✓ ${dept.name} (${d.department_id})`);
    }
    console.log();

    // ===== CREATE ADMIN ACCOUNT =====
    console.log("📝 Creating Admin account...");
    const adminPassword = await bcrypt.hash("Admin@123456", 10);
    const adminSalt = await bcrypt.genSalt(10);
    let adminUser = await User.findOne({ where: { email: "admin@healthcare.com" } });
    if (!adminUser) {
      adminUser = await User.create({
        email: "admin@healthcare.com",
        password_hash: adminPassword,
        salt: adminSalt,
        role: "admin",
        full_name: "System Administrator",
        phone: "+88017XXXXXXXX",
        is_active: true,
      });
      await Admin.create({ user_id: adminUser.user_id });
    }
    console.log("✅ Admin Account Created:");
    console.log(`   Email: admin@healthcare.com`);
    console.log(`   Password: Admin@123456\n`);

    // ===== CREATE DOCTORS IN EACH DEPARTMENT =====
    console.log("👨‍⚕️  Creating specialist doctors...\n");
    
    const doctorData = [
      {
        email: "doctor1@healthcare.com",
        name: "Dr. James Smith",
        password: "Doctor@123456",
        specialty: "General Medicine",
        license: "DOC-BD-2024-001",
        bio: "Experienced general physician with 10+ years of practice",
        department: "General Medicine",
        hours: "09:00 - 17:00",
        days: "Mon,Tue,Wed,Thu,Fri",
      },
      {
        email: "doctor2@healthcare.com",
        name: "Dr. Emily Johnson",
        password: "Doctor@123456",
        specialty: "General Medicine",
        license: "DOC-BD-2024-001A",
        bio: "Skilled physician specializing in preventive medicine",
        department: "General Medicine",
        hours: "10:00 - 18:00",
        days: "Tue,Wed,Thu,Fri,Sat",
      },
      {
        email: "cardio@healthcare.com",
        name: "Dr. Sarah Chen",
        password: "Cardio@123456",
        specialty: "Cardiology",
        license: "DOC-BD-2024-002",
        bio: "Specialist in cardiovascular diseases with 15+ years experience",
        department: "Cardiology",
        hours: "10:00 - 16:00",
        days: "Mon,Wed,Thu,Fri",
      },
      {
        email: "cardio2@healthcare.com",
        name: "Dr. Michael Brown",
        password: "Cardio@123456",
        specialty: "Cardiology",
        license: "DOC-BD-2024-002A",
        bio: "Expert in interventional cardiology and heart disease management",
        department: "Cardiology",
        hours: "09:00 - 15:00",
        days: "Mon,Tue,Wed,Thu,Fri",
      },
      {
        email: "ortho@healthcare.com",
        name: "Dr. Ahmed Khan",
        password: "Ortho@123456",
        specialty: "Orthopedics",
        license: "DOC-BD-2024-003",
        bio: "Expert orthopedic surgeon specializing in joint replacement",
        department: "Orthopedics",
        hours: "08:00 - 14:00",
        days: "Mon,Tue,Thu,Fri,Sat",
      },
      {
        email: "ortho2@healthcare.com",
        name: "Dr. Lisa Anderson",
        password: "Ortho@123456",
        specialty: "Orthopedics",
        license: "DOC-BD-2024-003A",
        bio: "Specialist in sports medicine and orthopedic trauma",
        department: "Orthopedics",
        hours: "08:30 - 16:30",
        days: "Tue,Wed,Thu,Fri,Sat",
      },
      {
        email: "pediatric@healthcare.com",
        name: "Dr. Maria Lopez",
        password: "Pediatric@123456",
        specialty: "Pediatrics",
        license: "DOC-BD-2024-004",
        bio: "Compassionate pediatrician caring for children's health",
        department: "Pediatrics",
        hours: "09:00 - 17:00",
        days: "Mon,Tue,Wed,Thu,Fri",
      },
      {
        email: "pediatric2@healthcare.com",
        name: "Dr. Robert Davis",
        password: "Pediatric@123456",
        specialty: "Pediatrics",
        license: "DOC-BD-2024-004A",
        bio: "Experienced pediatrician with focus on child development",
        department: "Pediatrics",
        hours: "09:30 - 17:30",
        days: "Mon,Tue,Wed,Thu,Fri,Sat",
      },
    ];

    for (const docData of doctorData) {
      const docPassword = await bcrypt.hash(docData.password, 10);
      const docSalt = await bcrypt.genSalt(10);
      
      let docUser = await User.findOne({ where: { email: docData.email } });
      if (!docUser) {
        docUser = await User.create({
          email: docData.email,
          password_hash: docPassword,
          salt: docSalt,
          role: "doctor",
          full_name: docData.name,
          phone: "+88018XXXXXXXX",
          is_active: true,
        });
      }

      const dept = departments[docData.department];
      let doctor = await Doctor.findOne({ where: { user_id: docUser.user_id } });
      if (!doctor) {
        doctor = await Doctor.create({
          user_id: docUser.user_id,
          department_id: dept.department_id,
          clinic_id: clinic.clinic_id,
          specialty: docData.specialty,
          license_no: docData.license,
          available_hours: docData.hours,
          available_days: docData.days,
          bio: docData.bio,
          rating_cache: 4.5,
        });
      }
      console.log(`✅ ${docData.name}`);
      console.log(`   Department: ${docData.department}`);
      console.log(`   Email: ${docData.email}`);
      console.log(`   Password: ${docData.password}\n`);
    }

    // ===== SUMMARY =====
    console.log("=" * 60);
    console.log("🎉 SEEDING COMPLETE!\n");
    console.log("📋 ACCOUNTS CREATED:\n");
    console.log("ADMIN:");
    console.log("  Email: admin@healthcare.com");
    console.log("  Password: Admin@123456\n");
    console.log("DOCTORS (2 per department):");
    console.log("  📋 GENERAL MEDICINE:");
    console.log("    1. Dr. James Smith");
    console.log("       Email: doctor1@healthcare.com");
    console.log("       Password: Doctor@123456");
    console.log("    2. Dr. Emily Johnson");
    console.log("       Email: doctor2@healthcare.com");
    console.log("       Password: Doctor@123456");
    console.log("  ❤️  CARDIOLOGY:");
    console.log("    3. Dr. Sarah Chen");
    console.log("       Email: cardio@healthcare.com");
    console.log("       Password: Cardio@123456");
    console.log("    4. Dr. Michael Brown");
    console.log("       Email: cardio2@healthcare.com");
    console.log("       Password: Cardio@123456");
    console.log("  🦴 ORTHOPEDICS:");
    console.log("    5. Dr. Ahmed Khan");
    console.log("       Email: ortho@healthcare.com");
    console.log("       Password: Ortho@123456");
    console.log("    6. Dr. Lisa Anderson");
    console.log("       Email: ortho2@healthcare.com");
    console.log("       Password: Ortho@123456");
    console.log("  👶 PEDIATRICS:");
    console.log("    7. Dr. Maria Lopez");
    console.log("       Email: pediatric@healthcare.com");
    console.log("       Password: Pediatric@123456");
    console.log("    8. Dr. Robert Davis");
    console.log("       Email: pediatric2@healthcare.com");
    console.log("       Password: Pediatric@123456\n");
    console.log("PATIENT (self-signup):");
    console.log("  Create via: http://localhost:5173/signup\n");
    console.log("=" * 60);

    await sequelize.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();
