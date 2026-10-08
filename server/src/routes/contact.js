import { Router } from 'express';
import * as contact from '../controllers/contactController.js';

const router = Router();

router.post('/quote', contact.sendQuote);

export default router;