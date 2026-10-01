// ────────────────────────────────────────────────────────────────────────────
// Chặn crawler của các dịch vụ AI / search (OpenAI, Anthropic, Google AI, ...).
// CRM là hệ thống nội bộ → không cho bất kỳ bot nào đọc nội dung, kể cả trang login.
// ────────────────────────────────────────────────────────────────────────────

const BLOCKED_BOT_PATTERN = new RegExp(
  [
    // OpenAI
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    // Anthropic
    "ClaudeBot",
    "Claude-Web",
    "Claude-User",
    "Claude-SearchBot",
    "anthropic-ai",
    // Google / Apple / Meta / ByteDance / khác
    "Google-Extended",
    "Applebot-Extended",
    "meta-externalagent",
    "FacebookBot",
    "Bytespider",
    "PerplexityBot",
    "Perplexity-User",
    "CCBot",
    "cohere-ai",
    "Amazonbot",
    "Diffbot",
    "YouBot",
    "omgili",
    "ImagesiftBot",
  ].join("|"),
  "i"
);

export function isBlockedBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BLOCKED_BOT_PATTERN.test(userAgent);
}
