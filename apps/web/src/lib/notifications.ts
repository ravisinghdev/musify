export interface AppNotification {
  id: string;
  type: "info" | "track" | "playlist" | "system" | "achievement";
  title: string;
  message: string;
  icon?: string;
  artworkUrl?: string;
  actionUrl?: string;
  isRead: boolean;
  isSystem: boolean;
  createdAt: string;
}

export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    if (window.location.port !== "3000") {
      return "/api/v1";
    }
    return `http://${window.location.hostname}:3001/api/v1`;
  }
  return "http://localhost:3001/api/v1";
}

function getHeaders(sessionId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (sessionId) {
    headers["x-user-session-id"] = sessionId;
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("musify_auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export const notificationsApi = {
  async fetch(sessionId?: string | null, limit = 50): Promise<AppNotification[]> {
    try {
      const res = await fetch(`${getApiBase()}/notifications?limit=${limit}`, {
        headers: getHeaders(sessionId),
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.notifications) ? data.notifications : [];
    } catch {
      return [];
    }
  },

  async getUnreadCount(sessionId?: string | null): Promise<number> {
    try {
      const res = await fetch(`${getApiBase()}/notifications/unread-count`, {
        headers: getHeaders(sessionId),
        cache: "no-store",
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return typeof data.count === "number" ? data.count : 0;
    } catch {
      return 0;
    }
  },

  async markAsRead(id: string, sessionId?: string | null): Promise<AppNotification | null> {
    try {
      const res = await fetch(`${getApiBase()}/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
        headers: getHeaders(sessionId),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.notification ?? null;
    } catch {
      return null;
    }
  },

  async markAllRead(sessionId?: string | null): Promise<number> {
    try {
      const res = await fetch(`${getApiBase()}/notifications/read-all`, {
        method: "PATCH",
        headers: getHeaders(sessionId),
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.updated ?? 0;
    } catch {
      return 0;
    }
  },

  async deleteOne(id: string, sessionId?: string | null): Promise<boolean> {
    try {
      const res = await fetch(`${getApiBase()}/notifications/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getHeaders(sessionId),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async clearAll(sessionId?: string | null): Promise<number> {
    try {
      const res = await fetch(`${getApiBase()}/notifications`, {
        method: "DELETE",
        headers: getHeaders(sessionId),
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.deleted ?? 0;
    } catch {
      return 0;
    }
  },
};
