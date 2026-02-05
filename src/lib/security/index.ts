/**
 * Security Module - Central Export
 */

// Token Scopes
export {
  TokenScope,
  ScopePresets,
  EndpointScopes,
  hasRequiredScope,
  parseScopes,
  validateScopes,
  getScopeDescription,
} from "./token-scopes";

// Request Signing
export {
  generateSignature,
  signRequest,
  verifySignature,
  extractSignatureHeaders,
  verifySignedRequest,
  generateSigningSecret,
  hashSigningSecret,
  SigningSDK,
  type SignedRequestHeaders,
  type SignaturePayload,
} from "./request-signing";

// Token Rotation
export {
  SuspiciousActivityType,
  recordSuspiciousActivity,
  rotateToken,
  requestTokenRotation,
  scheduleRotation,
  checkScheduledRotation,
  detectBurstRequests,
  detectGeographicAnomaly,
  getTokenSecurityStatus,
  type SuspiciousActivityEvent,
} from "./token-rotation";

// Two-Factor Authentication
export {
  generateTwoFactorSecret,
  verifyTOTP,
  verifyBackupCode,
  storeBackupCodes,
  isTwoFactorEnabled,
  enableTwoFactor,
  disableTwoFactor,
  requireTwoFactorVerification,
  generateBypassToken,
  verifyBypassToken,
  SENSITIVE_ACTIONS,
  type TwoFactorSecret,
  type TwoFactorVerification,
  type SensitiveAction,
} from "./two-factor";
