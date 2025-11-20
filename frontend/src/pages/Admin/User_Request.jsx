import { useState, useEffect } from "react";
import WindowHeader from "../../window_partial/window_header";
import { Container, Button, Modal, Image, Row, Col } from "react-bootstrap";
import DataTable from "react-data-table-component";
import logo from "/mauli_logo.png";
import "../../window_partial/window.css";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Cookies from "js-cookie";

function User_Request() {
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [requestType, setRequestType] = useState("farmer");
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  const [dairyName, setDairyName] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  const location = useLocation();
  const { formType, data } = location.state || { formType: "", data: {} };

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`/api/admin/pending-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedRecords = response.data.users.map((record) => ({
        ...record,
        status: "pending",
      }));
      if (updatedRecords.length > 0) {
        setDairyName(
          updatedRecords.find((record) => record.dairy_name)?.dairy_name || ""
        );
      }
      setRecords(updatedRecords);
    } catch (error) {
      console.error("Error fetching user requests:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = () => {
    setShowRemoveModal(false);
  };
  const handleRemoveClick = (record) => {
    setSelectedRecord(record);
    setShowRemoveModal(true);
  };

  const handleDelete = async () => {
    if (!selectedRecord || !selectedRecord.id) {
      console.error("No record selected for deletion.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`/api/admin/users/${selectedRecord.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRecords((prevRecords) =>
        prevRecords.filter((record) => record.id !== selectedRecord.id)
      );

      setTimeout(() => {
        setShowRemoveModal(false);
      }, 300); // Small delay before closing the modal
    } catch (err) {
      console.error("Error deleting delivery boy:", err);
    }
  };

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: "#FFAC30",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "15px",
        textAlign: "center",
      },
    },
  };

  // Handle request type change
  const handleRequestTypeChange = (type) => {
    setRequestType(type);
    fetchData(type);
  };

  const handleFilter = (event) => {
    const value = event.target.value.toLowerCase();
    const filteredData = records.filter((row) => {
      return (
        row.name.toLowerCase().includes(value) ||
        row.address.toLowerCase().includes(value) ||
        row.status.toLowerCase().includes(value)
      );
    });
    setSearchTerm(value);
    setFilteredRecords(filteredData);
  };
const [filteredRecords, setFilteredRecords] = useState([]);

  useEffect(() => {
    setFilteredRecords(records);
  }, [records]);

  // Handle status click
  const handleStatusClick = (record) => {
    setSelectedRecord(record);
    setShowConfirmation(true);
  };

  const confirmStatusChange = async (status) => {
    console.log("Status being sent:", status); // Debug line

    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `/api/admin/users/${selectedRecord.id}/request`,
        { request: status }, // Change made here
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("User Request Accepted..");
      const updatedRecords = records.filter(
        (record) => record.id !== selectedRecord.id
      );
      setRecords(updatedRecords);
      setShowConfirmation(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Close modals
  const closeModal = () => {
    setShowConfirmation(false);
    setSelectedRecord(null);
    setShowDetailsModal(false);
  };

  // Handle view click
  const handleViewClick = (row) => {
    setSelectedRecord(row);
    setShowDetailsModal(true);
  };

  const columns = [
    {
      name: "Sr No.",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Status",
      cell: (row) => (
        <Button
          variant={row.status === "pending" ? "danger" : "success"}
          onClick={() => handleStatusClick(row)}
          className="w-full sm:w-48 md:w-48 lg:w-40 text-sm rounded-md text-center"
          style={{ wordBreak: "keep-all", whiteSpace: "nowrap" }}
        >
          {row.status}
        </Button>
      ),
      sortable: true,
    },
    {
      name: "Remove",
      cell: (row) => (
        <Button
          variant="danger"
          onClick={() => handleRemoveClick(row)} // Pass row data
          className="login_btn w-full sm:w-48 md:w-48 lg:w-40 text-sm rounded-md text-center"
          style={{
            marginLeft: "-0.5rem",
            wordBreak: "keep-all",
            whiteSpace: "nowrap",
          }}
        >
          Remove
        </Button>
      ),
    },
    {
      name: "Action",
      cell: (row) => (
        <Button variant="primary" onClick={() => handleViewClick(row)}>
          View
        </Button>
      ),
      sortable: false,
    },
  ];
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <WindowHeader dashboardText="User Request" />
      <div
        style={{
          marginTop: isSmallScreen ? "50px" : "0px",
        }}
      >
        <Container fluid className="main-content mt-2">
          <div className="d-flex justify-content-between flex-wrap align-items-center mt-4 pt-4 mb-4">
            <div>
              <p className="mb-0">
                Today's Status: {dateTime.toLocaleString()}
              </p>
            </div>
            <div>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={handleFilter}
                className="form-control"
                style={{ width: "200px" }}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredRecords}
            customStyles={customStyles}
            selectableRows
            fixedHeader
            pagination
          />
        </Container>

        <Modal show={showDetailsModal} onHide={closeModal}>
          <Modal.Header closeButton style={{ backgroundColor: "#FFAC30" }}>
            <Modal.Title>Dairy Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedRecord && (
              <div>
                <p>
                  <strong>Dairy's Name:</strong> {dairyName}
                </p>
                <p>
                  <strong>Address:</strong> {selectedRecord.address}
                </p>
                <p>
                  <strong>Status:</strong> {selectedRecord.status}
                </p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showConfirmation} onHide={closeModal}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Status Change</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to change the status to{" "}
            <strong>Accepted</strong>?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => confirmStatusChange(true)}>
              Confirm
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={showRemoveModal}
          onHide={() => setShowRemoveModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Remove</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="mt-3">
              <Col className="col-12">
                <p>Remove Customer: {selectedRecord && selectedRecord.name}</p>
                <div className="d-flex gap-2">
                  <Button variant="danger" onClick={handleDelete}>
                    Remove
                  </Button>
                  <Button variant="primary" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </Col>
            </Row>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
}

export default User_Request;
