import React, { useEffect, useState } from 'react'
import { removeToken } from '../api/client'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications'
import { useNavigate } from 'react-router-dom'

export default function Header({ user }){
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const loadNotifications = async () => {
    try {
      const payload = await fetchNotifications()
      setNotifications(payload.notifications || [])
      setUnreadCount(payload.unread_count || 0)
    } catch {
      // Dashboard data remains usable if notifications are temporarily unavailable.
    }
  }

  useEffect(() => {
    loadNotifications()
    const intervalId = setInterval(loadNotifications, 15000)
    return () => clearInterval(intervalId)
  }, [])

  const handleMarkRead = async (notification) => {
    if (notification.is_read) return
    await markNotificationRead(notification.id)
    await loadNotifications()
  }

  const handleMarkAllRead = async () => {
    if (!unreadCount) return
    await markAllNotificationsRead()
    await loadNotifications()
  }

  const formatDate = (value) => value ? new Date(value).toLocaleString() : 'Just now'

  const handleLogout = () => {
    removeToken()
    navigate('/logout')
  }

  return (
    <header className="dashboard-top">
      <div className="top-left">
        <div className="search-bar">
          <span className="search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10.5 18a7.5 7.5 0 1 1 5.25-2.25l4.5 4.5-1.5 1.5-4.5-4.5A7.463 7.463 0 0 1 10.5 18Zm0-13a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" fill="#0b79ff"/></svg>
          </span>
          <input placeholder="Search symptoms, reports, recommendations..." />
        </div>
      </div>

      <div className="top-right">
        <div className="notification-menu">
          <button className="icon-btn notification-btn" title="Notifications" aria-label="Notifications" onClick={() => setIsOpen((open) => !open)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22a2 2 0 002-2H10a2 2 0 002 2z" fill="#0b79ff" opacity="0.9"/><path d="M18 16v-5a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z" fill="#0b79ff"/></svg>
            {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>
          {isOpen && (
            <div className="notification-panel">
              <div className="notification-panel-header">
                <div>
                  <strong>Notifications</strong>
                  <span>{unreadCount} unread</span>
                </div>
                <button className="text-button" onClick={handleMarkAllRead} disabled={!unreadCount}>Mark all read</button>
              </div>
              <div className="notification-list">
                {notifications.length ? notifications.map((notification) => (
                  <button
                    className={`notification-item${notification.is_read ? ' read' : ' unread'}`}
                    key={notification.id}
                    onClick={() => handleMarkRead(notification)}
                  >
                    <span className="notification-status" aria-label={notification.is_read ? 'Read' : 'Unread'} />
                    <span className="notification-copy">
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <small>{formatDate(notification.created_at)} · {notification.is_read ? 'Read' : 'Unread'}</small>
                    </span>
                  </button>
                )) : <div className="notification-empty">You are all caught up.</div>}
              </div>
            </div>
          )}
        </div>
        <div className="profile-card" onClick={() => navigate('/dashboard/patient/profile') }>
          <div className="avatar-circle">
            {((user?.full_name || user?.email || 'Patient')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0].toUpperCase())
              .join('')) || 'P'}
          </div>
          <div className="welcome">
            <div className="welcome-line">Good afternoon,</div>
            <div className="welcome-name">{user?.full_name || user?.email || 'Patient'}</div>
          </div>
        </div>
        <button className="signout-button" onClick={handleLogout}>Sign out</button>
      </div>
    </header>
  )
}
