import React, { useState, useEffect } from "react";
import WindowHeader from "../../window_partial/window_header";
import { Container, Row, Col, Card, Button, Modal } from "react-bootstrap";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import Cookies from "js-cookie";

function My_Plan() {
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [loadingSubscriptionDetails, setLoadingSubscriptionDetails] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  const VITE_ENCRYPTION_RAZORPAY_KEY = import.meta.env.VITE_ENCRYPTION_RAZORPAY_KEY;

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 600);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch detailed subscription information
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      const token = localStorage.getItem("token");
      try {
        setLoadingSubscriptionDetails(true);
        const response = await axios.get("/api/admin/subscription-details", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setSubscriptionDetails(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching subscription details:", error);
        toast.error("Failed to load subscription details");
      } finally {
        setLoadingSubscriptionDetails(false);
      }
    };
    fetchSubscriptionDetails();
  }, []);

  // Fetch subscription plans for renewal
  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        const response = await axios.get("/api/subscription-plans/active");
        if (response.data.success) {
          setSubscriptionPlans(response.data.plans);
        }
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
      }
    };
    fetchSubscriptionPlans();
  }, []);

  // Helper function to calculate GST with dynamic percentage
  const calculateGST = (amount, gstPercentage = 18) => {
    return Math.round(amount * (gstPercentage / 100));
  };

  // Helper function to calculate total (subtotal + GST)
  const calculateTotal = (subtotal, gstPercentage = 18) => {
    return subtotal + calculateGST(subtotal, gstPercentage);
  };

  // Helper function to format price breakdown (Subtotal + GST = Total)
  const formatPriceBreakdown = (subtotal, showGst = true, gstPercentage = 18) => {
    const gst = calculateGST(subtotal, gstPercentage);
    const total = showGst ? calculateTotal(subtotal, gstPercentage) : subtotal;
    return {
      subtotal,
      gst,
      total,
      display: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#666" }}>
            Subtotal: ₹{subtotal}
          </div>
          {showGst && (
            <div style={{ fontSize: "14px", color: "#666" }}>
              GST ({gstPercentage}%): ₹{gst}
            </div>
          )}
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#000", marginTop: "5px" }}>
            Total: ₹{total}
          </div>
        </div>
      )
    };
  };

  const getUsernameFromCookie = () => {
    const cookieValue = Cookies.get("Mauli-Dairy");
    if (cookieValue) {
      const userData = JSON.parse(cookieValue);
      return {
        username: userData.name,
        userEmail: userData.email,
        userContact: userData.mobile,
      };
    }
    return null;
  };

  const userDetails = getUsernameFromCookie();
  const username = userDetails?.username || "";
  const userEmail = userDetails?.userEmail || "";
  const userContact = userDetails?.userContact || "";

  async function checkout(totalAmount, periods) {
    try {
      // Check if Razorpay key is configured
      if (!VITE_ENCRYPTION_RAZORPAY_KEY) {
        toast.error("Razorpay key not configured. Please check your .env file.");
        console.error("VITE_ENCRYPTION_RAZORPAY_KEY is not set in frontend .env file");
        return;
      }

      // Calculate subtotal from total (reverse calculation)
      const subtotal = Math.round(totalAmount / 1.18);
      const gst = totalAmount - subtotal;

      console.log("💰 Payment breakdown:", {
        subtotal: subtotal,
        gst: gst,
        total: totalAmount,
        period: periods
      });

      const {
        data: { order },
      } = await axios.post("api/admin/usermakepaymentsubscription", {
        amount: totalAmount, // Send total amount (subtotal + GST) to backend
      });

      if (!order || !order.id) {
        toast.error("Failed to create payment order");
        return;
      }

      const options = {
        key: VITE_ENCRYPTION_RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "Milk Junction",
        description: "Subscription Payment",
        image: "/Milk Junction_fnl_png.png",
        order_id: order.id,
        callback_url: "/api/admin/paymentVerificationSubscription",
        prefill: {
          name: username,
          email: userEmail,
          contact: userContact,
        },
        notes: {
          dairy_name: username,
          contact: userContact,
          email: userEmail,
          periods: periods,
          amount: totalAmount, // Total amount (subtotal + GST)
          subtotal: subtotal, // Subtotal for reference
          gst: gst, // GST amount for reference
          frontend_url: window.location.origin, // Store frontend URL for proper redirect
        },
        theme: {
          color: "#000000",
        },
        handler: function (response) {
          console.log("Payment successful:", response);
          localStorage.setItem('subscription_payment_timestamp', Date.now().toString());
          setShowPaymentModal(false);
        },
        modal: {
          ondismiss: function() {
            console.log("Payment modal closed");
          }
        }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.error("Error in checkout:", error);
      const errorMessage = error.response?.data?.message || error.message || "Payment initialization failed";
      toast.error(errorMessage);
    }
  }

  return (
    <div>
      <WindowHeader dashboardText="My Plan" />
      <div
        style={{
          marginTop: isSmallScreen ? "40px" : "0px",
        }}
      >
        <Container 
          fluid 
          className="main-content" 
          style={{
            paddingTop: "100px",
            paddingLeft: "20px",
            paddingRight: "20px",
          }}
        >
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
            transition:Bounce
          />

          {/* Current Subscription Plan Information */}
          <Row className="mb-4" style={{ marginTop: "20px" }}>
            <Col xs={12}>
              {loadingSubscriptionDetails ? (
                <Card>
                  <Card.Body className="text-center">
                    <p>Loading subscription details...</p>
                  </Card.Body>
                </Card>
              ) : subscriptionDetails ? (
                <Card
                  style={{
                    border: "2px solid #fcd02a",
                    borderRadius: "10px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Card.Header
                    style={{
                      backgroundColor: "#fcd02a",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "18px",
                      borderBottom: "2px solid #fcd02a",
                    }}
                  >
                    Current Subscription Plan
                  </Card.Header>
                  <Card.Body>
                    {subscriptionDetails.plan ? (
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <h5 style={{ color: "#333", marginBottom: "15px" }}>
                              {subscriptionDetails.plan.plan_name}
                              {subscriptionDetails.plan.badge && (
                                <span
                                  style={{
                                    marginLeft: "10px",
                                    backgroundColor: "#FFA500",
                                    color: "white",
                                    padding: "3px 10px",
                                    borderRadius: "5px",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {subscriptionDetails.plan.badge}
                                </span>
                              )}
                            </h5>
                            <div style={{ marginBottom: "10px" }}>
                              <strong>Plan Price:</strong> ₹{subscriptionDetails.plan.plan_price}
                              {subscriptionDetails.plan.show_gst && (
                                <span style={{ color: "#666", fontSize: "14px", marginLeft: "5px" }}>
                                  (+ {subscriptionDetails.plan.gst_percentage}% GST)
                                </span>
                              )}
                            </div>
                            <div style={{ marginBottom: "10px" }}>
                              <strong>Validity:</strong> {subscriptionDetails.plan.plan_validity_days} days
                              {subscriptionDetails.plan.actual_validity_days && 
                               subscriptionDetails.plan.actual_validity_days !== subscriptionDetails.plan.plan_validity_days && (
                                <span style={{ color: "#666", fontSize: "12px", marginLeft: "5px" }}>
                                  (Actual: {subscriptionDetails.plan.actual_validity_days} days)
                                </span>
                              )}
                            </div>
                            {subscriptionDetails.warning && (
                              <div style={{ 
                                marginTop: "10px", 
                                padding: "10px", 
                                backgroundColor: "#fff3cd", 
                                border: "1px solid #ffc107", 
                                borderRadius: "5px",
                                fontSize: "13px"
                              }}>
                                <strong style={{ color: "#856404" }}>⚠️ {subscriptionDetails.warning}</strong>
                              </div>
                            )}
                            {subscriptionDetails.plan.plan_features &&
                              subscriptionDetails.plan.plan_features.length > 0 && (
                                <div style={{ marginTop: "15px" }}>
                                  <strong>Plan Features:</strong>
                                  <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                                    {subscriptionDetails.plan.plan_features.map((feature, idx) => (
                                      <li key={idx} style={{ marginBottom: "5px" }}>
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <h5 style={{ color: "#333", marginBottom: "15px" }}>Subscription Details</h5>
                            <div style={{ marginBottom: "10px" }}>
                              <strong>Status:</strong>{" "}
                              <span
                                style={{
                                  color: subscriptionDetails.subscription.status === "active" ? "green" : "red",
                                  fontWeight: "bold",
                                }}
                              >
                                {subscriptionDetails.subscription.status === "active"
                                  ? "Active"
                                  : "Expired"}
                              </span>
                            </div>
                            <div style={{ marginBottom: "10px" }}>
                              <strong>Start Date:</strong> {subscriptionDetails.subscription.start_date || "N/A"}
                            </div>
                            <div style={{ marginBottom: "10px" }}>
                              <strong>End Date:</strong> {subscriptionDetails.subscription.end_date || "N/A"}
                            </div>
                            <div style={{ marginBottom: "10px" }}>
                              <strong>Next Billing Date:</strong>{" "}
                              <span style={{ color: "#fcd02a", fontWeight: "bold", fontSize: "16px" }}>
                                {subscriptionDetails.subscription.next_billing_date || "N/A"}
                              </span>
                            </div>
                            <div style={{ marginBottom: "10px" }}>
                              <strong>Days Remaining:</strong>{" "}
                              <span
                                style={{
                                  color:
                                    subscriptionDetails.subscription.days_remaining > 7
                                      ? "green"
                                      : subscriptionDetails.subscription.days_remaining > 0
                                      ? "orange"
                                      : "red",
                                  fontWeight: "bold",
                                  fontSize: "16px",
                                }}
                              >
                                {subscriptionDetails.subscription.days_remaining} days
                              </span>
                            </div>
                            
                            
                            {subscriptionDetails.subscription.days_remaining <= 7 &&
                              subscriptionDetails.subscription.days_remaining > 0 && (
                                <div
                                  style={{
                                    marginTop: "15px",
                                    padding: "10px",
                                    backgroundColor: "#fff3cd",
                                    border: "1px solid #ffc107",
                                    borderRadius: "5px",
                                  }}
                                >
                                  <strong style={{ color: "#856404" }}>
                                    ⚠️ Your subscription will expire soon! Please renew to continue service.
                                  </strong>
                                </div>
                              )}
                            {subscriptionDetails.subscription.status === "expired" && (
                              <div
                                style={{
                                  marginTop: "15px",
                                  padding: "10px",
                                  backgroundColor: "#f8d7da",
                                  border: "1px solid #dc3545",
                                  borderRadius: "5px",
                                }}
                              >
                                <strong style={{ color: "#721c24" }}>
                                  ⚠️ Your subscription has expired! Please renew to continue service.
                                </strong>
                              </div>
                            )}
                            {(subscriptionDetails.subscription.status === "expired" ||
                              subscriptionDetails.subscription.days_remaining <= 7) && (
                              <div style={{ marginTop: "20px" }}>
                                <Button
                                  variant="primary"
                                  onClick={() => setShowPaymentModal(true)}
                                  style={{
                                    backgroundColor: "#fcd02a",
                                    border: "none",
                                    color: "#000",
                                    fontWeight: "bold",
                                  }}
                                >
                                  Renew Subscription
                                </Button>
                              </div>
                            )}
                          </div>
                        </Col>
                      </Row>
                    ) : (
                      <div className="text-center">
                        <p>No active subscription plan found for your current period.</p>
                        <Button
                          variant="primary"
                          onClick={() => setShowPaymentModal(true)}
                          style={{
                            backgroundColor: "#fcd02a",
                            border: "none",
                            color: "#000",
                            fontWeight: "bold",
                            marginTop: "15px",
                          }}
                        >
                          Subscribe Now
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ) : (
                <Card>
                  <Card.Body className="text-center">
                    <p>No subscription information available.</p>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>

          {/* Subscription Plans Modal for Renewal */}
          <Modal
            show={showPaymentModal}
            onHide={() => setShowPaymentModal(false)}
            size="xl"
          >
            <Modal.Header closeButton>
              <Modal.Title>Renew Subscription Plan</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Container>
                <Row>
                  {subscriptionPlans.length > 0 ? (
                    subscriptionPlans.map((plan) => {
                      const priceDetails = formatPriceBreakdown(
                        plan.plan_price,
                        plan.show_gst,
                        plan.gst_percentage
                      );
                      const planPeriod = plan.plan_validity_days === 30 ? "monthly" : 
                                         plan.plan_validity_days === 90 ? "quarterly" :
                                         plan.plan_validity_days === 180 ? "half-yearly" : "yearly";
                      
                      return (
                        <Col key={plan.id} xs={12} sm={6} md={6} lg={3} xl={3} className="mb-3">
                          <Card
                            style={{ 
                              boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
                              position: "relative",
                              height: "100%"
                            }}
                            className="subscription_card"
                          >
                            {plan.badge && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "10px",
                                  right: "10px",
                                  backgroundColor: "#FFA500",
                                  color: "white",
                                  padding: "5px 10px",
                                  borderRadius: "5px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  zIndex: 1
                                }}
                              >
                                {plan.badge}
                              </div>
                            )}
                            <Card.Body>
                              <center>
                                <Card.Title className="card_title">{plan.plan_name}</Card.Title>
                              </center>
                              <center>
                                <h5 className="price mb-2">{priceDetails.display}</h5>
                              </center>
                              <Card.Text>
                                <div style={{ textAlign: "center", marginBottom: "10px" }}>
                                  <p>({plan.plan_validity_days} days)</p>
                                </div>
                                {plan.plan_features && plan.plan_features.length > 0 && (
                                  <ul style={{ textAlign: "left", fontSize: "13px", paddingLeft: "20px" }}>
                                    {plan.plan_features.map((feature, idx) => (
                                      <li key={idx}>{feature}</li>
                                    ))}
                                  </ul>
                                )}
                              </Card.Text>
                              <center>
                                <Button
                                  className="mt-auto pay_btn"
                                  style={{
                                    width: "100%",
                                    backgroundColor: "black",
                                    color: "white",
                                    border: "none",
                                  }}
                                  onClick={() => checkout(priceDetails.total, planPeriod)}
                                >
                                  Pay Now
                                </Button>
                              </center>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })
                  ) : (
                    <Col xs={12} className="text-center">
                      <p>Loading subscription plans...</p>
                    </Col>
                  )}
                </Row>
              </Container>
            </Modal.Body>
          </Modal>
        </Container>
      </div>
    </div>
  );
}

export default My_Plan;
