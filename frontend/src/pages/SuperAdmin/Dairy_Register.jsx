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

function Dairy_Register() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (formData.password !== formData.confirmPassword) {
      setFormErrors({
        confirmPasswordError: "Passwords do not match",
      });
    } else if (!Number(formData.contact)) {
      setFormErrors({
        confirmPasswordError: "Contact number should be a number",
      });
    } else {
      setFormErrors({
        confirmPasswordError: "",
      });
      axios
        .post(
          "/api/register-admin",
          {
            dairy_name: formData.name,
            email: formData.email,
            password_hash: formData.password,
            contact: formData.contact,
            address: formData.address,
            payment_amount: formData.payment_amount,
            periods: formData.subscription_valid,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((res) => {
          toast.success("Dairy Registered Successfully!");
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
        })
        .catch((err) => {
          if (err.response.data.message) {
            toast.error(err.response.data.message);
          } else {
            toast.error("Failed to register dairy.");
          }
        });
    }
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
                <Button
                  variant="dark"
                  type="submit"
                  className="mt-2 mb-4"
                  style={{ width: "70%", backgroundColor: "black !important" }}
                >
                  Register
                </Button>
              </center>
            </div>
          </div>
        </Form>
      </Container>
    </div>
  );
}

export default Dairy_Register;
