import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import "./AdminNotificationModal.css";

/**
 * Admin Notification Management Modal
 * Allows admin to create/update customer notifications
 */
function AdminNotificationModal({ show, onHide, onUpdate }) {
  const [notification, setNotification] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fetch current notification when modal opens
  useEffect(() => {
    if (show) {
      fetchCurrentNotification();
    }
  }, [show]);

  const fetchCurrentNotification = async () => {
    setFetching(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/get-customer-notification", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.notification) {
        setNotification(response.data.notification.message || "");
        setIsActive(response.data.notification.active || false);
      }
    } catch (error) {
      console.error("Error fetching notification:", error);
      toast.error("Failed to load current notification");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!notification.trim() && isActive) {
      toast.error("Please enter a notification message before activating.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "/api/admin/update-customer-notification",
        {
          customer_notification: notification.trim(),
          customer_notification_active: isActive,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Customer notification updated successfully!");
      if (onUpdate) {
        onUpdate();
      }
      onHide();
    } catch (error) {
      console.error("Error updating notification:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to update notification. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setNotification("");
    setIsActive(false);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>📢 Customer Notification Management</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {fetching ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <Alert variant="info" className="mb-3">
              <strong>ℹ️ Information:</strong>
              <ul className="mb-0 mt-2">
                <li>This notification will appear as a popup when customers log in</li>
                <li>Use this for important announcements like rate changes, holidays, etc.</li>
                <li>Toggle "Active" to show/hide the notification</li>
              </ul>
            </Alert>

            <Form>
              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Notification Message</strong>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Enter short notification (max 20 characters)"
                  value={notification}
                  onChange={(e) => setNotification(e.target.value)}
                  maxLength={20}
                />
                <Form.Text className="text-muted">
                  {notification.length}/20 characters (max)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="notification-active"
                  label={
                    <strong>
                      {isActive ? "✅ Active (Visible to customers)" : "❌ Inactive (Hidden from customers)"}
                    </strong>
                  }
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <Form.Text className="text-muted">
                  {isActive
                    ? "Customers will see this notification when they log in"
                    : "Notification is hidden from customers"}
                </Form.Text>
              </Form.Group>
            </Form>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClear} disabled={loading}>
          Clear
        </Button>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Notification"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AdminNotificationModal;
