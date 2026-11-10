const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const twoFactor = require('../controllers/twofactor.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.post('/login/2fa', authController.login2fa);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.getMe);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', verifyToken, authController.changePassword);

// Two-factor authentication (authenticator apps, multiple devices)
router.get('/2fa/status', verifyToken, twoFactor.getStatus);
router.post('/2fa/setup', verifyToken, twoFactor.setup);
router.post('/2fa/verify', verifyToken, twoFactor.verifySetup);
router.post('/2fa/authenticators/:id/remove', verifyToken, twoFactor.removeAuthenticator);
router.post('/2fa/disable', verifyToken, twoFactor.disable);
router.post('/2fa/backup-codes', verifyToken, twoFactor.regenerateBackupCodes);

router.get('/login-history', verifyToken, twoFactor.myLoginHistory);

module.exports = router;
