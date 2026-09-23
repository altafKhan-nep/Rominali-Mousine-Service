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
router.patch('/rides/:id', audit('rides.update', { targetType: 'Ride' }), admin.updateRide);
router.post('/rides/:id/no-show', audit('rides.no_show', { targetType: 'Ride' }), crm.markNoShow);

router.get('/drivers', admin.drivers);
router.get('/fleet/vehicles', crm.listVehicles);
router.post('/fleet/vehicles', audit('fleet.createVehicle', { targetType: 'Vehicle' }), crm.createVehicle);
router.patch('/fleet/vehicles/:id', audit('fleet.updateVehicle', { targetType: 'Vehicle' }), crm.updateVehicle);
router.delete('/fleet/vehicles/:id', audit('fleet.deleteVehicle', { targetType: 'Vehicle' }), crm.deleteVehicle);

router.get('/users', admin.users);
router.post('/users', audit('users.create', { targetType: 'User' }), admin.createUser);
router.patch('/users/:id/suspend', audit('users.suspend', { targetType: 'User' }), admin.suspendUser);
router.patch('/users/:id/unsuspend', audit('users.unsuspend', { targetType: 'User' }), admin.unsuspendUser);
router.patch('/users/:id', audit('users.update', { targetType: 'User' }), admin.updateUser);
router.delete('/users/:id', audit('users.delete', { targetType: 'User' }), admin.deleteUser);

router.get('/content', admin.listContent);
router.patch('/content', audit('content.update'), admin.updateContent);

router.get('/passengers', crm.listPassengers);
router.get('/passengers/:id', crm.getPassenger);
router.get('/operations/live', crm.liveOps);

router.get('/tickets', crm.listTickets);
router.post('/tickets', audit('tickets.create', { targetType: 'Ticket' }), crm.createTicket);
router.patch('/tickets/:id', audit('tickets.update', { targetType: 'Ticket' }), crm.updateTicket);

router.get('/audit', crm.listAudit);

export default router;
