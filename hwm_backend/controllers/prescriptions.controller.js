const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { Prescription, Doctor, Patient, User } = require("../models");
let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (e) {
  nodemailer = null;
}

exports.getPrescriptions = async (req, res) => {
  try {
    const user = req.user;
    let where = {};

    // Filter by role: doctors see their prescriptions, patients see theirs, admins see all
    if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ where: { user_id: user.user_id } });
      where.doctor_id = doctor?.doctor_id;
    } else if (user.role === "patient") {
      const patient = await Patient.findOne({ where: { user_id: user.user_id } });
      where.patient_id = patient?.patient_id;
    }

    const prescriptions = await Prescription.findAll({
      where,
      include: [
        { model: Doctor, include: [{ model: User, attributes: ["full_name", "email"] }] },
        { model: Patient, include: [{ model: User, attributes: ["full_name", "email"] }] },
      ],
      order: [["issued_at", "DESC"]],
    });

    res.json({ success: true, data: prescriptions });
  } catch (err) {
    console.error("getPrescriptions error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPrescription = async (req, res) => {
  try {
    const user = req.user;
    const { patient_id } = req.body;

    // Get doctor_id from current user if doctor
    let doctor_id = req.body.doctor_id;
    if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ where: { user_id: user.user_id } });
      doctor_id = doctor?.doctor_id;
    }

    // Build snapshots for doctor and patient to store on the prescription
    const doctor = await Doctor.findOne({ where: { user_id: user.user_id }, include: [{ model: User }] });
    const patient = await Patient.findOne({ where: { patient_id }, include: [{ model: User }] });

    const doctorSnapshot = {
      doctor_id: doctor?.doctor_id,
      name: doctor?.User?.full_name,
      email: doctor?.User?.email,
      specialty: doctor?.specialty,
    };

    const patientSnapshot = {
      patient_id: patient?.patient_id,
      name: patient?.User?.full_name,
      email: patient?.User?.email,
      dob: patient?.dob,
      gender: patient?.gender,
    };

    // medications should be an array of objects in req.body.medications
    const meds = Array.isArray(req.body.medications) ? req.body.medications : [];

    const prescription = await Prescription.create({
      medications: meds,
      advice: req.body.advice || "",
      doctor_snapshot: doctorSnapshot,
      patient_snapshot: patientSnapshot,
      appointment_id: req.body.appointment_id || null,
      doctor_id,
      patient_id,
      issued_at: new Date(),
      downloadable_flag: true,
    });

    // generate PDF and save to uploads/prescriptions/<id>.pdf
    try {
      const uploadsDir = path.join(__dirname, "..", "uploads", "prescriptions");
      fs.mkdirSync(uploadsDir, { recursive: true });
      const fileName = `${prescription.prescription_id}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(18).text(doctorSnapshot.name || "Doctor", { align: "left" });
        if (doctorSnapshot.specialty) doc.fontSize(12).text(doctorSnapshot.specialty);
        doc.moveDown();

        // Patient info
        doc.fontSize(14).text(`Patient: ${patientSnapshot.name || "N/A"}`);
        doc.fontSize(12).text(`DOB: ${patientSnapshot.dob || "N/A"}   Gender: ${patientSnapshot.gender || "N/A"}`);
        doc.moveDown();

        // Medications
        doc.fontSize(14).text("Medications:");
        meds.forEach((m, idx) => {
          const line = `${idx + 1}. ${m.name || m.medication_name || ""} — ${m.dosage || m.dosage || ""} | ${m.frequency || ""}`;
          doc.fontSize(12).text(line);
          if (m.notes) doc.fontSize(11).fillColor("#555").text(`   Notes: ${m.notes}`);
        });
        doc.moveDown();

        // Advice
        if (req.body.advice) {
          doc.fontSize(14).text("Advice / Instructions:");
          doc.fontSize(12).text(req.body.advice);
          doc.moveDown();
        }

        // Footer / issued at
        doc.fontSize(10).fillColor("#333").text(`Issued: ${new Date().toLocaleString()}`);
        doc.end();

        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      // Update prescription with file_url
      const publicPath = `/uploads/prescriptions/${prescription.prescription_id}.pdf`;
      prescription.file_url = publicPath;
      await prescription.save();

      // Optionally send email with attachment if SMTP configured
      if (nodemailer && process.env.SMTP_HOST) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: process.env.SMTP_USER
              ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
              : undefined,
          });

          if (patientSnapshot.email) {
            await transporter.sendMail({
              from: process.env.SMTP_FROM || (doctorSnapshot.email || "no-reply@localhost"),
              to: patientSnapshot.email,
              subject: `Prescription from ${doctorSnapshot.name}`,
              text: `Dear ${patientSnapshot.name || "Patient"},\n\nPlease find your prescription attached.\n\nRegards, ${doctorSnapshot.name}`,
              attachments: [
                { filename: `${prescription.prescription_id}.pdf`, path: path.join(__dirname, "..", "uploads", "prescriptions", `${prescription.prescription_id}.pdf`) },
              ],
            });
          }
        } catch (emailErr) {
          console.warn("Failed to send prescription email:", emailErr.message);
        }
      }
    } catch (pdfErr) {
      console.warn("Failed to generate prescription PDF:", pdfErr.message);
    }

    const prescWithData = await Prescription.findByPk(prescription.prescription_id, {
      include: [
        { model: Doctor, include: [{ model: User, attributes: ["full_name", "email"] }] },
        { model: Patient, include: [{ model: User, attributes: ["full_name", "email"] }] },
      ],
    });

    res.status(201).json({ success: true, data: prescWithData });
  } catch (err) {
    console.error("createPrescription error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id, {
      include: [
        { model: Doctor, include: [{ model: User, attributes: ["full_name", "email"] }] },
        { model: Patient, include: [{ model: User, attributes: ["full_name", "email"] }] },
      ],
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    res.json({ success: true, data: prescription });
  } catch (err) {
    console.error("getPrescription error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
