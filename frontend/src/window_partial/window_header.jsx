import { useState, useEffect, useRef } from "react";
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Modal,
  Button,
  Image,
} from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBars,
  faTimes,
  faSignOutAlt,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import "./window_header.css";
import logo from "/mauli_logo.png";
import "./window.css";
import axios from "axios";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

function WindowHeader({ dashboardText }) {
  const [username, setUsername] = useState("");
  // const username = getUsernameFromCookie();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customerListOpen, setCustomerListOpen] = useState(true);
  const [activeSubMenu, setActiveSubMenu] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const navigate = useNavigate();

  const handleCloseProfilePopup = () => setShowProfilePopup(false);
  const handleShowProfilePopup = () => setShowProfilePopup(true);
  const handleShowPaymentPopup = () => setShowPaymentPopup(true);
  const handleEditProfile = () => {
    setShowEditProfile(true);
  };
  const handleCloseEditProfile = () => {
    setShowEditProfile(false);
  };

  const handleClosePaymentPopup = () => {
    setShowPaymentPopup(false);
  };

  const [upiAddress, setUpiAddress] = useState("");
  const [qrImage, setQrImage] = useState(null);
  const [upiError, setUpiError] = useState("");
  const fileInputRef = useRef(null);

  const [bankDetails, setBankDetails] = useState({
    bank_name: "",
    branch_name: "",
    account_number: "",
    ifsc_code: "",
  });
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setQrImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchAdminName = async () => {
      try {
        const response = await axios.get("/api/admin/admin-name", {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        });

        if (response.data && response.data.dairy_name) {
          setUsername(response.data.dairy_name);
        } else {
          console.warn("Admin name not found in response:", response.data);
          setUsername("Unknown");
        }
      } catch (error) {
        console.error("Error fetching admin name:", error);
        setUsername("Error");
      }
    };

    fetchAdminName();
  }, []);

  const handleUpiChange = (event) => {
    const value = event.target.value;
    setUpiAddress(value);

    const upiRegex = /^[\w.-]+@[a-zA-Z]+$/;

    if (value === "") {
      setUpiError("");
    } else if (!upiRegex.test(value)) {
      setUpiError("Invalid UPI ID. Format: example@upi");
    } else {
      setUpiError("UPI ID is valid.");
    }
  };

  const [imagePreview, setImagePreview] = useState(null);

  const handleSubmitForm = async (event) => {
    event.preventDefault();
    const upiRegex = /^[\w.-]+@[a-zA-Z]+$/;
    if (!upiRegex.test(upiAddress)) {
      setUpiError("Invalid UPI ID. Format: example@upi");
      return;
    }

    const formData = new FormData();
    formData.append("upi_address", upiAddress);
    formData.append("bank_name", bankDetails.bank_name);
    formData.append("branch_name", bankDetails.branch_name);
    formData.append("account_number", bankDetails.account_number);
    formData.append("ifsc_code", bankDetails.ifsc_code);
    if (qrImage) {
      formData.append("qr_image", qrImage);
    }

    try {
      const response = await axios.put(
        "api/admin/update-payment-details",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: "Bearer " + localStorage.getItem("token"), // Assuming token-based authentication
          },
        }
      );

      toast.success("Payment Details Updated Successfully");
      setUpiAddress("");
      handleClosePaymentPopup();
      setBankDetails({
        bank_name: "",
        branch_name: "",
        account_number: "",
        ifsc_code: "",
      });
      setUpiError("");
      setQrImage(null);
      setImagePreview(null);
      fileInputRef.current.value = null;
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while updating payment details.");
    }
  };

  const [profile, setProfile] = useState({
    dairy_name: "",
    email: "",
    contact: "",
    address: "",
    end_date: "",
    start_date: "",
    payment_amount: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchProfile = async () => {
      try {
        const response = await axios.get("/api/admin/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile({
          dairy_name: response.data.dairy_name || "",
          email: response.data.email || "",
          contact: response.data.contact || "",
          address: response.data.address || "",
          start_date: response.data.res_date || "",
          end_date: response.data.end_date || "",
          payment_amount: response.data.payment_amount || "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        // Set default values on error
        setProfile({
          dairy_name: "",
          email: "",
          contact: "",
          address: "",
          start_date: "",
          end_date: "",
          payment_amount: "",
        });
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "/api/admin/profile",
        {
          email: profile.email,
          contact: profile.contact,
          address: profile.address,
          new_dairy_name: profile.dairy_name,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Profile updated Successfully");
      handleCloseEditProfile();
      // console.log("Profile updated:", response.data);
    } catch (error) {
      console.error(
        "Error updating profile:",
        error.response?.data || error.message
      );
      toast.error("Failed to update the profile");
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const mainContent = document.querySelector(".main-content");
    if (window.innerWidth < 768) {
      mainContent.style.width = "100%";
      mainContent.style.marginLeft = "0";
    } else {
      if (sidebarOpen) {
        mainContent.style.width = "81%";
        mainContent.style.marginLeft = "19%";
      } else {
        mainContent.style.width = "100%";
        mainContent.style.marginLeft = "0";
      }
    }
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen((prevOpen) => !prevOpen);
  };

  const toggleCustomerList = () => {
    setCustomerListOpen((prevOpen) => !prevOpen);
  };

  const handleSubMenuClick = (menu) => {
    setActiveSubMenu(menu);
  };

  const fetchCurrentCustomerRates = async () => {
    try {
      const token = localStorage.getItem("token");
      // Fetch admin profile which now includes rates
      const response = await axios.get("/api/admin/profile/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // If rates are in the response, use them
      if (response.data) {
        setCurrentCustomerRates({
          cow_rate: response.data.cow_rate || 0,
          buffalo_rate: response.data.buffalo_rate || 0,
          pure_rate: response.data.pure_rate || 0,
          delivery_charges: response.data.delivery_charges || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching customer rates:", error);
      // Set defaults on error
      setCurrentCustomerRates({
        cow_rate: 0,
        buffalo_rate: 0,
        pure_rate: 0,
        delivery_charges: 0,
      });
    }
  };

  const openModal = () => {
    setShowModal(true);
    fetchCurrentCustomerRates(); // Fetch current rates when modal opens
  };

  const fetchCurrentFarmerRates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/get_farmer_Milkrate", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data) {
        setCurrentFarmerRates({
          farmer_cow_rate: response.data.farmer_cow_rate || 0,
          farmer_buffalo_rate: response.data.farmer_buffalo_rate || 0,
          farmer_pure_rate: response.data.farmer_pure_rate || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching farmer rates:", error);
      // Set defaults if error occurs
      setCurrentFarmerRates({
        farmer_cow_rate: 0,
        farmer_buffalo_rate: 0,
        farmer_pure_rate: 0,
      });
    }
  };

  const openFarmerModal = () => {
    setShowFarmerModal(true);
    fetchCurrentFarmerRates(); // Fetch current rates when modal opens
  };

  const handleClose = () => {
    Cookies.remove("Mauli-Dairy", { path: "/" });
    navigate("/");
  };

  const closeModal = () => {
    setShowModal(false);
  };
  const closeFarmerModal = () => {
    setShowFarmerModal(false);
  };
  const [pureMilkRate, setPureMilkRate] = useState("");
  const [cowMilkRate, setCowMilkRate] = useState("");
  const [buffaloMilkRate, setBuffaloMilkRate] = useState("");
  const [delivery_charges, setDeliveryCharges] = useState("");
  
  // State to store current customer milk rates
  const [currentCustomerRates, setCurrentCustomerRates] = useState({
    cow_rate: 0,
    buffalo_rate: 0,
    pure_rate: 0,
    delivery_charges: 0,
  });

  const [farmerpureMilkRate, setFarmerPureMilkRate] = useState("");
  const [farmercowMilkRate, setFarmerCowMilkRate] = useState("");
  const [farmerbuffaloMilkRate, setFarmerBuffaloMilkRate] = useState("");
  
  // State to store current farmer milk rates
  const [currentFarmerRates, setCurrentFarmerRates] = useState({
    farmer_cow_rate: 0,
    farmer_buffalo_rate: 0,
    farmer_pure_rate: 0,
  });

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "/api/admin/addRate",
        {
          cow_rate: cowMilkRate,
          buffalo_rate: buffaloMilkRate,
          pure_rate: pureMilkRate,
          delivery_charges: delivery_charges,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        setTimeout(() => {
          window.location.reload();
        }, 5000);
        toast.success("Milk rates added successfully");
        setPureMilkRate("");
        setCowMilkRate("");
        setBuffaloMilkRate("");
        setDeliveryCharges("");
        closeModal();
      }
    } catch (error) {
      toast.error(error.response.data.message);
      console.error("Error adding milk rates:", error);
    }
  };

  const handleFarmerSubmit = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.put(
        "/api/admin/add_farmer_Milkrate",
        {
          farmer_cow_rate:farmercowMilkRate,
          farmer_buffalo_rate:farmerbuffaloMilkRate,
          farmer_pure_rate:farmerpureMilkRate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        // setTimeout(() => {
        //   window.location.reload();
        // }, 5000);
        toast.success("Milk rates added successfully");
        setFarmerPureMilkRate("");
        setFarmerCowMilkRate("");
        setFarmerBuffaloMilkRate("");
        closeFarmerModal();
      }
    } catch (error) {
      toast.error(error.response.data.message);
      console.error("Error adding milk rates:", error);
    }
  };

  const handleLogout = () => {
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
        handleClose();
      }
    });
  };

  return (
    <div>
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
        transition={Bounce}
      />
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>

        <ul className="sidebar-nav">
          <li>
            <NavLink
              to="/admin-dashboard"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/user-request"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              User Request
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/farmer-list"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Farmer List
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/farmer-order-history"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Farmer Order History
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/farmer-payment-history"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Farmer Payment History
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin-customer-list"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              onClick={toggleCustomerList}
            >
              Customer List
              <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </NavLink>
            {customerListOpen && (
              <ul className="sub-menu">
                <li>
                  <NavLink
                    to="/customer-morning"
                    className={
                      activeSubMenu === "morning" ? "active" : "inactive"
                    }
                    onClick={() => handleSubMenuClick("morning")}
                  >
                    Morning
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/customer-evening"
                    className={
                      activeSubMenu === "evening" ? "active" : "inactive"
                    }
                    onClick={() => handleSubMenuClick("evening")}
                  >
                    Evening
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
          {/* Additional Orders Section - Commented Out */}
          {/* <li>
            <NavLink
              to="/additional-orders"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Additional Orders
            </NavLink>
          </li> */}
          <li>
            <NavLink
              to="/payment-history"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Payment History
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/delivery-boy-list"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Delivery Boy List
            </NavLink>
          </li>
        </ul>
        <div className="sidebar-bottom">
          <NavLink 
            to="#" 
            className="btnLogout" 
            style={{ color: "white" }} 
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
          >
            <FontAwesomeIcon
              icon={faSignOutAlt}
              style={{ marginRight: "8px", marginTop: "20px" }}
            />
            Logout
          </NavLink>
        </div>
      </div>
      <Navbar className="bg-dark navbar-dark">
        <Container fluid>
          <div className="d-flex align-items-center w-100">
            <Navbar.Brand href="#">
              <FontAwesomeIcon
                icon={sidebarOpen ? faTimes : faBars}
                className="toggle-btn"
                id="toggle_btn"
                onClick={toggleSidebar}
              />
            </Navbar.Brand>
            <div className="d-none d-md-flex flex-column flex-md-row align-items-md-center contact-info">
              <p className="mb-0 me-md-3">
                {dashboardText}
                <a
                  href="tel:9822888290"
                  style={{ textDecoration: "none", color: "white" }}
                ></a>
              </p>
            </div>
            <Nav
              className="ml-auto"
              style={{ position: "relative", left: "5px" }}
            >
              <NavDropdown
                title={
                  <span style={{ color: "white" }}>
                    <FontAwesomeIcon
                      icon={faUser}
                      style={{ marginRight: "8px" }}
                    />
                    {username}
                  </span>
                }
                id="user-dropdown"
                style={{ marginRight: "1rem" }}
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
                <NavDropdown.Item>
                  {" "}
                  <span
                    style={{
                      color: "black",
                      textDecoration: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                    onClick={handleShowPaymentPopup}
                  >
                    Payment Details
                  </span>
                </NavDropdown.Item>
                <NavDropdown.Item
                  onClick={openModal}
                  style={{ fontSize: "12px" }}
                >
                  Customer Rates
                </NavDropdown.Item>
                <NavDropdown.Item
                  onClick={openFarmerModal}
                  style={{ fontSize: "12px" }}
                >
                  Farmer Rates
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item
                  onClick={handleLogout}
                  style={{ fontSize: "12px", cursor: "pointer" }}
                >
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </div>
        </Container>
      </Navbar>

      <Modal show={showModal} onHide={closeModal} className="mt-4">
        <Modal.Header className="modal_header" closeButton>
          <Modal.Title>Add Customer Milk Rates</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Display Current Rates */}
          <div style={{ 
            backgroundColor: "#f8f9fa", 
            padding: "15px", 
            borderRadius: "5px", 
            marginBottom: "20px",
            border: "1px solid #dee2e6"
          }}>
            <h6 style={{ marginBottom: "10px", fontWeight: "bold", color: "#333" }}>
              Current Customer Milk Rates:
            </h6>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Pure Milk:</strong> ₹{currentCustomerRates.pure_rate || 0} / 1 LTR
              </p>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Cow Milk:</strong> ₹{currentCustomerRates.cow_rate || 0} / 1 LTR
              </p>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Buffalo Milk:</strong> ₹{currentCustomerRates.buffalo_rate || 0} / 1 LTR
              </p>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Delivery Charges:</strong> ₹{currentCustomerRates.delivery_charges || 0}
              </p>
            </div>
          </div>

          <hr style={{ marginBottom: "20px" }} />

          <p>
            Pure Milk<span style={{ color: "red", paddingLeft: "4px" }}>*</span>
            <input
              type="number"
              className="rate_input"
              value={pureMilkRate}
              onChange={(e) => setPureMilkRate(e.target.value)}
              required
              placeholder={`Current: ₹${currentCustomerRates.pure_rate || 0} - Enter New Rate`}
            />
            <span style={{ paddingLeft: "4px" }}>/ 1 LTR</span>
          </p>
          <p>
            Cow Milk<span style={{ color: "red", paddingLeft: "4px" }}>*</span>
            <input
              type="number"
              className="rate_input"
              value={cowMilkRate}
              onChange={(e) => setCowMilkRate(e.target.value)}
              required
              placeholder={`Current: ₹${currentCustomerRates.cow_rate || 0} - Enter New Rate`}
            />
            <span style={{ paddingLeft: "4px" }}>/ 1 LTR</span>
          </p>
          <p>
            Buffalo Milk
            <span style={{ color: "red", paddingLeft: "4px" }}>*</span>
            <input
              type="number"
              className="rate_input"
              value={buffaloMilkRate}
              onChange={(e) => setBuffaloMilkRate(e.target.value)}
              required
              placeholder={`Current: ₹${currentCustomerRates.buffalo_rate || 0} - Enter New Rate`}
            />
            <span style={{ paddingLeft: "4px" }}>/ 1 LTR</span>
          </p>
          <p>
            Delivery Charges
            <input
              type="number"
              className="rate_input"
              style={{ marginLeft: "4px" }}
              value={delivery_charges}
              onChange={(e) => setDeliveryCharges(e.target.value)}
              placeholder={`Current: ₹${currentCustomerRates.delivery_charges || 0} - Enter New Charges`}
            />
          </p>
        </Modal.Body>
        <Button className="close_btn" onClick={handleSubmit}>
          Submit
        </Button>
      </Modal>

      <Modal show={showFarmerModal} onHide={closeFarmerModal} className="mt-4">
        <Modal.Header className="modal_header" closeButton>
          <Modal.Title>Add Farmer Milk Rates</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Display Current Rates */}
          <div style={{ 
            backgroundColor: "#f8f9fa", 
            padding: "15px", 
            borderRadius: "5px", 
            marginBottom: "20px",
            border: "1px solid #dee2e6"
          }}>
            <h6 style={{ marginBottom: "10px", fontWeight: "bold", color: "#333" }}>
              Current Farmer Milk Rates:
            </h6>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Pure Milk:</strong> ₹{currentFarmerRates.farmer_pure_rate || 0} / 1 LTR
              </p>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Cow Milk:</strong> ₹{currentFarmerRates.farmer_cow_rate || 0} / 1 LTR
              </p>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Buffalo Milk:</strong> ₹{currentFarmerRates.farmer_buffalo_rate || 0} / 1 LTR
              </p>
            </div>
          </div>

          <hr style={{ marginBottom: "20px" }} />

          <p>
            Pure Milk<span style={{ color: "red", paddingLeft: "4px" }}>*</span>
            <input
              type="number"
              className="rate_input"
              value={farmerpureMilkRate}
              onChange={(e) => setFarmerPureMilkRate(e.target.value)}
              placeholder={`Current: ₹${currentFarmerRates.farmer_pure_rate || 0} - Enter New Rate`}
              required
            />
            <span style={{ paddingLeft: "4px" }}>/ 1 LTR</span>
          </p>
          <p>
            Cow Milk<span style={{ color: "red", paddingLeft: "4px" }}>*</span>
            <input
              type="number"
              className="rate_input"
              value={farmercowMilkRate}
              onChange={(e) => setFarmerCowMilkRate(e.target.value)}
              required
              placeholder={`Current: ₹${currentFarmerRates.farmer_cow_rate || 0} - Enter New Rate`}
            />
            <span style={{ paddingLeft: "4px" }}>/ 1 LTR</span>
          </p>
          <p>
            Buffalo Milk
            <span style={{ color: "red", paddingLeft: "4px" }}>*</span>
            <input
              type="number"
              className="rate_input"
              value={farmerbuffaloMilkRate}
              onChange={(e) => setFarmerBuffaloMilkRate(e.target.value)}
              required
              placeholder={`Current: ₹${currentFarmerRates.farmer_buffalo_rate || 0} - Enter New Rate`}
            />
            <span style={{ paddingLeft: "4px" }}>/ 1 LTR</span>
          </p>
        </Modal.Body>
        <Button className="close_btn" onClick={handleFarmerSubmit}>
          Submit
        </Button>
      </Modal>

      <Modal
        show={showPaymentPopup}
        onHide={handleClosePaymentPopup}
        className="mt-4"
      >
        <Modal.Header className="modal_header" closeButton>
          <Modal.Title>Payment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="p-4 mt-3">
            <form onSubmit={handleSubmitForm} encType="multipart/form-data">
              {/* Upload Scanner */}
              <div className="mb-3">
                <label htmlFor="imageUpload" className="form-label fw-bold">
                  Upload Scanner <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className="form-control w-100"
                  type="file"
                  id="imageUpload"
                  name="qr_image"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  required
                />
              </div>

              {imagePreview && (
                <div className="mb-3 text-center">
                  <img
                    src={imagePreview}
                    alt="Uploaded Preview"
                    className="img-fluid rounded"
                    style={{ maxWidth: "200px", height: "auto" }}
                  />
                </div>
              )}

              {/* UPI ID */}
              <div className="mb-3 position-relative">
                <label htmlFor="upiId" className="form-label fw-bold">
                  UPI ID <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control w-100 ${
                    upiError.startsWith("Invalid")
                      ? "is-invalid"
                      : upiError.startsWith("UPI ID is valid")
                      ? "is-valid"
                      : ""
                  }`}
                  id="upiId"
                  placeholder="Enter UPI ID"
                  value={upiAddress}
                  onChange={handleUpiChange}
                />
                {upiError && (
                  <div
                    className={
                      upiError.startsWith("Invalid")
                        ? "text-danger"
                        : "text-success"
                    }
                  >
                    {upiError}
                  </div>
                )}
              </div>

              {/* Bank Details */}
              <div className="mb-3">
                <label htmlFor="bankName" className="form-label fw-bold">
                  Bank Name<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control w-100"
                  id="bankName"
                  value={bankDetails.bank_name}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      bank_name: e.target.value,
                    })
                  }
                  placeholder="Enter Bank Name"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="branchName" className="form-label fw-bold">
                  Branch Name<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control w-100"
                  id="branchName"
                  value={bankDetails.branch_name}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      branch_name: e.target.value,
                    })
                  }
                  placeholder="Enter Branch Name"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="accountNumber" className="form-label fw-bold">
                  Account Number<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control w-100"
                  id="accountNumber"
                  value={bankDetails.account_number}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      account_number: e.target.value,
                    })
                  }
                  placeholder="Enter Account Number"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="ifscCode" className="form-label fw-bold">
                  IFSC Code<span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control w-100"
                  id="ifscCode"
                  value={bankDetails.ifsc_code}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      ifsc_code: e.target.value,
                    })
                  }
                  placeholder="Enter IFSC Code"
                  required
                />
              </div>

              <div className="text-center">
                <button type="submit" className="btn btn-primary px-4">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </Modal.Body>
      </Modal>

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
            {profile.dairy_name}
          </h4>

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
            <h6 style={{ fontWeight: "bold", color: "#333" }}>
              Subscription Details:{" "}
            </h6>
            <hr />
            <div className="d-flex flex-wrap justify-content-between mt-2">
              <p>
                <span className="text-muted">Start Date: </span>
                <span>{profile.start_date?.slice(0, 10)}</span>
              </p>
              <p>
                <span className="text-muted">End Date: </span>
                <span>{profile.end_date?.slice(0, 10)}</span>
              </p>
              <p>
                <span className="text-muted">Amount Paid: </span>
                <span>{profile.payment_amount}</span>
              </p>
            </div>

            <br />
            <h6 style={{ fontWeight: "bold", color: "#333" }}>
              Contact Details
            </h6>
            <hr />
            <div className="d-flex flex-wrap justify-content-between">
              <span className="text-muted">Mobile No: </span>
              <span>+91 {profile.contact}</span>
            </div>
            <div className="d-flex flex-wrap justify-content-between mt-2">
              <span className="text-muted">Email: </span>
              <span>{profile.email}</span>
            </div>
            <div className="d-flex flex-wrap justify-content-between mt-2">
              <span className="text-muted">Address: </span>
              <span>{profile.address}</span>
            </div>
          </div>

          <div className="mt-4 d-flex justify-content-center align-items-center">
            <Button
              variant="primary"
              onClick={() => {
                handleEditProfile();
                handleCloseProfilePopup();
              }}
              style={{ marginRight: "10px" }}
            >
              Edit Profile
            </Button>
            <Button variant="secondary" onClick={handleCloseProfilePopup}>
              Close
            </Button>
          </div>
        </Modal.Body>
      </Modal>
      <Modal show={showEditProfile} onHide={handleCloseEditProfile} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <h4 className="mt-3" style={{ fontWeight: "bold", color: "#333" }}>
            Edit Your Profile
          </h4>
          <form className="mt-4 text-start">
            <div className="form-group text-left">
              <label style={{ fontWeight: "bold" }}>Name</label>
              <input
                type="text"
                className="form-control"
                name="dairy_name"
                placeholder="Enter your name"
                value={profile.dairy_name} // ✅ Controlled input
                onChange={handleChange} // ✅ Updating state
              />
            </div>
            <div className="form-group text-left mt-3">
              <label style={{ fontWeight: "bold" }}>Mobile No</label>
              <input
                type="text"
                className="form-control"
                name="contact"
                placeholder="Enter mobile number"
                value={profile.contact} // ✅ Controlled input
                onChange={handleChange}
              />
            </div>
            <div className="form-group text-left mt-3">
              <label style={{ fontWeight: "bold" }}>Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                placeholder="Enter email"
                value={profile.email} // ✅ Controlled input
                onChange={handleChange}
              />
            </div>
            <div className="form-group text-left mt-3">
              <label style={{ fontWeight: "bold" }}>Address</label>
              <input
                type="text"
                className="form-control"
                name="address"
                placeholder="Enter address"
                value={profile.address} // ✅ Controlled input
                onChange={handleChange}
              />
            </div>
            <div className="mt-4 d-flex justify-content-center">
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                style={{ marginRight: "10px" }}
              >
                Save Changes
              </Button>
              <Button variant="secondary" onClick={handleCloseEditProfile}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default WindowHeader;
