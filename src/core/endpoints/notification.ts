import axios from "axios";
import type { TNotification } from "../types";

export type NotificationFilters = {
    read?: boolean;
};

export const fetchUnreadCount = async (
    baseUrl: string,
    tenantId: string,
    userId: string,
) => {
    const { data } = await axios.get<{ count: number }>(
        `${baseUrl}/notifications/api/unread/count/${tenantId}/${userId}`,
    );
    return data.count ?? 0;
};

export const fetchNotifications = async (
    baseUrl: string,
    tenantId: string,
    userId: string,
    page: number = 1,
    limit: number = 5,
    filters?: NotificationFilters,
) => {
    const { data } = await axios.get<{ results: TNotification[] }>(
        `${baseUrl}/notifications/api/me/${tenantId}/${userId}`,
        {
            params: {
                page,
                limit,
                ...(filters?.read !== undefined ? { read: filters.read } : {}),
            },
        },
    );
    return data.results;
};

export const markNotificationAsRead = async (
    baseUrl: string,
    tenantId: string,
    userId: string,
    notificationId: string,
) => {
    const { data } = await axios.patch(
        `${baseUrl}/notifications/api/read/${tenantId}/${userId}/${notificationId}`,
    );
    return data;
};
