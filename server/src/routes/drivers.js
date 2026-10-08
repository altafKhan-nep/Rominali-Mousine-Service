import { Router } from 'express';
import { protect, requireRole, requireApprovedDriver } from '../middleware/auth.js';
import * as driver from '../controllers/driverController.js';

const router = Router();

router.use(protect);

// Any authenticated user can look up nearby available drivers + ETA
router.get('/nearby', driver.nearbyDrivers);
router.get('/:id/eta', driver.driverEta);

// Driver-only actions (must be admin-approved)
router.patch('/availability', requireRole('driver'), requireApprovedDriver, driver.setAvailability);
router.post('/location', requireRole('driver'), requireApprovedDriver, driver.location);
router.get('/stats', requireRole('driver'), requireApprovedDriver, driver.stats);

export default router;