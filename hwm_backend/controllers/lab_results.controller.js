const { LabResult, Appointment, Patient, User } = require("../models");

exports.getLabResults = async (req, res) => {
  try {
    const user = req.user;
    let where = {};

    // Filter by role: doctors see their lab results, patients see theirs, admins see all
    if (user.role === "doctor") {
      // Get appointments for this doctor
      const appointments = await Appointment.findAll({
        where: { doctor_id: (await require("../models").Doctor.findOne({ where: { user_id: user.user_id } })).doctor_id },
        attributes: ["appointment_id"],
        raw: true,
      });
      const appointmentIds = appointments.map((a) => a.appointment_id);
      where.appointment_id = appointmentIds.length > 0 ? { [require("sequelize").Op.in]: appointmentIds } : null;
      if (!where.appointment_id) {
        return res.json({ success: true, data: [] });
      }
    } else if (user.role === "patient") {
      const patient = await Patient.findOne({ where: { user_id: user.user_id } });
      where.patient_id = patient?.patient_id;
    }

    const labResults = await LabResult.findAll({
      where,
      include: [
        { model: Patient, include: [{ model: User, attributes: ["full_name", "email"] }] },
      ],
      order: [["result_date", "DESC"]],
    });

    res.json({ success: true, data: labResults });
  } catch (err) {
    console.error("getLabResults error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createLabResult = async (req, res) => {
  try {
    const { patient_id, appointment_id, test_type, result_date } = req.body;

    const labResult = await LabResult.create({
      patient_id,
      appointment_id,
      test_type,
      result_date,
      status: "pending",
      created_at: new Date(),
    });

    const labWithData = await LabResult.findByPk(labResult.lab_result_id, {
      include: [
        { model: Patient, include: [{ model: User, attributes: ["full_name", "email"] }] },
      ],
    });

    res.status(201).json({ success: true, data: labWithData });
  } catch (err) {
    console.error("createLabResult error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLabResult = async (req, res) => {
  try {
    const labResult = await LabResult.findByPk(req.params.id, {
      include: [
        { model: Patient, include: [{ model: User, attributes: ["full_name", "email"] }] },
      ],
    });

    if (!labResult) {
      return res.status(404).json({ success: false, message: "Lab result not found" });
    }

    res.json({ success: true, data: labResult });
  } catch (err) {
    console.error("getLabResult error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
