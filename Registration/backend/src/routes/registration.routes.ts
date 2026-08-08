import { Router } from 'express';
import {
  registerForEvent,
  getRegistrations,
  getAllRegistrations,
  exportRegistrationsCSV,
  updateRegistrationStatus,
  dispatchFeedbackForm,
  submitPublicFeedback,
  verifyParticipantMobile,
  markSelfAttendance,
  registerSpotParticipant,
  verifyKitQr,
  issueKit,
  verifyFoodQr,
  redeemFoodCoupon,
  scanKit,
  scanFood,
  lookupParticipantForVerification,
  getSingleRegistrationDetails,
  deleteRegistration,
  manualSearchParticipant,
  manualMarkAttendance
} from '../controllers/registration.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Manual Attendance Endpoints (Admin only)
router.post('/manual-search', authenticateJWT as any, manualSearchParticipant as any);
router.post('/manual-checkin', authenticateJWT as any, manualMarkAttendance as any);

// Single registration details lookup endpoint
router.get('/details/:id', authenticateJWT as any, getSingleRegistrationDetails as any);

// Mobile Admin Participant Verification Lookup endpoint (JWT Authenticated)
router.post('/verify-lookup', authenticateJWT as any, lookupParticipantForVerification as any);

// Direct QR Scanner Action Endpoints
router.post('/scan-kit', scanKit as any);
router.post('/scan-food', scanFood as any);

// ============================================================
// IMPORTANT: Static routes MUST come before dynamic /:param routes
// to prevent Express from matching literal strings as param values.
// ============================================================

// Public registration endpoint
router.post('/', registerForEvent);

// Admin-only: Get all registrations (must be before /:eventId)
router.get('/', authenticateJWT as any, getAllRegistrations as any);

// Admin-only: Dispatch feedback (must be before /:eventId)
router.post('/dispatch-feedback/:eventId', authenticateJWT as any, dispatchFeedbackForm as any);

// Public: Spot / walk-in registration (must be before /:eventId)
router.post('/spot/:eventId', registerSpotParticipant as any);

// Public: Submit feedback (must be before /:eventId)
router.post('/public-feedback/:eventId', submitPublicFeedback as any);

// Kit Distribution Desk endpoints (must be before /:eventId)
router.post('/kit/verify-qr', verifyKitQr as any);
router.post('/kit/issue', issueKit as any);

// Food Coupon Redemption Desk endpoints (must be before /:eventId)
router.post('/food/verify-qr', verifyFoodQr as any);
router.post('/food/redeem', redeemFoodCoupon as any);

// Dynamic routes — these MUST come last to avoid shadowing static routes above
// Public: Register for a specific event
router.post('/:eventId', registerForEvent);

// Public: Venue entrance QR scan — mobile verification
router.post('/:eventId/verify-mobile', verifyParticipantMobile as any);

// Public: Participant self check-in / mark attendance
router.post('/:registrationId/mark-attendance', markSelfAttendance as any);

// Admin-only: Get registrations for a specific event (after static GET routes)
router.get('/:eventId/export', authenticateJWT as any, exportRegistrationsCSV as any);
router.get('/:eventId', authenticateJWT as any, getRegistrations as any);
router.put('/:id/status', authenticateJWT as any, updateRegistrationStatus as any);
router.patch('/:id', authenticateJWT as any, updateRegistrationStatus as any);
router.delete('/:id', authenticateJWT as any, deleteRegistration as any);

export default router;
