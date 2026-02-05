/**
 * Request Validation Middleware
 * Zod schemas everywhere for type-safe validation
 */

import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, FeenError, ErrorCode } from "./errors";

// ==========================================
// Common Validators
// ==========================================

export const IdSchema = z.string().cuid();

export const EmailSchema = z.string().email("Invalid email address");

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and number"
  );

export const NameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name too long");

export const UrlSchema = z.string().url("Invalid URL");

export const IpAddressSchema = z.string().regex(
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:3[0-2]|[12]?[0-9]))?$/,
  "Invalid IP address or CIDR"
);

export const DateTimeSchema = z.string().datetime("Invalid datetime format");

// ==========================================
// API Key Schemas
// ==========================================

export const ApiProviderSchema = z.enum([
  "OPENAI",
  "ANTHROPIC",
  "GOOGLE",
  "AZURE_OPENAI",
  "COHERE",
  "MISTRAL",
  "GROQ",
  "TOGETHER",
  "REPLICATE",
  "HUGGINGFACE",
  "CUSTOM",
]);

export const CreateApiKeySchema = z.object({
  name: NameSchema,
  description: z.string().max(500).optional(),
  provider: ApiProviderSchema,
  apiKey: z.string().min(1, "API key is required").max(500),
  rateLimit: z.number().int().min(1).max(100000).default(1000),
  dailyLimit: z.number().int().min(1).max(10000000).default(10000),
  teamId: IdSchema.optional(),
});

export const UpdateApiKeySchema = z.object({
  name: NameSchema.optional(),
  description: z.string().max(500).optional(),
  apiKey: z.string().min(1).max(500).optional(),
  rateLimit: z.number().int().min(1).max(100000).optional(),
  dailyLimit: z.number().int().min(1).max(10000000).optional(),
  isActive: z.boolean().optional(),
});

// ==========================================
// Shared Key Schemas
// ==========================================

export const TokenScopeSchema = z.enum([
  "chat:read",
  "chat:write",
  "completions:read",
  "completions:write",
  "embeddings:read",
  "embeddings:write",
  "images:read",
  "images:write",
  "images:edit",
  "audio:transcribe",
  "audio:translate",
  "audio:speech",
  "models:list",
  "models:read",
  "files:read",
  "files:write",
  "files:delete",
  "finetune:read",
  "finetune:write",
  "finetune:delete",
  "assistants:read",
  "assistants:write",
  "assistants:delete",
  "*",
]);

export const PermissionsSchema = z.object({
  chat: z.boolean().default(true),
  completions: z.boolean().default(true),
  embeddings: z.boolean().default(true),
  images: z.boolean().default(false),
  audio: z.boolean().default(false),
});

export const CreateSharedKeySchema = z.object({
  apiKeyId: IdSchema,
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  scopes: z.array(TokenScopeSchema).default(["*"]),
  permissions: PermissionsSchema.default({}),
  rateLimit: z.number().int().min(1).max(100000).default(100),
  dailyLimit: z.number().int().min(1).max(1000000).default(1000),
  maxUsage: z.number().int().min(1).optional(),
  expiresAt: DateTimeSchema.optional(),
  allowedIPs: z.array(IpAddressSchema).default([]),
  allowedModels: z.array(z.string()).default([]),
  requireSignature: z.boolean().default(false),
});

export const UpdateSharedKeySchema = z.object({
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  scopes: z.array(TokenScopeSchema).optional(),
  permissions: PermissionsSchema.optional(),
  rateLimit: z.number().int().min(1).max(100000).optional(),
  dailyLimit: z.number().int().min(1).max(1000000).optional(),
  maxUsage: z.number().int().min(1).optional(),
  expiresAt: DateTimeSchema.optional(),
  allowedIPs: z.array(IpAddressSchema).optional(),
  allowedModels: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// ==========================================
// Team Schemas
// ==========================================

export const TeamRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);

export const CreateTeamSchema = z.object({
  name: NameSchema,
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
});

export const InviteTeamMemberSchema = z.object({
  email: EmailSchema,
  role: TeamRoleSchema.default("MEMBER"),
});

// ==========================================
// Webhook Schemas
// ==========================================

export const WebhookEventSchema = z.enum([
  "usage.threshold.80",
  "usage.threshold.90",
  "usage.threshold.100",
  "usage.daily_limit_reached",
  "usage.rate_limit_triggered",
  "token.expiring_soon",
  "token.expired",
  "token.rotated",
  "token.created",
  "token.deleted",
  "security.suspicious_activity",
  "security.2fa_enabled",
  "security.2fa_disabled",
  "security.new_device_login",
  "key.created",
  "key.deleted",
  "key.revealed",
  "team.member_invited",
  "team.member_removed",
  "team.role_changed",
  "billing.subscription_created",
  "billing.subscription_cancelled",
  "billing.payment_failed",
]);

export const CreateWebhookSchema = z.object({
  url: UrlSchema,
  events: z.array(WebhookEventSchema).min(1, "At least one event required"),
  teamId: IdSchema.optional(),
});

// ==========================================
// 2FA Schemas
// ==========================================

export const TwoFactorCodeSchema = z
  .string()
  .min(6)
  .max(10)
  .regex(/^[A-Z0-9]+$/i, "Invalid verification code");

export const Enable2FASchema = z.object({
  secret: z.string().min(1),
  code: TwoFactorCodeSchema,
  backupCodes: z.array(z.string()).length(10),
});

export const Verify2FASchema = z.object({
  code: TwoFactorCodeSchema,
  action: z.string().min(1),
});

// ==========================================
// Pagination Schemas
// ==========================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ==========================================
// Validation Middleware
// ==========================================

type ValidationTarget = "body" | "query" | "params";

export function validate<T extends z.ZodType>(
  schema: T,
  target: ValidationTarget = "body"
) {
  return async (
    request: NextRequest,
    handler: (
      data: z.infer<T>,
      request: NextRequest
    ) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    try {
      let data: unknown;

      switch (target) {
        case "body":
          data = await request.json();
          break;
        case "query":
          data = Object.fromEntries(new URL(request.url).searchParams);
          break;
        case "params":
          // Params are passed separately in Next.js
          throw new Error("Use params from route handler context");
      }

      const validated = schema.parse(data);
      return handler(validated, request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(error);
      }
      throw error;
    }
  };
}

/**
 * Validate request body
 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  const body = await request.json();
  return schema.parse(body);
}

/**
 * Validate query params
 */
export function validateQuery<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return schema.parse(params);
}

/**
 * Safe parse with default value
 */
export function safeParse<T extends z.ZodType>(
  schema: T,
  data: unknown,
  defaultValue: z.infer<T>
): z.infer<T> {
  const result = schema.safeParse(data);
  return result.success ? result.data : defaultValue;
}

// ==========================================
// Type exports
// ==========================================

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof UpdateApiKeySchema>;
export type CreateSharedKeyInput = z.infer<typeof CreateSharedKeySchema>;
export type UpdateSharedKeyInput = z.infer<typeof UpdateSharedKeySchema>;
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export type InviteTeamMemberInput = z.infer<typeof InviteTeamMemberSchema>;
export type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
