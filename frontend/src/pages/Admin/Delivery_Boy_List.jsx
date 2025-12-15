import React, { useState, useEffect } from "react";
import WindowHeader from "../../window_partial/window_header";
import { Container, Button, Modal, Row, Col } from "react-bootstrap";
import DataTable from "react-data-table-component";
import "../../window_partial/window.css";
import useResponsiveHideableColumns from "../../hooks/useResponsiveHideableColumns";
import { NavLink } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

function Delivery_Boy_List() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [records, setRecords] = useState([]);
  const handleCancel = () => {
    setShowRemoveModal(false);
  };
  const fetchRecords = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get(`/api/admin/delivery-boy`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Transforming each record in the array
      const transformedRecords = response.data.deliveryBoys.map((record) => ({
        id: record.id,
        name: record.name,
        email:record.email,
        dairy_name: record.dairy_name,
        status: record.status == 1 ? "Active" : "In-Active",
      }));
      setRecords(transformedRecords);
    } catch (err) {
      console.error("Error fetching delivery boy records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

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

  const handleLoginClick = (id) => {
    const selected = records.find((record) => record.id === id);
    setSelectedRecord(selected);
    setShowLoginModal(true);
  };

  const handleRemoveClick = (id) => {
    const selected = records.find((record) => record.id === id);
    setSelectedRecord(selected);
    setShowRemoveModal(true);
  };

  const getUsernameFromCookie = () => {
    const cookieValue = Cookies.get("Mauli-Dairy");
    if (cookieValue) {
      const userData = JSON.parse(cookieValue);
      return userData.name;
    }
    return "";
  };

  const name = getUsernameFromCookie();
  const handleLogin = () => {
    if (selectedRecord && name === selectedRecord.dairy_name) {
      window.location.href = "/delivery-boy-login";
    } else {
      toast.error("You are not authorized to login for this dairy.");
    }
  };

  const handleLogout = () => {
    window.location.href = "/";
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `/api/admin/delete-delivery-boy/${selectedRecord.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setShowRemoveModal(false);

      // Update state by filtering out the deleted record
      setRecords((prevRecords) =>
        prevRecords.filter((record) => record.id !== selectedRecord.id)
      );
    } catch (err) {
      console.error("Error deleting delivery boy:", err);
    }
  };

  const allColumns = [
    {
      id: "id",
      headerLabel: "ID",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      id: "name",
      headerLabel: "Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      id: "email",
      headerLabel: "Email",
      selector: (row) => row.email,
      sortable: true,
    },
    {
      id: "status",
      headerLabel: "Status",
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <span
          style={{
            color: row.status === "Active" ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {row.status}
        </span>
      ),
    },
    {
      id: "action",
      headerLabel: "Action",
      cell: (row) =>
        row.loggedIn ? (
          <Button variant="danger" onClick={() => handleLogout(row.id)}>
            Logout
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={() => handleLoginClick(row.id)}
            className="login_btn"
            style={{ marginLeft: "-0.5rem" }}
          >
            Login
          </Button>
        ),
    },
    {
      id: "remove",
      headerLabel: "Remove",
      cell: (row) => (
        <Button
          variant="danger"
          onClick={() => handleRemoveClick(row.id)}
          className="login_btn w-full sm:w-48 md:w-48 lg:w-40 text-sm rounded-md px-2 py-2 text-center"
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
  ];

  const [columnPage, setColumnPage] = useState(0);
  const [columnsPerPage, setColumnsPerPage] = useState(() => {
    const w = window.innerWidth || 0;
    if (w <= 600) return 3;
    if (w <= 1024) return 4;
    return 100;
  });

  const effectiveColumnsPerPage = Math.min(
    columnsPerPage,
    allColumns.length || columnsPerPage
  );
  const maxColumnPage = Math.max(
    0,
    Math.ceil(allColumns.length / effectiveColumnsPerPage) - 1
  );
  const safeColumnPage = Math.min(columnPage, maxColumnPage);
  const columnStart = safeColumnPage * effectiveColumnsPerPage;
  const columnEnd = columnStart + effectiveColumnsPerPage;
  const pagedColumnsRaw = allColumns.slice(columnStart, columnEnd);

  const columns = useResponsiveHideableColumns(pagedColumnsRaw, {
    resetKey: safeColumnPage,
  });

  const [dateTime, setDateTime] = useState(new Date());
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth || 0;
      setIsSmallScreen(width <= 600);

      if (width <= 600) {
        // Use 2 columns on very small screens to avoid content being cut
        setColumnsPerPage(2);
      } else if (width <= 1024) {
        setColumnsPerPage(4);
      } else {
        setColumnsPerPage(100);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <div>
      <WindowHeader dashboardText="Delivery Boy List" />
      <div
        style={{
          marginTop: isSmallScreen ? "70px" : "0px",
        }}
      >
        <Container fluid className="main-content mt-5">
          <div className="row">
            <div className="col-md-6 col-sm-12 pt-4">
              <p>Today's Status: {dateTime.toLocaleString()} </p>
            </div>
            <div className="col-md-6 col-sm-12 pt-4"></div>
          </div>
          <DataTable
            columns={columns}
            data={records}
            customStyles={customStyles}
            selectableRows
            fixedHeader
            pagination
            responsive
          />

          {/* Horizontal column navigation (based on screen size) */}
          {maxColumnPage > 0 && (
            <div className="d-flex justify-content-end align-items-center mt-2 gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={safeColumnPage === 0}
                onClick={() =>
                  setColumnPage((prev) => (prev > 0 ? prev - 1 : prev))
                }
              >
                ◀ Columns
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={safeColumnPage >= maxColumnPage}
                onClick={() =>
                  setColumnPage((prev) =>
                    prev < maxColumnPage ? prev + 1 : prev
                  )
                }
              >
                Columns ▶
              </button>
              <span style={{ fontSize: "12px" }}>
                Group {safeColumnPage + 1} of {maxColumnPage + 1}
              </span>
            </div>
          )}
        </Container>

        <Modal
          show={showLoginModal}
          onHide={() => setShowLoginModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Login</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="mt-3">
              <Col className="col-12">
                <p>Login for {selectedRecord && selectedRecord.name}</p>
                <Button variant="primary" onClick={handleLogin}>
                  Confirm Login
                </Button>
              </Col>
            </Row>
          </Modal.Body>
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
                <p>
                  Remove Delivery Boy: {selectedRecord && selectedRecord.name}
                </p>
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

export default Delivery_Boy_List;
