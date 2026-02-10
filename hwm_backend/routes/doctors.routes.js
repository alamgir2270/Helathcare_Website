const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getAllDoctors, getDoctor, getCurrentDoctor, updateDoctor } = require("../controllers/doctors.controller");

router.get("/", auth, getAllDoctors);
router.get("/me", auth, getCurrentDoctor);
router.get("/:id", auth, getDoctor);
router.patch("/:id", auth, updateDoctor);

module.exports = router;
