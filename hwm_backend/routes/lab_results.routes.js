const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const { getLabResults, createLabResult, getLabResult } = require("../controllers/lab_results.controller");

router.get("/", auth, getLabResults);
router.post("/", auth, role(["doctor","admin"]), createLabResult);
router.get("/:id", auth, getLabResult);

module.exports = router;
