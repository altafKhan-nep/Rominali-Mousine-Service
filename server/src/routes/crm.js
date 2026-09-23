import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { audit } from '../middleware/audit.js';
import * as admin from '../controllers/adminController.js';
import * as crm from '../controllers/crmController.js';

const router = Router();
// All CRM routes require elevated roles
router.use(protect, requireRole('admin', 'super_admin', 'dispatcher', 'manager', 'finance', 'support'));

// Reuse existing admin analytics but expose under /crm
router.get('/analytics', admin.analytics);
router.get('/analytics/timeseries', crm.timeseries);
router.get('/analytics/heatmap', crm.heatmap);

router.get('/rides', admin.rides);
router.patch('/rides/:id/dispatch', audit('rides.dispatch', { targetType: 'Ride' }), admin.assignDriver);
router.post('/rides/:id/no-show', audit('rides.no_show', { targetType: 'Ride' }), crm.markNoShow);

router.get('/drivers', admin.drivers);
router.get('/fleet/vehicles', crm.listVehicles);
router.post('/fleet/vehicles', audit('fleet.createVehicle', { targetType: 'Vehicle' }), crm.createVehicle);
router.patch('/fleet/vehicles/:id', audit('fleet.updateVehicle', { targetType: 'Vehicle' }), crm.updateVehicle);

router.get('/passengers', crm.listPassengers);
router.get('/passengers/:id', crm.getPassenger);
router.get('/operations/live', crm.liveOps);

router.get('/tickets', crm.listTickets);
router.post('/tickets', audit('tickets.create', { targetType: 'Ticket' }), crm.createTicket);
router.patch('/tickets/:id', audit('tickets.update', { targetType: 'Ticket' }), crm.updateTicket);

router.get('/audit', crm.listAudit);

export default router;
