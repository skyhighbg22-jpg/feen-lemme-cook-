/**
 * Token Scoping System
 * Restricts tokens to specific endpoints, operations, and resources
 */

export enum TokenScope {
  // Chat & Completions
  CHAT_READ = "chat:read",
  CHAT_WRITE = "chat:write",
  COMPLETIONS_READ = "completions:read",
  COMPLETIONS_WRITE = "completions:write",

  // Embeddings
  EMBEDDINGS_READ = "embeddings:read",
  EMBEDDINGS_WRITE = "embeddings:write",

  // Images
  IMAGES_READ = "images:read",
  IMAGES_WRITE = "images:write",
  IMAGES_EDIT = "images:edit",

  // Audio
  AUDIO_TRANSCRIBE = "audio:transcribe",
  AUDIO_TRANSLATE = "audio:translate",
  AUDIO_SPEECH = "audio:speech",

  // Models
  MODELS_LIST = "models:list",
  MODELS_READ = "models:read",

  // Files (for assistants, fine-tuning)
  FILES_READ = "files:read",
  FILES_WRITE = "files:write",
  FILES_DELETE = "files:delete",

  // Fine-tuning
  FINETUNE_READ = "finetune:read",
  FINETUNE_WRITE = "finetune:write",
  FINETUNE_DELETE = "finetune:delete",

  // Assistants
  ASSISTANTS_READ = "assistants:read",
  ASSISTANTS_WRITE = "assistants:write",
  ASSISTANTS_DELETE = "assistants:delete",

  // Wildcard (all permissions)
  ALL = "*",
}

// Scope presets for common use cases
export const ScopePresets = {
  // Read-only access to chat and completions
  CHAT_READONLY: [TokenScope.CHAT_READ, TokenScope.COMPLETIONS_READ, TokenScope.MODELS_LIST],

  // Standard chat access
  CHAT_STANDARD: [
    TokenScope.CHAT_READ,
    TokenScope.CHAT_WRITE,
    TokenScope.COMPLETIONS_READ,
    TokenScope.COMPLETIONS_WRITE,
    TokenScope.MODELS_LIST,
  ],

  // Full chat with embeddings
  CHAT_WITH_EMBEDDINGS: [
    TokenScope.CHAT_READ,
    TokenScope.CHAT_WRITE,
    TokenScope.COMPLETIONS_READ,
    TokenScope.COMPLETIONS_WRITE,
    TokenScope.EMBEDDINGS_READ,
    TokenScope.EMBEDDINGS_WRITE,
    TokenScope.MODELS_LIST,
  ],

  // Image generation only
  IMAGES_ONLY: [TokenScope.IMAGES_READ, TokenScope.IMAGES_WRITE, TokenScope.MODELS_LIST],

  // Audio processing only
  AUDIO_ONLY: [
    TokenScope.AUDIO_TRANSCRIBE,
    TokenScope.AUDIO_TRANSLATE,
    TokenScope.AUDIO_SPEECH,
    TokenScope.MODELS_LIST,
  ],

  // Full access (use with caution)
  FULL_ACCESS: [TokenScope.ALL],
};

// Endpoint to scope mapping
export const EndpointScopes: Record<string, TokenScope[]> = {
  // OpenAI endpoints
  "v1/chat/completions": [TokenScope.CHAT_WRITE, TokenScope.ALL],
  "v1/completions": [TokenScope.COMPLETIONS_WRITE, TokenScope.ALL],
  "v1/embeddings": [TokenScope.EMBEDDINGS_WRITE, TokenScope.ALL],
  "v1/images/generations": [TokenScope.IMAGES_WRITE, TokenScope.ALL],
  "v1/images/edits": [TokenScope.IMAGES_EDIT, TokenScope.ALL],
  "v1/images/variations": [TokenScope.IMAGES_WRITE, TokenScope.ALL],
  "v1/audio/transcriptions": [TokenScope.AUDIO_TRANSCRIBE, TokenScope.ALL],
  "v1/audio/translations": [TokenScope.AUDIO_TRANSLATE, TokenScope.ALL],
  "v1/audio/speech": [TokenScope.AUDIO_SPEECH, TokenScope.ALL],
  "v1/models": [TokenScope.MODELS_LIST, TokenScope.MODELS_READ, TokenScope.ALL],
  "v1/files": [TokenScope.FILES_READ, TokenScope.FILES_WRITE, TokenScope.ALL],
  "v1/fine_tuning/jobs": [TokenScope.FINETUNE_READ, TokenScope.FINETUNE_WRITE, TokenScope.ALL],
  "v1/assistants": [TokenScope.ASSISTANTS_READ, TokenScope.ASSISTANTS_WRITE, TokenScope.ALL],

  // Anthropic endpoints
  "v1/messages": [TokenScope.CHAT_WRITE, TokenScope.ALL],
  "v1/complete": [TokenScope.COMPLETIONS_WRITE, TokenScope.ALL],
};

/**
 * Check if a token has the required scope for an endpoint
 */
export function hasRequiredScope(
  tokenScopes: string[],
  endpoint: string,
  method: string
): { allowed: boolean; requiredScopes: TokenScope[]; missingScopes: TokenScope[] } {
  // Normalize endpoint (remove leading slash, query params)
  const normalizedEndpoint = endpoint.replace(/^\//, "").split("?")[0];

  // Find matching endpoint pattern
  let requiredScopes: TokenScope[] = [];

  for (const [pattern, scopes] of Object.entries(EndpointScopes)) {
    if (normalizedEndpoint.startsWith(pattern) || normalizedEndpoint.includes(pattern)) {
      requiredScopes = scopes;
      break;
    }
  }

  // If no specific scopes required, allow by default (for unknown endpoints)
  if (requiredScopes.length === 0) {
    return { allowed: true, requiredScopes: [], missingScopes: [] };
  }

  // Check if token has wildcard or any of the required scopes
  const hasWildcard = tokenScopes.includes(TokenScope.ALL);
  if (hasWildcard) {
    return { allowed: true, requiredScopes, missingScopes: [] };
  }

  // Check for any matching scope
  const hasMatchingScope = requiredScopes.some((scope) =>
    tokenScopes.includes(scope)
  );

  const missingScopes = hasMatchingScope
    ? []
    : requiredScopes.filter((s) => s !== TokenScope.ALL);

  return {
    allowed: hasMatchingScope,
    requiredScopes,
    missingScopes,
  };
}

/**
 * Parse scope string to array
 */
export function parseScopes(scopeString: string): string[] {
  return scopeString
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Validate scope string
 */
export function validateScopes(scopes: string[]): { valid: boolean; invalid: string[] } {
  const validScopes = Object.values(TokenScope);
  const invalid = scopes.filter((s) => !validScopes.includes(s as TokenScope));
  return {
    valid: invalid.length === 0,
    invalid,
  };
}

/**
 * Get human-readable scope description
 */
export function getScopeDescription(scope: TokenScope): string {
  const descriptions: Record<TokenScope, string> = {
    [TokenScope.CHAT_READ]: "Read chat messages",
    [TokenScope.CHAT_WRITE]: "Create chat completions",
    [TokenScope.COMPLETIONS_READ]: "Read completions",
    [TokenScope.COMPLETIONS_WRITE]: "Create completions",
    [TokenScope.EMBEDDINGS_READ]: "Read embeddings",
    [TokenScope.EMBEDDINGS_WRITE]: "Create embeddings",
    [TokenScope.IMAGES_READ]: "View images",
    [TokenScope.IMAGES_WRITE]: "Generate images",
    [TokenScope.IMAGES_EDIT]: "Edit images",
    [TokenScope.AUDIO_TRANSCRIBE]: "Transcribe audio",
    [TokenScope.AUDIO_TRANSLATE]: "Translate audio",
    [TokenScope.AUDIO_SPEECH]: "Generate speech",
    [TokenScope.MODELS_LIST]: "List available models",
    [TokenScope.MODELS_READ]: "View model details",
    [TokenScope.FILES_READ]: "Read files",
    [TokenScope.FILES_WRITE]: "Upload files",
    [TokenScope.FILES_DELETE]: "Delete files",
    [TokenScope.FINETUNE_READ]: "View fine-tuning jobs",
    [TokenScope.FINETUNE_WRITE]: "Create fine-tuning jobs",
    [TokenScope.FINETUNE_DELETE]: "Cancel fine-tuning jobs",
    [TokenScope.ASSISTANTS_READ]: "View assistants",
    [TokenScope.ASSISTANTS_WRITE]: "Create/modify assistants",
    [TokenScope.ASSISTANTS_DELETE]: "Delete assistants",
    [TokenScope.ALL]: "Full access to all operations",
  };
  return descriptions[scope] || scope;
}
