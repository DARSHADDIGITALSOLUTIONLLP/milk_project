import React, { useState, useEffect } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import axios from "axios";
import "./AdminVacationNotificationPopup.css";

function AdminVacationNotificationPopup() {
  const [show, setShow] = useState(false);
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingVacations();
  }, []);

  const fetchPendingVacations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get("/api/admin/pending-vacation-notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success && response.data.vacations.length > 0) {
        setVacations(response.data.vacations);
        setShow(true);
      }
    } catch (error) {
      console.error("Error fetching vacation notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    try {
      const token = localStorage.getItem("token");
      const vacationIds = vacations.map(v => v.id);

      await axios.post(
        "/api/admin/acknowledge-vacation-notifications",
        { vacation_ids: vacationIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShow(false);
    } catch (error) {
      console.error("Error acknowledging vacations:", error);
      alert("Failed to acknowledge notifications. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading || !show || vacations.length === 0) {
    return null;
  }

  return (
    <Modal
      show={show}
      onHide={handleAcknowledge}
      centered
      backdrop="static"
      keyboard={false}
      className="admin-vacation-notification-popup"
      size="lg"
    >
      <Modal.Header className="vacation-notification-header">
        <Modal.Title>
          🏖️ Customer Vacation Notifications ({vacations.length})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="vacation-notification-content">
          <p className="mb-3">
            <strong>The following customers have applied for vacation:</strong>
          </p>
          
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer Name</th>
                <th>Contact</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Shift</th>
              </tr>
            </thead>
            <tbody>
              {vacations.map((vacation, index) => (
                <tr key={vacation.id}>
                  <td>{index + 1}</td>
                  <td>
                    {vacation.User?.name || "N/A"}
                    <br />
                    <small className="text-muted">{vacation.User?.email || ""}</small>
                  </td>
                  <td>{vacation.User?.contact || "N/A"}</td>
                  <td>{formatDate(vacation.vacation_start)}</td>
                  <td>
                    {vacation.vacation_end
                      ? formatDate(vacation.vacation_end)
                      : "Same day"}
                  </td>
                  <td>
                    <span className={`badge bg-${vacation.shift === "both" ? "primary" : vacation.shift === "morning" ? "warning" : "info"}`}>
                      {vacation.shift.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="alert alert-info mt-3 mb-0">
            <strong>ℹ️ Note:</strong> These customers will not receive milk deliveries during their vacation period.
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={handleAcknowledge}
          className="vacation-acknowledge-btn"
        >
          Got it, OK!
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AdminVacationNotificationPopup;
