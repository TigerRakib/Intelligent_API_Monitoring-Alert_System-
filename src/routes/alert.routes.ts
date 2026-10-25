import { Router } from "express";

import { getAlertsController } from "../controllers/alert.controller";

const router = Router();

router.get("/alerts", getAlertsController);

export default router;
