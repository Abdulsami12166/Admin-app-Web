- [ ] Inspect current failing login OTP email flow (authController + email services)
- [x] Identify root cause: missing RESEND_FROM triggers runtime error in services/emailService.js
- [x] Update authController.js to fall back to utils/emailService.js when Resend fails due to missing sender config
- [ ] Re-run build/tests / optionally start server to confirm /api/v1/auth/login returns 200 and OTP dispatch doesn’t crash


