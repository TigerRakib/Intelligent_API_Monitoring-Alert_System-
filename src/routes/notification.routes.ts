import { Router } from "express";

import {
  getNotificationSettingsController,
  updateNotificationSettingsController,
} from "../controllers/notification.controller";

const router = Router();

router.get("/settings/notifications", getNotificationSettingsController);
router.put("/settings/notifications", updateNotificationSettingsController);

export default router;
