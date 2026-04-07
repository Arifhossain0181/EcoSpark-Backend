import express from "express";
import * as statsController from "./stats.controller";

const router = express.Router();
router.get("/", statsController.getStats);

export default router;
