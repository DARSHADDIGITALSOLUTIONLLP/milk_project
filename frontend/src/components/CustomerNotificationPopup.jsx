import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import axios from "axios";
import "./CustomerNotificationPopup.css";

/**
 * Customer Notification Popup
 * Shows admin's notification to customers on first login
 */
function CustomerNotificationPopup() {
  const [show, setShow] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate a stable localStorage key for this notification version
  const getNotificationKey = (notif) => {
    if (!notif) return null;
    if (notif.updated_at) {
      return `notification_seen_${new Date(notif.updated_at).getTime()}`;
    }
    // Fallback: use message text if updated_at is missing
    return `notification_seen_${notif.message}`;
  };

  useEffect(() => {
    fetchNotification();
  }, []);

  const fetchNotification = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get("/api/user/get-customer-notification", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (
        response.data &&
        response.data.notification &&
        response.data.notification.active &&
        response.data.notification.message
      ) {
        const notificationData = response.data.notification;

        // Check if customer has already seen this notification version
        const notificationKey = getNotificationKey(notificationData);
        const hasSeen = notificationKey
          ? localStorage.getItem(notificationKey)
          : null;

        if (!hasSeen) {
          setNotification(notificationData);
          setShow(true);
        }
      }
    } catch (error) {
      console.error("Error fetching notification:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Mark notification as seen so it won't show again for this customer
    const notificationKey = getNotificationKey(notification);
    if (notificationKey) {
      localStorage.setItem(notificationKey, "true");
    }
    setShow(false);
  };

  if (loading || !show || !notification) {
    return null;
  }

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      backdrop="static"
      keyboard={false}
      className="customer-notification-popup"
    >
      <Modal.Header className="notification-header">
        <Modal.Title>
          <span className="notification-icon">📢</span>
          Important Notification
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="notification-body">
        <div className="notification-content">
          {notification.message.split('\n').map((line, index) => (
            <p key={index} className="notification-text">
              {line}
            </p>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer className="notification-footer">
        <Button variant="primary" onClick={handleClose} className="notification-button">
          Got it, thanks!
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CustomerNotificationPopup;
