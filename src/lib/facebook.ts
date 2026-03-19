const PAGE_ID = process.env.FACEBOOK_PAGE_ID!;
const PAGE_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN!;
const BASE = "https://graph.facebook.com/v19.0";

async function fbFetch(path: string, options?: RequestInit) {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE}${path}${sep}access_token=${PAGE_TOKEN}`;
  const res = await fetch(url, { ...options, cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Facebook API error");
  return data;
}

// Thông tin page: fan_count, followers_count, name
export async function getPageInfo() {
  return fbFetch(`/${PAGE_ID}?fields=id,name,fan_count,followers_count,picture`);
}

// Insights: page_impressions (reach), page_engaged_users 28 ngày
export async function getPageInsights(metric: string, period = "day", since?: string, until?: string) {
  let q = `/${PAGE_ID}/insights/${metric}?period=${period}`;
  if (since) q += `&since=${since}`;
  if (until) q += `&until=${until}`;
  return fbFetch(q);
}

// Danh sách bài đăng + like + reach của từng bài
export async function getPagePosts(limit = 20) {
  return fbFetch(
    `/${PAGE_ID}/posts?fields=id,message,story,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true),shares&limit=${limit}`
  );
}

// Insights của từng bài: reach + impressions
export async function getPostInsights(postId: string) {
  try {
    return await fbFetch(`/${postId}/insights?metric=post_impressions,post_impressions_unique,post_reactions_by_type_total`);
  } catch {
    return null;
  }
}

// Danh sách conversations (Messenger)
export async function getConversations(limit = 20) {
  return fbFetch(`/${PAGE_ID}/conversations?fields=id,snippet,updated_time,message_count,unread_count,participants&limit=${limit}`);
}

// Tin nhắn trong 1 conversation
export async function getMessages(conversationId: string, limit = 20) {
  return fbFetch(`/${conversationId}/messages?fields=id,message,from,created_time,attachments&limit=${limit}`);
}

// Gửi tin nhắn
export async function sendMessage(recipientId: string, text: string) {
  return fbFetch(`/${PAGE_ID}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: "RESPONSE",
    }),
  });
}
