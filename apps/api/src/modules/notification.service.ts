import { prisma, sanitizeText } from "./db.service";

export interface NotificationData {
  id: string;
  type: string; // "info" | "track" | "playlist" | "system" | "achievement"
  title: string;
  message: string;
  icon?: string;
  artworkUrl?: string;
  actionUrl?: string;
  isRead: boolean;
  isSystem: boolean;
  createdAt: string;
}

export interface CreateNotificationInput {
  type?: "info" | "track" | "playlist" | "system" | "achievement";
  title: string;
  message: string;
  icon?: string;
  artworkUrl?: string;
  actionUrl?: string;
  isSystem?: boolean;
}

const MAX_NOTIFICATIONS = 100;

function toNotifData(row: any): NotificationData {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    icon: row.icon ?? undefined,
    artworkUrl: row.artworkUrl ?? undefined,
    actionUrl: row.actionUrl ?? undefined,
    isRead: row.isRead,
    isSystem: row.isSystem,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export const notificationService = {
  async getNotifications(userId: string, limit = 50): Promise<NotificationData[]> {
    try {
      const rows = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: Math.min(MAX_NOTIFICATIONS, Math.max(1, limit)),
      });
      return rows.map(toNotifData);
    } catch (err) {
      console.error("[notificationService.getNotifications] Error:", err);
      return [];
    }
  },

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    try {
      const count = await prisma.notification.count({
        where: { userId, isRead: false },
      });
      return { count };
    } catch {
      return { count: 0 };
    }
  },

  async createNotification(
    userId: string,
    input: CreateNotificationInput,
  ): Promise<NotificationData | null> {
    try {
      const notif = await prisma.notification.create({
        data: {
          userId,
          type: input.type ?? "info",
          title: sanitizeText(input.title, 120),
          message: sanitizeText(input.message, 300),
          icon: input.icon ?? null,
          artworkUrl: input.artworkUrl ?? null,
          actionUrl: input.actionUrl ?? null,
          isSystem: input.isSystem ?? false,
        },
      });

      // Prune oldest beyond MAX_NOTIFICATIONS
      const total = await prisma.notification.count({ where: { userId } });
      if (total > MAX_NOTIFICATIONS) {
        const oldest = await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          take: total - MAX_NOTIFICATIONS,
          select: { id: true },
        });
        if (oldest.length > 0) {
          await prisma.notification.deleteMany({
            where: { id: { in: oldest.map((n) => n.id) } },
          });
        }
      }

      return toNotifData(notif);
    } catch (err) {
      console.error("[notificationService.createNotification] Error:", err);
      return null;
    }
  },

  async markAsRead(userId: string, notifId: string): Promise<NotificationData | null> {
    try {
      const notif = await prisma.notification.findFirst({
        where: { id: notifId, userId },
      });
      if (!notif) return null;

      const updated = await prisma.notification.update({
        where: { id: notifId },
        data: { isRead: true },
      });
      return toNotifData(updated);
    } catch {
      return null;
    }
  },

  async markAllRead(userId: string): Promise<{ updated: number }> {
    try {
      const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return { updated: result.count };
    } catch {
      return { updated: 0 };
    }
  },

  async deleteNotification(userId: string, notifId: string): Promise<boolean> {
    try {
      const notif = await prisma.notification.findFirst({
        where: { id: notifId, userId },
      });
      if (!notif) return false;
      await prisma.notification.delete({ where: { id: notifId } });
      return true;
    } catch {
      return false;
    }
  },

  async clearAll(userId: string): Promise<{ deleted: number }> {
    try {
      const result = await prisma.notification.deleteMany({ where: { userId } });
      return { deleted: result.count };
    } catch {
      return { deleted: 0 };
    }
  },

  async createSystemNotification(
    userId: string,
    type: CreateNotificationInput["type"],
    title: string,
    message: string,
    opts?: { icon?: string; artworkUrl?: string; actionUrl?: string },
  ): Promise<void> {
    try {
      await this.createNotification(userId, {
        type,
        title,
        message,
        isSystem: true,
        ...opts,
      });
    } catch {
      // Non-critical, fail silently
    }
  },
};
