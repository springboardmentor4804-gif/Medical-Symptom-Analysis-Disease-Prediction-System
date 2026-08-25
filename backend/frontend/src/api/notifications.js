import { apiFetch } from './client'

export async function fetchNotifications() {
  return apiFetch('/notifications')
}

export async function markNotificationRead(id) {
  return apiFetch(`/notifications/${id}/read`, { method: 'POST' })
}

export async function markAllNotificationsRead() {
  return apiFetch('/notifications/read-all', { method: 'POST' })
}
