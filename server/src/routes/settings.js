import { Router } from 'express';
import * as settings from '../controllers/settingsController.js';

// Public subset of app settings (support info, toggles) — no auth needed.
const router = Router();

router.get('/', settings.publicSettings);

export default router;
