import React, { useEffect, useState } from "react";
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Modal,
  Button,
  Image,
  Row,
  Col,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import logo from "/mauli_logo.png";
import "./Userheader.css";
import { NavLink, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { forwardRef, useImperativeHandle } from "react";

const Userheader = forwardRef((prop, ref) => {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showAdvancePaymentPopup, setShowAdvancePaymentPopup] = useState(false);
  const [showPaymentHistoryPopup, setShowPaymentHistoryPopup] = useState(false);
  const [qr_image, setQr_Image] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [total_pending, setTotalPending] = useState({
    total_pending_payment: 0,
    previous_month_payment: 0,
  });

  const handleShowProfilePopup = () => setShowProfilePopup(true);
  const handleShowAdvancePaymentPopup = () => setShowAdvancePaymentPopup(true);

  const handleCloseProfilePopup = () => setShowProfilePopup(false);
  const handleCloseAdvancePaymentPopup = () =>
    setShowAdvancePaymentPopup(false);

  const handleClosePaymentHistoryPopup = () =>
    setShowPaymentHistoryPopup(false);
  const handleShowPaymentHistoryPopup = () => setShowPaymentHistoryPopup(true);

  const getUsernameFromCookie = () => {
    const cookieValue = Cookies.get("Mauli-Dairy");
    if (cookieValue) {
      const userData = JSON.parse(cookieValue);
      return userData.name;
    }
    return "";
  };

  const fetchPaymentProof = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("/api/user/get-paymentProof", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if qr_image exists and has data
      if (response.data && response.data.qr_image && response.data.qr_image.data) {
        const byteArray = response.data.qr_image.data;
        const base64String = btoa(
          new Uint8Array(byteArray).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
        setQr_Image(base64String);
      } else {
        // No QR image available
        setQr_Image(null);
      }
    } catch (error) {
      console.log("Error fetching payment proof:", error);
      setQr_Image(null);
    }
  };

  // ✅ Expose fetchPaymentProof to parent
  useImperativeHandle(ref, () => ({
    fetchPaymentProof,
  }));

  useEffect(() => {
    fetchPaymentProof();
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.mobile-menu-container') && !event.target.closest('.hamburger-icon')) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const fetchPendingPayment = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get("/api/user/get-payment-summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success || response.status === 200) {
        const paymentHistory = response.data.paymentHistory;

        // 🔄 Get last month in format "YYYY-MM"
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() - 1);
        const lastMonthYear = currentDate.toISOString().slice(0, 7); // e.g. "2025-03"

        // 🔍 Find the record for last month
        const lastMonthPayment = paymentHistory.find(
          (payment) => payment.month_year === lastMonthYear
        );

        if (lastMonthPayment) {
          const pending = parseFloat(lastMonthPayment.pending_payment || 0);
          const received = parseFloat(lastMonthPayment.received_payment || 0);

          if (pending > 0) {
            setTotalPending({
              total_pending_payment: pending,
              previous_month_payment: 0,
            });
          } else if (received > 0) {
            setTotalPending({
              total_pending_payment: 0,
              previous_month_payment: received,
            });
          } else {
            setTotalPending({
              total_pending_payment: 0,
              previous_month_payment: 0,
            });
          }
        } else {
          setTotalPending({
            total_pending_payment: 0,
            previous_month_payment: 0,
          });
        }
      } else {
        toast.error(response.data.message || "Failed to fetch payment data.");
      }
    } catch (error) {
      console.error("Error fetching pending payment:", error);
      toast.error("Failed to fetch total pending month payment.");
    }
  };

  useEffect(() => {
    fetchPendingPayment();
  }, []);

  const username = getUsernameFromCookie();

  const [profile, setProfile] = useState({
    dairy_name: "",
    name: "",
    email: "",
    contact: "",
    address: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchProfile = async () => {
      const response = await axios.get("/api/user/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log("profile response", response);
      setProfile({
        dairy_name: response.data.dairy_name,
        name: response.data.name,
        email: response.data.email,
        contact: response.data.contact,
        address: response.data.address,
      });
    };
    fetchProfile();
  }, []);

  const handleLogout = (e) => {
    e.preventDefault(); // Prevent the default form submission
    Swal.fire({
      title: "Logout",
      text: "Are you sure you want to log out? You will need to log in again to access your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        localStorage.removeItem("token");
        Cookies.remove("Mauli-Dairy", { path: "/" });
        navigate("/"); // Navigate to home only after confirmation
      }
    });
  };

  return (
    <>
      <Navbar
        className="fixed top-0 right-0 d-flex bg-dark w-100"
        style={{ color: "white", height: "73px", zIndex: 1050 }}
      >
        {" "}
        <Container fluid>
          <div className="d-flex align-items-center justify-content-between w-100">
            <div className="d-flex align-items-center">
              <Navbar.Brand href="#">
                <img
                  src={logo}
                  alt="Logo"
                  style={{
                    height: "97px",
                    width: "142px",
                    marginRight: "20px",
                  }}
                />
              </Navbar.Brand>

              <div
                className="d-none d-lg-flex flex-column flex-lg-row contact-info"
                style={{ display: "flex" }}
              >
                <p className="mb-0 me-lg-3">
                  Contact Us:{" "}
                  <a
                    href="tel:9822888290"
                    style={{ textDecoration: "none", color: "white" }}
                  >
                    9822888290
                  </a>
                </p>
                <p className="mb-0">
                  Email-ID:{" "}
                  <a
                    href="mailto:mulidairy123@gmail.com"
                    style={{ textDecoration: "none", color: "white" }}
                  >
                    mulidairy123@gmail.com
                  </a>
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center">
              {/* Hamburger Menu for Mobile - Right Side */}
              <div 
                className="d-lg-none ms-3 hamburger-icon"
                tabIndex={-1}
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none",
                  outline: "none",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onFocus={(e) => e.target.blur()}
              >
                <FontAwesomeIcon
                  icon={mobileMenuOpen ? faTimes : faBars}
                  style={{
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "white",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    pointerEvents: "auto",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMobileMenuOpen(!mobileMenuOpen);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                />
              </div>

              <Nav
                className="ml-auto nav-dropdown d-none d-lg-block"
                style={{
                  position: "relative",
                  align: "end",
                  marginRight: "50px",
                }}
              >
                <NavDropdown
                  title={
                    <span
                      className="d-block d-md-inline d-sm-inline"
                      style={{
                        color: "white",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faUser}
                        style={{ marginRight: "8px" }}
                      />
                      {username}
                    </span>
                  }
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Item>
                    {" "}
                    <span
                      style={{
                        color: "black",
                        textDecoration: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                      onClick={handleShowProfilePopup}
                    >
                      Profile
                    </span>
                  </NavDropdown.Item>

                  <NavDropdown.Item href="#logout">
                    {" "}
                    <span
                      style={{
                        color: "black",
                        textDecoration: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                      onClick={handleShowPaymentHistoryPopup}
                    >
                      Payment History
                    </span>
                  </NavDropdown.Item>
                  <NavDropdown.Item>
                    {" "}
                    <span
                      style={{
                        color: "black",
                        textDecoration: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                      onClick={handleLogout}
                    >
                      Logout
                    </span>
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </div>
          </div>
        </Container>
      </Navbar>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-container"
          style={{
            position: "fixed",
            top: "73px",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            zIndex: 1060,
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            maxHeight: "calc(100vh - 73px)",
            overflowY: "auto",
            borderTop: "2px solid #007bff",
          }}
        >
          <div style={{ color: "#333" }}>
            {/* Contact Info */}
            <div style={{ marginBottom: "20px", borderBottom: "1px solid #e0e0e0", paddingBottom: "15px" }}>
              <p className="mb-2" style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                Contact Us:{" "}
                <a
                  href="tel:9822888290"
                  style={{ textDecoration: "none", color: "#007bff", fontWeight: "normal" }}
                >
                  9822888290
                </a>
              </p>
              <p className="mb-0" style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                Email-ID:{" "}
                <a
                  href="mailto:mulidairy123@gmail.com"
                  style={{ textDecoration: "none", color: "#007bff", fontWeight: "normal" }}
                >
                  mulidairy123@gmail.com
                </a>
              </p>
            </div>

            {/* User Menu */}
            <div>
              <p style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px", color: "#333" }}>
                <FontAwesomeIcon
                  icon={faUser}
                  style={{ marginRight: "8px", color: "#007bff" }}
                />
                {username}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => {
                    handleShowProfilePopup();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #dee2e6",
                    color: "#333",
                    padding: "12px 15px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#e9ecef";
                    e.target.style.borderColor = "#007bff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#f8f9fa";
                    e.target.style.borderColor = "#dee2e6";
                  }}
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    handleShowPaymentHistoryPopup();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #dee2e6",
                    color: "#333",
                    padding: "12px 15px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#e9ecef";
                    e.target.style.borderColor = "#007bff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#f8f9fa";
                    e.target.style.borderColor = "#dee2e6";
                  }}
                >
                  Payment History
                </button>
                <button
                  onClick={() => {
                    handleLogout({ preventDefault: () => {} });
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    backgroundColor: "#dc3545",
                    border: "none",
                    color: "white",
                    padding: "12px 15px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "bold",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#c82333";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#dc3545";
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        show={showProfilePopup}
        onHide={handleCloseProfilePopup}
        centered
        dialogClassName="custom-modal"
      >
        <Modal.Body className="text-center">
          <Image
            src={logo}
            roundedCircle
            width={120}
            height={120}
            style={{
              border: "3px solid #007bff",
              padding: "5px",
              backgroundColor: "black",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          />
          <h4 className="mt-3" style={{ fontWeight: "bold", color: "#333" }}>
            {profile.name}
          </h4>
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "10px",
              borderRadius: "8px",
              marginTop: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#007bff",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            Dairy :{" "}
            {profile.dairy_name
              ? profile.dairy_name.toUpperCase()
              : "DAIRY NAME NOT AVAILABLE"}
          </div>
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: "10px",
              padding: "15px",
              marginTop: "20px",
              textAlign: "left",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h5 style={{ fontWeight: "bold", color: "#333" }}>
              Contact Details
            </h5>
            <hr />
            <div className="d-flex justify-content-between">
              <span className="text-muted">Mobile No:</span>
              <span>+91 {profile.contact}</span>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span className="text-muted">Email :</span>
              <span>{profile.email}</span>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span className="text-muted">Address:</span>
              <span>{profile.address}</span>
            </div>
          </div>

          <div className="mt-4 d-flex justify-content-center">
            <Button variant="secondary" onClick={handleCloseProfilePopup}>
              Close
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={showPaymentHistoryPopup}
        onHide={handleClosePaymentHistoryPopup}
        centered
        dialogClassName="custom-modal"
      >
        <Modal.Header closeButton style={{ borderBottom: "none" }}>
          <Modal.Title as="h5" className="mb-0 modal-title-responsive">
            Last Month Pending Payment History
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="text-center">
          {total_pending.total_pending_payment > 0 ? (
            <>
              <p>
                Total Pending Payment of last Month :{" "}
                <span style={{ fontWeight: "bold" }}>
                  ₹ {total_pending.total_pending_payment}
                </span>
                <p>Payment Proof: </p>
                {qr_image ? (
                  <Image
                    src={`data:image/png;base64,${qr_image}`}
                    alt="QR Code"
                    style={{
                      width: "300px",
                      height: "300px",
                      borderRadius: "10px",
                      marginTop: "10px",
                    }}
                  ></Image>
                ) : (
                  <p>Payment Proof Not Uploaded Still Now</p>
                )}
              </p>
            </>
          ) : total_pending.previous_month_payment > 0 ? (
            <>
              <p>No Outstanding Payments as of Last Month</p>
              <p>
                Previous Month Received Payment :{" "}
                <span style={{ fontWeight: "bold" }}>
                  ₹ {total_pending.previous_month_payment}
                </span>
                <p>Payment Proof: </p>
                {qr_image ? (
                  <Image
                    src={`data:image/png;base64,${qr_image}`}
                    alt="QR Code"
                    style={{
                      width: "300px",
                      height: "300px",
                      borderRadius: "10px",
                      marginTop: "10px",
                    }}
                  ></Image>
                ) : (
                  <p>Payment Proof Not Uploaded Still Now</p>
                )}
              </p>
            </>
          ) : (
            <>
              <p>No pending or previous payments found.</p>
              <p>Payment Proof: </p>
              {qr_image ? (
                <Image
                  src={`data:image/png;base64,${qr_image}`}
                  alt="QR Code"
                  style={{
                    width: "300px",
                    height: "300px",
                    borderRadius: "10px",
                    marginTop: "10px",
                  }}
                ></Image>
              ) : (
                <p>Payment Proof Not Uploaded Still Now</p>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
});
export default Userheader;
