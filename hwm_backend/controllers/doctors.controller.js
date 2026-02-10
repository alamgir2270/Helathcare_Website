const { Doctor, User } = require("../models");

exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      include: [{ model: User, attributes: ["user_id", "email", "full_name", "phone"] }],
    });
    res.json({ success: true, data: doctors });
  } catch (err) {
    console.error("getAllDoctors error:", err);
    res.status(500).json({ success: false, message: "Failed to load doctors" });
  }
};

exports.getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id, {
      include: [{ model: User, attributes: ["user_id", "email", "full_name", "phone"] }],
    });
    if (!doctor)
      return res.status(404).json({ success: false, message: "Doctor not found" });
    res.json({ success: true, data: doctor });
  } catch (err) {
    console.error("getDoctor error:", err);
    res.status(500).json({ success: false, message: "Failed to load doctor" });
  }
};

// Get current authenticated doctor's profile
exports.getCurrentDoctor = async (req, res) => {
  try {
    const user = req.user;
    const doctor = await Doctor.findOne({ where: { user_id: user.user_id || user.id }, include: [{ model: User, attributes: ["user_id", "email", "full_name", "phone"] }] });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });
    res.json({ success: true, data: doctor });
  } catch (err) {
    console.error("getCurrentDoctor error:", err);
    res.status(500).json({ success: false, message: "Failed to load doctor" });
  }
};

// Update a doctor's profile (self or admin)
exports.updateDoctor = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const doctor = await Doctor.findByPk(id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    // Only admin or the doctor owner can update
    if (user.role !== "admin" && doctor.user_id !== (user.user_id || user.id)) {
      return res.status(403).json({ success: false, message: "Not authorized to update this doctor" });
    }

    await doctor.update(req.body);

    const updated = await Doctor.findByPk(doctor.doctor_id, { include: [{ model: User, attributes: ["user_id", "email", "full_name", "phone"] }] });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateDoctor error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
