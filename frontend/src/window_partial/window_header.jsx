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
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
import GoogleTranslateV2 from "../components/GoogleTranslateV2";

function WindowHeader({ dashboardText }) {
  const location = useLocation();
  const [username, setUsername] = useState("");
  // const username = getUsernameFromCookie();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customerListOpen, setCustomerListOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [farmerOpen, setFarmerOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [showMilkDistributionModal, setShowMilkDistributionModal] = useState(false);
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

  const toggleRegistration = () => {
    setRegistrationOpen((prevOpen) => !prevOpen);
  };

  const toggleFarmer = () => {
    setFarmerOpen((prevOpen) => !prevOpen);
  };

  const toggleDaily = () => {
    setDailyOpen((prevOpen) => !prevOpen);
  };

  // Ensure the correct dropdown is open based on current route
  useEffect(() => {
    const path = location.pathname || "";

    const isRegistrationRoute =
      path.startsWith("/farmer-registration") ||
      path.startsWith("/delivery-boy-registration");

    const isCustomerRoute =
      path.startsWith("/customer-morning") ||
      path.startsWith("/customer-evening") ||
      path.startsWith("/payment-history") ||
      path.startsWith("/admin-customer-list");

    const isFarmerRoute =
      path.startsWith("/farmer-list") ||
      path.startsWith("/farmer-order-history") ||
      path.startsWith("/farmer-payment-history");

    const isDailyRoute =
      path.startsWith("/delivery-boy-list") || path.startsWith("/daily-report");

    setRegistrationOpen(isRegistrationRoute);
    setCustomerListOpen(isCustomerRoute);
    setFarmerOpen(isFarmerRoute);
    setDailyOpen(isDailyRoute);
  }, [location.pathname]);

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

  const fetchMilkDistribution = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/milk-distribution", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data && response.data.data) {
        setMilkDistribution(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching milk distribution:", error);
      toast.error("Failed to fetch milk distribution data");
    }
  };

  const openMilkDistributionModal = () => {
    setShowMilkDistributionModal(true);
    fetchMilkDistribution(); // Fetch milk distribution data when modal opens
  };

  const closeMilkDistributionModal = () => {
    setShowMilkDistributionModal(false);
    setSelectedDeliveryBoy("");
    setSelectedShift("");
    setDistributionFormData({
      morning: {
        pure_quantity: "",
        cow_quantity: "",
        buffalo_quantity: "",
      },
      evening: {
        pure_quantity: "",
        cow_quantity: "",
        buffalo_quantity: "",
      },
    });
  };

  const handleDeliveryBoyChange = (e) => {
    const deliveryBoyId = e.target.value;
    setSelectedDeliveryBoy(deliveryBoyId);
    
    // Reset shift selection when delivery boy changes
    setSelectedShift("");
    
    // Find the selected delivery boy's data
    const selectedData = milkDistribution.find(
      (dist) => dist.delivery_boy_id === parseInt(deliveryBoyId)
    );
    
    if (selectedData) {
      setDistributionFormData({
        morning: {
          pure_quantity: selectedData.today?.morning?.pure_quantity || "",
          cow_quantity: selectedData.today?.morning?.cow_quantity || "",
          buffalo_quantity: selectedData.today?.morning?.buffalo_quantity || "",
        },
        evening: {
          pure_quantity: selectedData.today?.evening?.pure_quantity || "",
          cow_quantity: selectedData.today?.evening?.cow_quantity || "",
          buffalo_quantity: selectedData.today?.evening?.buffalo_quantity || "",
        },
      });
    } else {
      setDistributionFormData({
        morning: {
          pure_quantity: "",
          cow_quantity: "",
          buffalo_quantity: "",
        },
        evening: {
          pure_quantity: "",
          cow_quantity: "",
          buffalo_quantity: "",
        },
      });
    }
  };

  const handleShiftRadioChange = (shift) => {
    setSelectedShift(shift);
  };

  const handleDistributionInputChange = (e, shift) => {
    const { name, value } = e.target;
    const selectedShift = shift || e.target.dataset.shift || "morning"; // Get shift from parameter or data attribute
    
    setDistributionFormData({
      ...distributionFormData,
      [selectedShift]: {
        ...distributionFormData[selectedShift],
        [name]: value,
      },
    });
  };

  const handleSubmitDistribution = async (shift) => {
    if (!selectedDeliveryBoy) {
      toast.error("Please select a delivery boy");
      return;
    }

    const formData = distributionFormData[shift];
    if (!formData.pure_quantity && !formData.cow_quantity && !formData.buffalo_quantity) {
      toast.error(`Please enter at least one milk quantity for ${shift} shift`);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "/api/admin/milk-distribution",
        {
          delivery_boy_id: parseInt(selectedDeliveryBoy),
          shift: shift,
          pure_quantity: formData.pure_quantity || 0,
          cow_quantity: formData.cow_quantity || 0,
          buffalo_quantity: formData.buffalo_quantity || 0,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        toast.success(`${shift.charAt(0).toUpperCase() + shift.slice(1)} shift milk distribution updated successfully`);
        fetchMilkDistribution(); // Refresh data
      }
    } catch (error) {
      console.error("Error updating milk distribution:", error);
      toast.error(error.response?.data?.message || "Failed to update milk distribution");
    }
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

  // State for milk distribution
  const [milkDistribution, setMilkDistribution] = useState([]);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("");
  const [selectedShift, setSelectedShift] = useState(""); // Radio button: "morning" or "evening" or ""
  const [distributionFormData, setDistributionFormData] = useState({
    morning: {
      pure_quantity: "",
      cow_quantity: "",
      buffalo_quantity: "",
    },
    evening: {
      pure_quantity: "",
      cow_quantity: "",
      buffalo_quantity: "",
    },
  });

  // Get selected delivery boy's data
  const selectedDeliveryBoyData = milkDistribution.find(
    (dist) => dist.delivery_boy_id === parseInt(selectedDeliveryBoy)
  );

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
              to="/manage-customer-notification"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Manage Customer Notification
            </NavLink>
          </li>
          <li>
            <a
              href="#"
              className="sidebar-link"
              onClick={(e) => {
                e.preventDefault();
                toggleRegistration();
              }}
            >
              Registration
              <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </a>
            {registrationOpen && (
              <ul className="sub-menu">
                <li>
                  <NavLink
                    to="/farmer-registration"
                    className={({ isActive }) => (isActive ? "active" : "inactive")}
                    onClick={() => handleSubMenuClick("farmer")}
                  >
                    Farmer Registration
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/delivery-boy-registration"
                    className={({ isActive }) => (isActive ? "active" : "inactive")}
                    onClick={() => handleSubMenuClick("deliveryBoy")}
                  >
                    Delivery Boy Registration
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Customer Group */}
          <li>
            <a
              href="#"
              className="sidebar-link"
              onClick={(e) => {
                e.preventDefault();
                toggleCustomerList();
              }}
            >
              Customer
              <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </a>
            {customerListOpen && (
              <ul className="sub-menu">
                <li>
                  <NavLink
                    to="/admin-customer-list"
                    className={({ isActive }) => (isActive ? "active" : "inactive")}
                  >
                    Customer List
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/customer-morning"
                    className={({ isActive }) => (isActive ? "active" : "inactive")}
                  >
                    Morning
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/customer-evening"
                    className={({ isActive }) => (isActive ? "active" : "inactive")}
                  >
                    Evening
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/payment-history"
                    className={({ isActive }) => (isActive ? "active" : "inactive")}
                  >
                    Payment History
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Farmer Group */}
          <li>
            <a
              href="#"
              className="sidebar-link"
              onClick={(e) => {
                e.preventDefault();
                toggleFarmer();
              }}
            >
              Farmer
              <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </a>
            {farmerOpen && (
              <ul className="sub-menu">
                <li>
                  <NavLink
                    to="/farmer-list"
                    className={({ isActive }) => (isActive ? "active" : "inactive")}
                  >
                    Farmer List
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/farmer-order-history"
                    className={({ isActive }) => (isActive ? "active" : "inactive")}
                  >
                    Farmer Milk Summary
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/farmer-payment-history"
                    className={({ isActive }) => (isActive ? "active" : "inactive")}
                  >
                    Farmer Payment History
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Daily Report Group */}
          <li>
            <a
              href="#"
              className="sidebar-link"
              onClick={(e) => {
                e.preventDefault();
                toggleDaily();
              }}
            >
              Daily Report
              <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </a>
            {dailyOpen && (
              <ul className="sub-menu">
                <li>
                  <NavLink
                    to="/delivery-boy-list"
                    className={({ isActive }) => (isActive ? "active" : "inactive")}
                  >
                    Delivery Boy List
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/daily-report"
                    className={({ isActive }) => (isActive ? "active" : "inactive")}
                  >
                    Daily Report
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
        </ul>
        {/* Sidebar Logout button commented as per request */}
        {/*
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
        */}
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
              style={{ position: "relative", left: "5px", display: "flex", alignItems: "center", gap: "15px" }}
            >
              {/* Google Translate Widget */}
              <GoogleTranslateV2 />
              
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
                <NavDropdown.Item
                  onClick={openMilkDistributionModal}
                  style={{ fontSize: "12px" }}
                >
                  Milk Distribution
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
          <Modal.Title className="responsive-modal-title">
            Add Customer Milk Rates
          </Modal.Title>
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
          <Modal.Title className="responsive-modal-title">
            Add Farmer Milk Rates
          </Modal.Title>
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

      {/* Milk Distribution Modal */}
      <Modal show={showMilkDistributionModal} onHide={closeMilkDistributionModal} className="mt-4">
        <Modal.Header className="modal_header" closeButton>
          <Modal.Title className="responsive-modal-title">
            Milk Distribution
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Select Delivery Boy */}
          <p>
            Select Delivery Boy<span style={{ color: "red", paddingLeft: "4px" }}>*</span>
            <select
              className="rate_input"
              value={selectedDeliveryBoy}
              onChange={handleDeliveryBoyChange}
              style={{ width: "100%", marginTop: "5px" }}
              required
            >
              <option value="">Select Delivery Boy</option>
              {milkDistribution.map((dist) => (
                <option key={dist.delivery_boy_id} value={dist.delivery_boy_id}>
                  {dist.delivery_boy_name} ({dist.delivery_boy_email})
                </option>
              ))}
            </select>
          </p>

          {/* Show Yesterday's Total Milk Given (Read-only) */}
          {selectedDeliveryBoyData && (
            <>
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "15px",
                  borderRadius: "5px",
                  marginBottom: "20px",
                  marginTop: "20px",
                  border: "1px solid #dee2e6",
                }}
              >
                <h6
                  style={{
                    marginBottom: "15px",
                    fontWeight: "bold",
                    color: "#333",
                    fontSize: "16px",
                  }}
                >
                  Yesterday's Total Milk Given:
                </h6>
                
                {/* Total (Combined Morning + Evening) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginLeft: "10px" }}>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    <strong>Pure Milk:</strong> {(
                      parseFloat(selectedDeliveryBoyData.yesterday?.morning?.pure_quantity || 0) +
                      parseFloat(selectedDeliveryBoyData.yesterday?.evening?.pure_quantity || 0)
                    ).toFixed(2)} ltr
                  </p>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    <strong>Cow Milk:</strong> {(
                      parseFloat(selectedDeliveryBoyData.yesterday?.morning?.cow_quantity || 0) +
                      parseFloat(selectedDeliveryBoyData.yesterday?.evening?.cow_quantity || 0)
                    ).toFixed(2)} ltr
                  </p>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    <strong>Buffalo Milk:</strong> {(
                      parseFloat(selectedDeliveryBoyData.yesterday?.morning?.buffalo_quantity || 0) +
                      parseFloat(selectedDeliveryBoyData.yesterday?.evening?.buffalo_quantity || 0)
                    ).toFixed(2)} ltr
                  </p>
                  <p style={{ margin: 0, fontSize: "14px", marginTop: "8px", fontWeight: "bold" }}>
                    <strong>Grand Total:</strong> {(
                      parseFloat(selectedDeliveryBoyData.yesterday?.morning?.pure_quantity || 0) +
                      parseFloat(selectedDeliveryBoyData.yesterday?.morning?.cow_quantity || 0) +
                      parseFloat(selectedDeliveryBoyData.yesterday?.morning?.buffalo_quantity || 0) +
                      parseFloat(selectedDeliveryBoyData.yesterday?.evening?.pure_quantity || 0) +
                      parseFloat(selectedDeliveryBoyData.yesterday?.evening?.cow_quantity || 0) +
                      parseFloat(selectedDeliveryBoyData.yesterday?.evening?.buffalo_quantity || 0)
                    ).toFixed(2)} ltr
                  </p>
                </div>
              </div>

              {/* Shift Selection Radio Buttons */}
              <div style={{ marginBottom: "20px" }}>
                <h6 style={{ marginBottom: "10px", fontWeight: "bold", fontSize: "15px" }}>
                  Select Shift to Update:<span style={{ color: "red", paddingLeft: "4px" }}>*</span>
                </h6>
                <div style={{ display: "flex", gap: "20px", marginLeft: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="shiftSelection"
                      value="morning"
                      checked={selectedShift === "morning"}
                      onChange={(e) => handleShiftRadioChange(e.target.value)}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>Morning</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="shiftSelection"
                      value="evening"
                      checked={selectedShift === "evening"}
                      onChange={(e) => handleShiftRadioChange(e.target.value)}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>Evening</span>
                  </label>
                </div>
              </div>

              <hr style={{ marginBottom: "20px" }} />
            </>
          )}

          {/* Today's Milk Input Fields - Show only if shift is selected */}
          {selectedDeliveryBoyData && selectedShift === "morning" && (
            <>
              <h6 style={{ marginBottom: "10px", fontWeight: "bold", color: "#333", fontSize: "16px", marginTop: "10px" }}>
                Today's Milk Distribution - Morning Shift:
              </h6>
              <p>
                Pure Milk<span style={{ color: "red", paddingLeft: "4px" }}>*</span>
                <input
                  type="number"
                  step="0.01"
                  className="rate_input"
                  name="pure_quantity"
                  data-shift="morning"
                  value={distributionFormData.morning.pure_quantity}
                  onChange={(e) => handleDistributionInputChange(e, "morning")}
                  placeholder={`Current: ${selectedDeliveryBoyData?.today?.morning?.pure_quantity || 0} - Enter New Quantity`}
                  required
                />
                <span style={{ paddingLeft: "4px" }}>/ ltr</span>
              </p>
              <p>
                Cow Milk<span style={{ color: "red", paddingLeft: "4px" }}>*</span>
                <input
                  type="number"
                  step="0.01"
                  className="rate_input"
                  name="cow_quantity"
                  data-shift="morning"
                  value={distributionFormData.morning.cow_quantity}
                  onChange={(e) => handleDistributionInputChange(e, "morning")}
                  placeholder={`Current: ${selectedDeliveryBoyData?.today?.morning?.cow_quantity || 0} - Enter New Quantity`}
                  required
                />
                <span style={{ paddingLeft: "4px" }}>/ ltr</span>
              </p>
              <p>
                Buffalo Milk<span style={{ color: "red", paddingLeft: "4px" }}>*</span>
                <input
                  type="number"
                  step="0.01"
                  className="rate_input"
                  name="buffalo_quantity"
                  data-shift="morning"
                  value={distributionFormData.morning.buffalo_quantity}
                  onChange={(e) => handleDistributionInputChange(e, "morning")}
                  placeholder={`Current: ${selectedDeliveryBoyData?.today?.morning?.buffalo_quantity || 0} - Enter New Quantity`}
                  required
                />
                <span style={{ paddingLeft: "4px" }}>/ ltr</span>
              </p>
              <Button 
                className="close_btn" 
                onClick={() => handleSubmitDistribution("morning")}
                style={{ marginTop: "10px", marginBottom: "20px" }}
              >
                Update Morning Shift
              </Button>
            </>
          )}

          {/* Today's Milk Input Fields - Evening Shift */}
          {selectedDeliveryBoyData && selectedShift === "evening" && (
            <>
              <h6 style={{ marginBottom: "10px", fontWeight: "bold", color: "#333", fontSize: "16px", marginTop: "10px" }}>
                Today's Milk Distribution - Evening Shift:
              </h6>
              <p>
                Pure Milk<span style={{ color: "red", paddingLeft: "4px" }}>*</span>
                <input
                  type="number"
                  step="0.01"
                  className="rate_input"
                  name="pure_quantity"
                  data-shift="evening"
                  value={distributionFormData.evening.pure_quantity}
                  onChange={(e) => handleDistributionInputChange(e, "evening")}
                  placeholder={`Current: ${selectedDeliveryBoyData?.today?.evening?.pure_quantity || 0} - Enter New Quantity`}
                  required
                />
                <span style={{ paddingLeft: "4px" }}>/ ltr</span>
              </p>
              <p>
                Cow Milk<span style={{ color: "red", paddingLeft: "4px" }}>*</span>
                <input
                  type="number"
                  step="0.01"
                  className="rate_input"
                  name="cow_quantity"
                  data-shift="evening"
                  value={distributionFormData.evening.cow_quantity}
                  onChange={(e) => handleDistributionInputChange(e, "evening")}
                  placeholder={`Current: ${selectedDeliveryBoyData?.today?.evening?.cow_quantity || 0} - Enter New Quantity`}
                  required
                />
                <span style={{ paddingLeft: "4px" }}>/ ltr</span>
              </p>
              <p>
                Buffalo Milk<span style={{ color: "red", paddingLeft: "4px" }}>*</span>
                <input
                  type="number"
                  step="0.01"
                  className="rate_input"
                  name="buffalo_quantity"
                  data-shift="evening"
                  value={distributionFormData.evening.buffalo_quantity}
                  onChange={(e) => handleDistributionInputChange(e, "evening")}
                  placeholder={`Current: ${selectedDeliveryBoyData?.today?.evening?.buffalo_quantity || 0} - Enter New Quantity`}
                  required
                />
                <span style={{ paddingLeft: "4px" }}>/ ltr</span>
              </p>
              <Button 
                className="close_btn" 
                onClick={() => handleSubmitDistribution("evening")}
                style={{ marginTop: "10px" }}
              >
                Update Evening Shift
              </Button>
            </>
          )}

          {/* Show message if no shift is selected */}
          {selectedDeliveryBoyData && !selectedShift && (
            <div style={{ 
              padding: "15px", 
              backgroundColor: "#fff3cd", 
              border: "1px solid #ffc107", 
              borderRadius: "5px",
              marginTop: "20px",
              textAlign: "center"
            }}>
              <p style={{ margin: 0, color: "#856404", fontSize: "14px" }}>
                Please select a shift (Morning or Evening) to update milk distribution.
              </p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default WindowHeader;
