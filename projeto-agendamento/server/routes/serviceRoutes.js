const express = require("express");
const router = express.Router();
const serviceController = require("../controller/serviceController.js");
const auth = require("../middlewares/auth.js");

router.get("/public", serviceController.getPublicAll);

router.get("/", auth, serviceController.getAll);
router.get("/:id", auth, serviceController.getById);
router.post("/", auth, serviceController.create);
router.put("/:id", auth, serviceController.update);
router.delete("/:id", auth, serviceController.delete);

module.exports = router;
