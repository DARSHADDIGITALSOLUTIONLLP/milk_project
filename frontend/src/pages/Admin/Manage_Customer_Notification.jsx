import React, { useState, useEffect } from "react";
import WindowHeader from "../../window_partial/window_header";
import { Container, Row, Col, Form, Button, Alert, Card } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "../../components/AdminNotificationModal.css";

function Manage_Customer_Notification() {
  const [notification, setNotification] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fetch current notification on page load
  useEffect(() => {
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

    fetchCurrentNotification();
  }, []);

  const handleSave = async () => {
    const trimmed = notification.trim();

    if (isActive) {
      if (!trimmed) {
        toast.error("Please enter a notification message before activating.");
        return;
      }
      if (trimmed.length < 15 || trimmed.length > 20) {
        toast.error("Message must be between 15 and 20 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "/api/admin/update-customer-notification",
        {
          customer_notification: trimmed,
          customer_notification_active: isActive,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Customer notification updated successfully!");
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
    <div>
      <WindowHeader dashboardText="Manage Customer Notification" />
      <div
        style={{
          marginTop: "0px",
        }}
      >
        <Container fluid className="main-content mt-0 admin-notification-modal">
          <ToastContainer
            stacked
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />

          <Row className="mt-4 justify-content-center">
            <Col xs={12} md={10} lg={8}>
              <Card>
                <Card.Body>
                  <h4 className="mb-3">📢 Customer Notification Management</h4>

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
                          <li>
                            This notification will appear as a popup when customers log in
                          </li>
                          <li>
                            Use this for important announcements like rate changes,
                            holidays, etc.
                          </li>
                          <li>Toggle \"Active\" to show/hide the notification</li>
                        </ul>
                      </Alert>

                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <strong>Notification Message</strong>
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={1}
                            placeholder="Enter short message (15-20 characters)"
                            value={notification}
                            onChange={(e) => setNotification(e.target.value)}
                            maxLength={20}
                          />
                          <Form.Text className="text-muted">
                            {notification.length}/20 characters (recommended 15–20)
                          </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Check
                            type="switch"
                            id="notification-active"
                            label={
                              <strong>
                                {isActive
                                  ? "✅ Show to customers on login"
                                  : "❌ Hidden from customers"}
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

                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <Button
                            variant="secondary"
                            onClick={handleClear}
                            disabled={loading}
                          >
                            Clear
                          </Button>
                          <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={loading}
                          >
                            {loading ? "Saving..." : "Save Notification"}
                          </Button>
                        </div>
                      </Form>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default Manage_Customer_Notification;

