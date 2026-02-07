import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Modal, Form, Badge, Card } from "react-bootstrap";
import DataTable from "react-data-table-component";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import Header from "../../components/Header";
import { Trash, PencilSquare, Files, PlusCircle, CalendarEvent } from "react-bootstrap-icons";

const Manage_Festivals = () => {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    year: new Date().getFullYear(),
    greeting: "",
    is_active: true,
    is_recurring: false,
    festival_type: "cultural",
    icon: "",
  });

  // Copy form state
  const [copyData, setCopyData] = useState({
    fromYear: new Date().getFullYear(),
    toYear: new Date().getFullYear() + 1,
  });

  const API_URL = "http://localhost:5001/api";

  // Get token from cookies
  const getToken = () => {
    const cookieValue = Cookies.get("Mauli-Dairy");
    if (cookieValue) {
      const userData = JSON.parse(cookieValue);
      return userData.token;
    }
    return null;
  };

  // Fetch all festivals
  const fetchFestivals = async (year = null) => {
    try {
      setLoading(true);
      const token = getToken();
      const url = year ? `${API_URL}/festivals?year=${year}` : `${API_URL}/festivals`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFestivals(response.data.festivals || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching festivals:", error);
      toast.error(error.response?.data?.message || "Failed to fetch festivals");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFestivals(filterYear);
  }, [filterYear]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle copy form input change
  const handleCopyInputChange = (e) => {
    const { name, value } = e.target;
    setCopyData({
      ...copyData,
      [name]: parseInt(value),
    });
  };

  // Open modal for creating new festival
  const handleAddFestival = () => {
    setEditMode(false);
    setSelectedFestival(null);
    setFormData({
      name: "",
      date: "",
      year: filterYear,
      greeting: "",
      is_active: true,
      is_recurring: false,
      festival_type: "cultural",
      icon: "",
    });
    setShowModal(true);
  };

  // Open modal for editing festival
  const handleEditFestival = (festival) => {
    setEditMode(true);
    setSelectedFestival(festival);
    setFormData({
      name: festival.name,
      date: festival.date,
      year: festival.year,
      greeting: festival.greeting,
      is_active: festival.is_active,
      is_recurring: festival.is_recurring,
      festival_type: festival.festival_type,
      icon: festival.icon || "",
    });
    setShowModal(true);
  };

  // Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.date || !formData.year || !formData.greeting) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = getToken();

      if (editMode && selectedFestival) {
        // Update festival
        await axios.put(
          `${API_URL}/festivals/${selectedFestival.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Festival updated successfully!");
      } else {
        // Create festival
        await axios.post(`${API_URL}/festivals`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Festival created successfully!");
      }

      setShowModal(false);
      fetchFestivals(filterYear);
    } catch (error) {
      console.error("Error saving festival:", error);
      toast.error(error.response?.data?.message || "Failed to save festival");
    }
  };

  // Delete festival
  const handleDeleteFestival = async (festivalId, festivalName) => {
    if (!window.confirm(`Are you sure you want to delete "${festivalName}"?`)) {
      return;
    }

    try {
      const token = getToken();
      await axios.delete(`${API_URL}/festivals/${festivalId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Festival deleted successfully!");
      fetchFestivals(filterYear);
    } catch (error) {
      console.error("Error deleting festival:", error);
      toast.error(error.response?.data?.message || "Failed to delete festival");
    }
  };

  // Copy recurring festivals to next year
  const handleCopyToNextYear = async (e) => {
    e.preventDefault();

    if (copyData.fromYear >= copyData.toYear) {
      toast.error("'To Year' must be greater than 'From Year'");
      return;
    }

    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/festivals/copy-to-next-year`,
        copyData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(response.data.message);
      setShowCopyModal(false);
      
      // If we copied to the currently filtered year, refresh
      if (copyData.toYear === filterYear) {
        fetchFestivals(filterYear);
      }
    } catch (error) {
      console.error("Error copying festivals:", error);
      toast.error(error.response?.data?.message || "Failed to copy festivals");
    }
  };

  // DataTable columns
  const columns = [
    {
      name: "Icon",
      selector: (row) => row.icon || "🎉",
      sortable: false,
      width: "80px",
      center: true,
      cell: (row) => (
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "28px" }}>{row.icon || "🎉"}</span>
        </div>
      ),
    },
    {
      name: "Festival Name",
      selector: (row) => row.name,
      sortable: true,
      wrap: true,
      minWidth: "150px",
      cell: (row) => (
        <div style={{ fontWeight: "600", fontSize: "14px" }}>{row.name}</div>
      ),
    },
    {
      name: "Date",
      selector: (row) => row.date,
      sortable: true,
      width: "130px",
      cell: (row) => {
        const date = new Date(row.date);
        return (
          <div style={{ fontSize: "13px" }}>
            {date.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        );
      },
    },
    {
      name: "Type",
      selector: (row) => row.festival_type,
      sortable: true,
      width: "120px",
      cell: (row) => {
        const typeColors = {
          national: "primary",
          religious: "warning",
          cultural: "info",
          other: "secondary",
        };
        return (
          <Badge bg={typeColors[row.festival_type] || "secondary"} style={{ fontSize: "11px", padding: "6px 10px" }}>
            {row.festival_type.charAt(0).toUpperCase() + row.festival_type.slice(1)}
          </Badge>
        );
      },
    },
    {
      name: "Date Type",
      selector: (row) => row.is_recurring,
      sortable: true,
      width: "130px",
      cell: (row) => (
        <Badge bg={row.is_recurring ? "success" : "danger"} style={{ fontSize: "11px", padding: "6px 10px" }}>
          {row.is_recurring ? "Fixed Date" : "Lunar"}
        </Badge>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.is_active,
      sortable: true,
      width: "100px",
      cell: (row) => (
        <Badge bg={row.is_active ? "success" : "secondary"} style={{ fontSize: "11px", padding: "6px 10px" }}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      name: "Greeting Preview",
      selector: (row) => row.greeting,
      wrap: true,
      minWidth: "250px",
      cell: (row) => (
        <div 
          style={{ 
            fontSize: "12px", 
            lineHeight: "1.5",
            color: "#555",
            maxWidth: "300px"
          }}
          title={row.greeting}
        >
          {row.greeting.length > 100 
            ? `${row.greeting.substring(0, 100)}...` 
            : row.greeting}
        </div>
      ),
    },
    {
      name: "Actions",
      width: "140px",
      center: true,
      cell: (row) => (
        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleEditFestival(row)}
            title="Edit Festival"
            style={{ minWidth: "40px" }}
          >
            <PencilSquare size={14} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteFestival(row.id, row.name)}
            title="Delete Festival"
            style={{ minWidth: "40px" }}
          >
            <Trash size={14} />
          </Button>
        </div>
      ),
    },
  ];

  // Custom styles for DataTable
  const customStyles = {
    headCells: {
      style: {
        fontSize: "13px",
        fontWeight: "700",
        backgroundColor: "#f8f9fa",
        borderBottom: "2px solid #dee2e6",
        paddingTop: "12px",
        paddingBottom: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        color: "#495057",
      },
    },
    cells: {
      style: {
        fontSize: "13px",
        paddingTop: "12px",
        paddingBottom: "12px",
      },
    },
    rows: {
      style: {
        minHeight: "60px",
        "&:hover": {
          backgroundColor: "#f8f9fa",
          cursor: "pointer",
        },
      },
    },
    table: {
      style: {
        borderRadius: "8px",
        overflow: "hidden",
      },
    },
  };

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 2; i <= currentYear + 5; i++) {
    yearOptions.push(i);
  }

  return (
    <div>
      <Header dashboardText="Manage Festivals" />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        pauseOnHover
      />

      <div className="main-content" style={{ paddingTop: "100px", minHeight: "100vh", marginTop: "0" }}>
        <Container fluid style={{ padding: "20px" }}>
          {/* Header Section */}
          <Row className="mb-4" style={{ marginTop: "0" }}>
            <Col>
              <h2 style={{ marginTop: "0", paddingTop: "0", marginBottom: "10px" }}>
                <CalendarEvent size={32} className="me-2" />
                Festival Management
              </h2>
              <p className="text-muted" style={{ marginBottom: "0" }}>
                Manage festivals, update dates, and handle yearly updates
              </p>
            </Col>
          </Row>

          {/* Summary Cards */}
          <Row className="mb-4">
            <Col md={3} className="mb-3 mb-md-0">
              <Card className="text-center" style={{ 
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "8px"
              }}>
                <Card.Body style={{ padding: "20px" }}>
                  <h6 style={{ color: "#6c757d", marginBottom: "10px", fontSize: "14px", fontWeight: "600" }}>
                    Total Festivals
                  </h6>
                  <h2 className="text-primary mb-0" style={{ fontSize: "32px", fontWeight: "700" }}>
                    {festivals.length}
                  </h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3 mb-md-0">
              <Card className="text-center" style={{ 
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "8px"
              }}>
                <Card.Body style={{ padding: "20px" }}>
                  <h6 style={{ color: "#6c757d", marginBottom: "10px", fontSize: "14px", fontWeight: "600" }}>
                    Active
                  </h6>
                  <h2 className="text-success mb-0" style={{ fontSize: "32px", fontWeight: "700" }}>
                    {festivals.filter((f) => f.is_active).length}
                  </h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3 mb-md-0">
              <Card className="text-center" style={{ 
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "8px"
              }}>
                <Card.Body style={{ padding: "20px" }}>
                  <h6 style={{ color: "#6c757d", marginBottom: "10px", fontSize: "14px", fontWeight: "600" }}>
                    Fixed Date
                  </h6>
                  <h2 className="text-info mb-0" style={{ fontSize: "32px", fontWeight: "700" }}>
                    {festivals.filter((f) => f.is_recurring).length}
                  </h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center" style={{ 
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "8px"
              }}>
                <Card.Body style={{ padding: "20px" }}>
                  <h6 style={{ color: "#6c757d", marginBottom: "10px", fontSize: "14px", fontWeight: "600" }}>
                    Lunar Calendar
                  </h6>
                  <h2 className="text-warning mb-0" style={{ fontSize: "32px", fontWeight: "700" }}>
                    {festivals.filter((f) => !f.is_recurring).length}
                  </h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Action Buttons */}
          <Row className="mb-4">
            <Col md={6} className="mb-3 mb-md-0">
              <Form.Group>
                <Form.Label style={{ fontWeight: "600", marginBottom: "8px" }}>
                  Filter by Year:
                </Form.Label>
                <Form.Select
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  style={{ 
                    width: "180px",
                    cursor: "pointer",
                    border: "1px solid #ced4da",
                    borderRadius: "6px"
                  }}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} className="text-md-end text-start">
              <Button
                variant="success"
                className="me-2 mb-2 mb-md-0"
                onClick={handleAddFestival}
                style={{ 
                  minWidth: "140px",
                  fontWeight: "600"
                }}
              >
                <PlusCircle size={18} className="me-1" />
                Add Festival
              </Button>
              <Button
                variant="info"
                onClick={() => setShowCopyModal(true)}
                style={{ 
                  minWidth: "160px",
                  fontWeight: "600"
                }}
              >
                <Files size={18} className="me-1" />
                Copy to Next Year
              </Button>
            </Col>
          </Row>

          {/* DataTable */}
          <Row>
            <Col>
              <Card style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)", border: "none" }}>
                <Card.Body style={{ padding: "20px" }}>
                  <DataTable
                    columns={columns}
                    data={festivals}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 20, 30, 50]}
                    highlightOnHover
                    striped
                    responsive
                    customStyles={customStyles}
                    progressPending={loading}
                    progressComponent={
                      <div className="p-4 text-center">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading festivals...</p>
                      </div>
                    }
                    noDataComponent={
                      <div className="p-5 text-center">
                        <CalendarEvent size={48} className="text-muted mb-3" />
                        <p className="text-muted mb-0">
                          No festivals found for {filterYear}. Click "Add Festival" to create one!
                        </p>
                      </div>
                    }
                    paginationComponentOptions={{
                      rowsPerPageText: "Rows per page:",
                      rangeSeparatorText: "of",
                      noRowsPerPage: false,
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Add/Edit Festival Modal */}
          <Modal
            show={showModal}
            onHide={() => setShowModal(false)}
            size="lg"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {editMode ? "Edit Festival" : "Add New Festival"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Festival Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Diwali"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Icon (Emoji)</Form.Label>
                      <Form.Control
                        type="text"
                        name="icon"
                        value={formData.icon}
                        onChange={handleInputChange}
                        placeholder="🪔"
                        maxLength={10}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Date <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Year <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        min={currentYear - 5}
                        max={currentYear + 10}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Festival Type</Form.Label>
                      <Form.Select
                        name="festival_type"
                        value={formData.festival_type}
                        onChange={handleInputChange}
                      >
                        <option value="national">National</option>
                        <option value="religious">Religious</option>
                        <option value="cultural">Cultural</option>
                        <option value="other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date Type</Form.Label>
                      <Form.Select
                        name="is_recurring"
                        value={formData.is_recurring}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_recurring: e.target.value === "true",
                          })
                        }
                      >
                        <option value="false">Lunar (Changes Yearly)</option>
                        <option value="true">Fixed (Same Every Year)</option>
                      </Form.Select>
                      <Form.Text className="text-muted">
                        {formData.is_recurring
                          ? "Fixed date festivals can be auto-copied to next year"
                          : "Lunar festivals need manual date updates each year"}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Greeting Message <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="greeting"
                    value={formData.greeting}
                    onChange={handleInputChange}
                    placeholder="e.g., 🪔 Happy Diwali! May the festival of lights..."
                    required
                  />
                  <Form.Text className="text-muted">
                    This message will be sent to customers as a notification
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="is_active"
                    label="Active (Send notifications for this festival)"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <div className="text-end">
                  <Button
                    variant="secondary"
                    className="me-2"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    {editMode ? "Update Festival" : "Create Festival"}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          {/* Copy to Next Year Modal */}
          <Modal
            show={showCopyModal}
            onHide={() => setShowCopyModal(false)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Copy Recurring Festivals</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted">
                This will copy all <strong>fixed-date festivals</strong> (e.g., Republic Day, Independence Day)
                from one year to another. Lunar calendar festivals (e.g., Diwali, Holi) 
                need to be added manually with correct dates.
              </p>
              <Form onSubmit={handleCopyToNextYear}>
                <Form.Group className="mb-3">
                  <Form.Label>From Year</Form.Label>
                  <Form.Control
                    type="number"
                    name="fromYear"
                    value={copyData.fromYear}
                    onChange={handleCopyInputChange}
                    min={currentYear - 5}
                    max={currentYear + 5}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>To Year</Form.Label>
                  <Form.Control
                    type="number"
                    name="toYear"
                    value={copyData.toYear}
                    onChange={handleCopyInputChange}
                    min={currentYear}
                    max={currentYear + 10}
                    required
                  />
                </Form.Group>

                <div className="text-end">
                  <Button
                    variant="secondary"
                    className="me-2"
                    onClick={() => setShowCopyModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="info" type="submit">
                    <Files size={18} className="me-1" />
                    Copy Festivals
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </Container>
      </div>
    </div>
  );
};

export default Manage_Festivals;
