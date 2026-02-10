const { Department, Doctor, User } = require("../models");

// GET /api/public/departments
exports.getDepartmentsWithDoctors = async (req, res) => {
  try {
    const depts = await Department.findAll({
      include: [
        {
          model: Doctor,
          include: [{ model: User, attributes: ["user_id", "email", "full_name", "phone"] }],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json({ success: true, data: depts });
  } catch (err) {
    console.error("Public API error:", err);
    res.status(500).json({ success: false, message: "Failed to load departments" });
  }
};

// GET /api/public/doctors/:id
exports.getDoctorPublic = async (req, res) => {
  try {
    const doc = await Doctor.findByPk(req.params.id, {
      include: [{ model: User, attributes: ["user_id", "email", "full_name", "phone"] }],
    });
    if (!doc) return res.status(404).json({ success: false, message: "Doctor not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error("Public doctor error:", err);
    res.status(500).json({ success: false, message: "Failed to load doctor" });
  }
};
