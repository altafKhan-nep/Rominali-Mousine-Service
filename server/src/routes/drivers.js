import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import * as driver from '../controllers/driverController.js';

const router = Router();

router.use(protect);

// Any authenticated user can look up nearby available drivers + ETA
router.get('/nearby', driver.nearbyDrivers);
router.get('/:id/eta', driver.driverEta);

// Driver-only actions
router.patch('/availability', requireRole('driver'), driver.setAvailability);
router.post('/location', requireRole('driver'), driver.location);
router.get('/stats', requireRole('driver'), driver.stats);

export default router;