import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Modal, Form, Badge, Alert } from "react-bootstrap";
import DataTable from "react-data-table-component";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../../components/Header";

const Manage_Subscription_Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPlan, setCurrentPlan] = useState({
    id: null,
    plan_name: "",
    plan_price: "",
    plan_validity_days: "",
    plan_features: [""],
    badge: "",
    show_gst: true,
    gst_percentage: 18,
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to access this page");
        setLoading(false);
        return;
      }
      
      const response = await axios.get("/api/subscription-plans", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPlans(response.data.plans || []);
      } else {
        toast.error(response.data.message || "Failed to fetch subscription plans");
        setPlans([]);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch subscription plans";
      toast.error(errorMessage);
      setPlans([]);
      
      // If unauthorized, show specific message
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("You don't have permission to access this page. Super Admin access required.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (plan = null) => {
    if (plan) {
      setIsEditMode(true);
      setCurrentPlan({
        id: plan.id,
        plan_name: plan.plan_name,
        plan_price: plan.plan_price,
        plan_validity_days: plan.plan_validity_days,
        plan_features: plan.plan_features && plan.plan_features.length > 0 ? plan.plan_features : [""],
        badge: plan.badge || "",
        show_gst: plan.show_gst,
        gst_percentage: plan.gst_percentage,
        is_active: plan.is_active,
        display_order: plan.display_order
      });
    } else {
      setIsEditMode(false);
      setCurrentPlan({
        id: null,
        plan_name: "",
        plan_price: "",
        plan_validity_days: "",
        plan_features: [""],
        badge: "",
        show_gst: true,
        gst_percentage: 18,
        is_active: true,
        display_order: 0
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentPlan({
      id: null,
      plan_name: "",
      plan_price: "",
      plan_validity_days: "",
      plan_features: [""],
      badge: "",
      show_gst: true,
      gst_percentage: 18,
      is_active: true,
      display_order: 0
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentPlan({
      ...currentPlan,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...currentPlan.plan_features];
    updatedFeatures[index] = value;
    setCurrentPlan({
      ...currentPlan,
      plan_features: updatedFeatures
    });
  };

  const addFeature = () => {
    setCurrentPlan({
      ...currentPlan,
      plan_features: [...currentPlan.plan_features, ""]
    });
  };

  const removeFeature = (index) => {
    const updatedFeatures = currentPlan.plan_features.filter((_, i) => i !== index);
    setCurrentPlan({
      ...currentPlan,
      plan_features: updatedFeatures.length > 0 ? updatedFeatures : [""]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!currentPlan.plan_name || !currentPlan.plan_price || !currentPlan.plan_validity_days) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Filter out empty features
    const filteredFeatures = currentPlan.plan_features.filter(feature => feature.trim() !== "");

    try {
      const token = localStorage.getItem("token");
      const planData = {
        ...currentPlan,
        plan_features: filteredFeatures,
        plan_price: parseFloat(currentPlan.plan_price),
        plan_validity_days: parseInt(currentPlan.plan_validity_days),
        gst_percentage: parseFloat(currentPlan.gst_percentage),
        display_order: parseInt(currentPlan.display_order) || 0
      };

      let response;
      if (isEditMode) {
        response = await axios.put(
          `/api/subscription-plans/${currentPlan.id}`,
          planData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          "/api/subscription-plans",
          planData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        toast.success(response.data.message);
        fetchPlans();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error(error.response?.data?.message || "Failed to save plan");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `/api/subscription-plans/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchPlans();
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  const calculateGST = (price) => {
    return (parseFloat(price) * parseFloat(currentPlan.gst_percentage || 0)) / 100;
  };

  const calculateTotal = (price) => {
    return parseFloat(price) + calculateGST(price);
  };

  const columns = [
    {
      name: "Plan Name",
      selector: (row) => row.plan_name,
      sortable: true,
      width: "150px"
    },
    {
      name: "Price",
      selector: (row) => `₹${row.plan_price}`,
      sortable: true,
      width: "100px"
    },
    {
      name: "Validity",
      selector: (row) => `${row.plan_validity_days} days`,
      sortable: true,
      width: "120px"
    },
    {
      name: "Features",
      cell: (row) => (
        <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
          {row.plan_features && row.plan_features.length > 0
            ? row.plan_features.slice(0, 2).join(", ") + 
              (row.plan_features.length > 2 ? "..." : "")
            : "No features"}
        </div>
      ),
      width: "200px"
    },
    {
      name: "Badge",
      cell: (row) => (
        row.badge ? (
          <Badge bg="warning" text="dark">{row.badge}</Badge>
        ) : (
          <span style={{ color: "#999" }}>None</span>
        )
      ),
      width: "120px"
    },
    {
      name: "GST",
      cell: (row) => (
        row.show_gst ? (
          <span style={{ color: "green" }}>{row.gst_percentage}%</span>
        ) : (
          <span style={{ color: "#999" }}>Hidden</span>
        )
      ),
      width: "80px"
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge bg={row.is_active ? "success" : "secondary"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
      width: "100px"
    },
    {
      name: "Order",
      selector: (row) => row.display_order,
      sortable: true,
      width: "80px"
    },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleShowModal(row)}
            className="me-2"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
      width: "180px"
    }
  ];

  return (
    <div>
      <Header dashboardText="Manage Subscription Plans" />
      <div style={{ marginTop: "80px" }}>
        <Container fluid style={{ paddingTop: "20px", paddingLeft: "20px", paddingRight: "20px" }}>
          <Row className="mb-3">
            <Col>
              <h2>Manage Subscription Plans</h2>
            </Col>
            <Col className="text-end">
              <Button variant="success" onClick={() => handleShowModal()}>
                + Add New Plan
              </Button>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card>
                <Card.Body>
                  <DataTable
                    columns={columns}
                    data={plans}
                    progressPending={loading}
                    pagination
                    highlightOnHover
                    striped
                    noDataComponent={
                      <div style={{ padding: "40px", textAlign: "center" }}>
                        {loading ? (
                          <p>Loading subscription plans...</p>
                        ) : (
                          <div>
                            <p style={{ fontSize: "16px", marginBottom: "10px" }}>No subscription plans found.</p>
                            <Button variant="success" onClick={() => handleShowModal()}>
                              + Add New Plan
                            </Button>
                          </div>
                        )}
                      </div>
                    }
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Add/Edit Plan Modal */}
          <Modal show={showModal} onHide={handleCloseModal} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>{isEditMode ? "Edit Plan" : "Add New Plan"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Plan Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="plan_name"
                        value={currentPlan.plan_name}
                        onChange={handleInputChange}
                        placeholder="e.g., Basic, Premium"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Badge (Optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="badge"
                        value={currentPlan.badge}
                        onChange={handleInputChange}
                        placeholder="e.g., Popular, Best Value"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price (₹) <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="plan_price"
                        value={currentPlan.plan_price}
                        onChange={handleInputChange}
                        placeholder="299"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Validity (Days) <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="plan_validity_days"
                        value={currentPlan.plan_validity_days}
                        onChange={handleInputChange}
                        placeholder="30"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Display Order</Form.Label>
                      <Form.Control
                        type="number"
                        name="display_order"
                        value={currentPlan.display_order}
                        onChange={handleInputChange}
                        placeholder="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="show_gst"
                        label="Show GST"
                        checked={currentPlan.show_gst}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  {currentPlan.show_gst && (
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>GST Percentage (%)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          name="gst_percentage"
                          value={currentPlan.gst_percentage}
                          onChange={handleInputChange}
                          placeholder="18"
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="is_active"
                        label="Active (visible to users)"
                        checked={currentPlan.is_active}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {currentPlan.plan_price && (
                  <Alert variant="info">
                    <strong>Price Breakdown:</strong>
                    <div>Subtotal: ₹{parseFloat(currentPlan.plan_price).toFixed(2)}</div>
                    {currentPlan.show_gst && (
                      <>
                        <div>GST ({currentPlan.gst_percentage}%): ₹{calculateGST(currentPlan.plan_price).toFixed(2)}</div>
                        <div><strong>Total: ₹{calculateTotal(currentPlan.plan_price).toFixed(2)}</strong></div>
                      </>
                    )}
                  </Alert>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Plan Features</Form.Label>
                  {currentPlan.plan_features.map((feature, index) => (
                    <div key={index} className="mb-2 d-flex">
                      <Form.Control
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        placeholder={`Feature ${index + 1}`}
                        className="me-2"
                      />
                      {currentPlan.plan_features.length > 1 && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" onClick={addFeature}>
                    + Add Feature
                  </Button>
                </Form.Group>

                <div className="text-end">
                  <Button variant="secondary" onClick={handleCloseModal} className="me-2">
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    {isEditMode ? "Update Plan" : "Create Plan"}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </Container>
      </div>
      <ToastContainer position="top-right" />
    </div>
  );
};

export default Manage_Subscription_Plans;
