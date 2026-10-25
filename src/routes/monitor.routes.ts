import { Router } from "express";
import { monitorController } from "../controllers/monitor.controller";

const router = Router();

router.post("/monitor", monitorController);

export default router;
