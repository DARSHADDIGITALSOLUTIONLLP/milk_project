import React, { useEffect, useState } from "react";
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Form,
  Button,
  Modal,
  Image,
  Row,
  Col,
} from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBars,
  faTimes,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import logo from "/mauli_logo.png";
import Cookies from "js-cookie";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../../components/Header";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";

const VITE_ENCRYPTION_RAZORPAY_KEY = import.meta.env.VITE_ENCRYPTION_RAZORPAY_KEY;

function Dairy_Register() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUserValidated, setIsUserValidated] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getUsernameFromCookie = () => {
    const cookieValue = Cookies.get("Mauli-Dairy");
    if (cookieValue) {
      const userData = JSON.parse(cookieValue);
      return userData.name; // Assuming 'name' is the property storing the user's name
    }
    return "";
  };
  const username = getUsernameFromCookie();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    contact: "",
    payment_amount: "",
    password: "",
    confirmPassword: "",
    subscription_valid: "",
  });

  const [formErrors, setFormErrors] = useState({
    confirmPasswordError: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Step 1: Check User (Validate dairy name, email, contact)
  const handleCheckUser = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.contact || !formData.address) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormErrors({
        confirmPasswordError: "Passwords do not match",
      });
      return;
    }

    if (!Number(formData.contact) || formData.contact.length !== 10) {
      setFormErrors({
        confirmPasswordError: "Contact number should be a 10-digit number",
      });
      return;
    }

    if (!formData.subscription_valid) {
      toast.error("Please select subscription validity period");
      return;
    }

    try {
      const response = await axios.post("/api/admin/checkUser", {
        dairy_name: formData.name,
        email: formData.email,
        contact: formData.contact,
      });

      if (response.status === 200) {
        setIsUserValidated(true);
        toast.success("Validation successful! Proceed to payment.");
      }
    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Validation failed. Please check your details.");
      }
    }
  };

  // Step 2: Proceed to Payment
  const handleProceedToPayment = async () => {
    if (!VITE_ENCRYPTION_RAZORPAY_KEY) {
      toast.error("Razorpay key not configured. Please check your .env file.");
      console.error("VITE_ENCRYPTION_RAZORPAY_KEY is not set in frontend .env file");
      return;
    }

    // Validate password before proceeding
    if (!formData.password || formData.password.trim() === "") {
      toast.error("Password is required");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Calculate total with GST (18% GST)
      const subtotal = parseFloat(formData.payment_amount);
      const gst = subtotal * 0.18;
      const totalAmount = subtotal + gst;

      // Create Razorpay order
      const {
        data: { order },
      } = await axios.post("/api/admin/usermakepayment", {
        amount: totalAmount,
      });

      // Prepare notes - ensure all values are strings (Razorpay requirement)
      const paymentNotes = {
        dairy_name: String(formData.name || ""),
        contact: String(formData.contact || ""),
        email: String(formData.email || ""),
        address: String(formData.address || ""),
        password_hash: String(formData.password || ""), // Ensure password is sent as string
        periods: String(formData.subscription_valid || ""),
        amount: String(totalAmount),
        subtotal: String(subtotal),
        gst: String(gst),
      };

      // Debug: Log notes to verify password_hash is included
      console.log("Sending payment notes:", { ...paymentNotes, password_hash: "***HIDDEN***" });

      const options = {
        key: VITE_ENCRYPTION_RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "Mauli Dairy",
        description: "Dairy Subscription Payment",
        image: "/mauli_logo.png",
        order_id: order.id,
        // Remove callback_url since we're using handler function
        // callback_url: `${window.location.origin}/api/admin/paymentVerification`,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.contact,
        },
        notes: paymentNotes,
        theme: {
          color: "#000000",
        },
        handler: function (response) {
          // Payment successful - verify payment via API
          handlePaymentVerification(response);
        },
      };

      const rzp1 = new window.Razorpay(options);
      
      rzp1.on("payment.failed", function (response) {
        toast.error(`Payment failed: ${response.error.description || "Please try again"}`);
        setIsProcessingPayment(false);
      });

      rzp1.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.message || "Failed to initiate payment");
      setIsProcessingPayment(false);
    }
  };

  // Step 3: Payment Verification
  const handlePaymentVerification = async (paymentResponse) => {
    try {
      setIsProcessingPayment(true);
      
      // Send form data along with payment verification to avoid relying on Razorpay notes
      const response = await axios.post("/api/admin/paymentVerification", {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        // Include form data directly
        dairy_name: formData.name,
        email: formData.email,
        contact: formData.contact,
        address: formData.address,
        password_hash: formData.password,
        periods: formData.subscription_valid,
        payment_amount: formData.payment_amount,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Payment verification successful
      if (response.data.success) {
        toast.success("Payment successful! Dairy registered successfully.");
        
        // Reset form
        setFormData({
          name: "",
          address: "",
          email: "",
          contact: "",
          password: "",
          confirmPassword: "",
          subscription_valid: "",
          payment_amount: "",
        });
        setIsUserValidated(false);
        setIsProcessingPayment(false);
        
        // Redirect to dairy list page after a short delay
        setTimeout(() => {
          window.location.href = "/dairy-list";
        }, 1500);
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      const errorMessage = error.response?.data?.message || "Payment verification failed. Please contact support.";
      toast.error(errorMessage);
      setIsProcessingPayment(false);
      
      // If it's a redirect response (status 302/301), handle it
      if (error.response?.status === 302 || error.response?.status === 301) {
        // Backend redirected, follow the redirect
        const redirectUrl = error.response.headers?.location || "/dairy-list";
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
      }
    }
  };

  // Old handleSubmit - kept for backward compatibility but not used
  const handleSubmit = (e) => {
    e.preventDefault();
    // This function is now replaced by handleCheckUser
    handleCheckUser(e);
  };

  useEffect(() => {
    switch (formData.subscription_valid) {
      case "monthly":
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "299",
        }));
        break;
      case "quarterly":
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "499",
        }));
        break;
      case "half-yearly":
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "799",
        }));
        break;
      case "yearly":
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "1499",
        }));
        break;
      default:
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "",
        }));
        break;
    }
  }, [formData.subscription_valid]);

  return (
    <div className={`App ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
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

      <Header dashboardText="Dashboard" />

      {/* Profile Popup */}
      <Modal show={showProfile} onHide={() => setShowProfile(false)} centered>
        <Modal.Header closeButton>
          {/* <Modal.Title>Profile</Modal.Title>  */}
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mt-4">
            <Image
              src={logo}
              roundedCircle
              width={100}
              height={100}
              style={{ border: "1px solid black" }}
            />
            {/* <h4>{username}</h4> */}
            <h1>Superadmin</h1>
            <h5 className="light_text">Last connect 1 day ago</h5>
          </div>
          <Row className="mt-3 row">
            <Col className="col-6">
              <p
                style={{
                  backgroundColor: "black",
                  color: "white",
                  padding: "16px",
                  borderRadius: "6px",
                  textAlign: "center",
                  fontWeight: "normal",
                }}
              >
                +91 1234567890
              </p>
            </Col>
            <Col className="col-6">
              <p
                style={{
                  backgroundColor: "black",
                  color: "white",
                  padding: "16px",
                  borderRadius: "6px",
                  marginLeft: "-13px",
                  fontWeight: "normal",
                }}
              >
                user@example.com
              </p>
            </Col>
          </Row>
          <div className="mt-3 row">
            <div className="col-4">
              <Button
                variant="outline-primary"
                onClick={() => setActiveTab("edit")}
                className="click_btn"
              >
                Edit Profile
              </Button>
            </div>

            <div className="col-4">
              <Button
                variant="outline-primary"
                onClick={() => setActiveTab("account")}
                className="click_btn"
              >
                Account Info
              </Button>
            </div>

            <div className="col-4">
              <Button
                variant="outline-primary"
                onClick={() => setActiveTab("other")}
                className="click_btn"
              >
                Other Info
              </Button>
            </div>
          </div>

          {/* Displaying content based on active tab */}
          {activeTab === "edit" && (
            <div className="row">
              <div
                className="col-12"
                style={{
                  border: "1px solid black",
                  borderRadius: "6px",
                  marginTop: "11px",
                  padding: "10px",
                }}
              >
                <p>Edit Profile Data Here</p>
              </div>
            </div>
          )}
          {activeTab === "account" && (
            <div className="row">
              {/* Display edit profile data here */}

              <div
                className="col-12"
                style={{
                  border: "1px solid black",
                  borderRadius: "6px",
                  marginTop: "11px",
                  padding: "10px",
                }}
              >
                <div className="row light_text">
                  <div className="col-8">Mobile No : </div>
                  <div className="col-4">+91 1234567890</div>
                </div>
                <div className="row mt-3 light_text">
                  <div className="col-8">Address : </div>
                  <div className="col-4"></div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "other" && (
            <div className="row">
              {/* Display edit profile data here */}

              <div
                className="col-12"
                style={{
                  border: "1px solid black",
                  borderRadius: "6px",
                  marginTop: "11px",
                  padding: "10px",
                }}
              >
                <p>Other Data Here</p>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Main Content */}
      <Container fluid className="main-content mt-5">
        <h3 className="heading">New Dairy Registration</h3>
        <Form onSubmit={handleSubmit}>
          <div className="row mt-4">
            <div className="col-12">
              <Form.Group controlId="name">
                <Form.Label>Dairy Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter dairy name"
                  required
                />
              </Form.Group>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-12">
              <Form.Group controlId="address">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Enter dairy full address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-12 col-md-6">
              <Form.Group controlId="email">
                <Form.Label>Email-ID</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Enter dairy email-ID"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>

            <div className="col-12 col-md-6 mt-4 mt-md-0">
              <Form.Group controlId="contact">
                <Form.Label>Mobile Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter phone no"
                  name="contact"
                  pattern="[0-9]{10}"
                  maxLength="10"
                  minLength="6"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-12 col-md-6 mt-4 mt-md-0">
              <Form.Group controlId="subscription_valid">
                <Form.Label>Subscription Validity</Form.Label>
                <Form.Select
                  name="subscription_valid"
                  value={formData.subscription_valid}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select validity period</option>
                  <option value="monthly">Basic(30 days)</option>
                  <option value="quarterly">plus(90 days)</option>
                  <option value="half-yearly">Gold(180 days)</option>
                  <option value="yearly">Platinum(365 days)</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-12 col-md-6 mt-4 mt-md-0">
              <Form.Group controlId="payment_amount">
                <Form.Label>Payment Amount</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter payment amount"
                  name="payment_amount"
                  value={formData.payment_amount}
                  onChange={handleChange}
                  readOnly
                />
              </Form.Group>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-12 col-md-6">
              <Form.Group className="mb-1" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <div className="password-input">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Please enter your Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <span
                    onClick={togglePasswordVisibility}
                    style={{
                      position: "absolute",
                      top: "53%",
                      right: "15px",
                      cursor: "pointer",
                      transform: "translateY(-50%)",
                    }}
                  >
                    {showPassword ? <EyeSlashFill /> : <EyeFill />}
                  </span>
                </div>
              </Form.Group>
            </div>

            <div className="col-12 col-md-6 mt-4 mt-md-0">
              <Form.Group className="mb-1" controlId="formBasicConfirmPassword">
                <Form.Label>Confirm Password</Form.Label>
                <div className="password-input">
                  <Form.Control
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Please confirm your Password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <span
                    onClick={toggleConfirmPasswordVisibility}
                    style={{
                      position: "absolute",
                      top: "53%",
                      right: "15px",
                      cursor: "pointer",
                      transform: "translateY(-50%)",
                    }}
                  >
                    {showConfirmPassword ? <EyeSlashFill /> : <EyeFill />}
                  </span>
                </div>
                {formErrors.confirmPasswordError && (
                  <span className="text-danger">
                    {formErrors.confirmPasswordError}
                  </span>
                )}
              </Form.Group>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-12">
              <center>
                {!isUserValidated ? (
                  <Button
                    variant="dark"
                    type="submit"
                    className="mt-2 mb-4"
                    style={{ width: "70%", backgroundColor: "black !important" }}
                    onClick={handleCheckUser}
                  >
                    Check & Validate
                  </Button>
                ) : (
                  <div>
                    <Button
                      variant="success"
                      className="mt-2 mb-2"
                      style={{ width: "70%", backgroundColor: "#28a745 !important" }}
                      onClick={handleProceedToPayment}
                      disabled={isProcessingPayment}
                    >
                      {isProcessingPayment ? "Processing..." : "Proceed to Payment"}
                    </Button>
                    <br />
                    <Button
                      variant="secondary"
                      className="mt-2 mb-4"
                      style={{ width: "70%" }}
                      onClick={() => setIsUserValidated(false)}
                    >
                      Go Back
                    </Button>
                  </div>
                )}
              </center>
            </div>
          </div>
        </Form>
      </Container>
    </div>
  );
}

export default Dairy_Register;
