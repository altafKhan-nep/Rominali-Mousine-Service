import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtp,
  socialRedirect,
  socialCallback,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);

// Phone OTP login
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

// Social OAuth (Passport redirect flow)
router.get('/google', socialRedirect('google'));
router.get('/google/callback', socialCallback('google'));
router.get('/facebook', socialRedirect('facebook'));
router.get('/facebook/callback', socialCallback('facebook'));

router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, me);

export default router;