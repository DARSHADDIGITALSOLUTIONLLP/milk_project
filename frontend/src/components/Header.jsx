import { useState, useEffect } from "react";
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Modal,
  Button,
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
import logo from "/mauli_logo.png";
import "./Header.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

function Header({ dashboardText }) {
  const getUsernameFromCookie = () => {
    const cookieValue = Cookies.get("Mauli-Dairy");
    if (cookieValue) {
      const userData = JSON.parse(cookieValue);
      return userData.name;
    }
    return "";
  };
  const username = getUsernameFromCookie();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

    const handleLogout = (e) => {
      e.preventDefault();
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
          Cookies.remove("Mauli-Dairy", { path: "/" });
          navigate("/"); 
        }
      });
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

  const toggleSidebar = () => {
    setSidebarOpen((prevOpen) => !prevOpen);
  };

  return (
    <div>
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>
        <ul className="sidebar-nav">
          <li>
            <NavLink
              to="/dairy-registration"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dairy-list"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Dairy List
            </NavLink>
          </li>
        </ul>
        <div className="sidebar-bottom">
          <a href="" style={{ color: "white" }} onClick={handleLogout}>
            <FontAwesomeIcon
              icon={faSignOutAlt}
              style={{ marginRight: "8px", marginTop: "20px" }}
            />
            <NavLink className="btnLogout">Logout</NavLink>
          </a>
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
            
            {/* Mobile Header Menu Button */}
            <div 
              className="d-md-none ms-auto me-3 hamburger-icon"
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

            <div className="d-none d-md-flex flex-column flex-md-row align-items-md-center contact-info">
              <p className="mb-0 me-md-3">
                {dashboardText}
                <a
                  href="tel:9822888290"
                  style={{ textDecoration: "none", color: "white" }}
                ></a>
              </p>
            </div>
            <div className="d-none d-md-flex flex-column flex-md-row  contact-info">
              <p className="mb-0 me-md-3">
                Contact Us:{" "}
                <a
                  href="tel:9822888290"
                  className="text-white text-decoration-none"
                >
                  9822888290
                </a>
              </p>
              <p className="mb-0">
                Email-ID:{" "}
                <a
                  href="mailto:mulidairy123@gmail.com"
                  className="text-white text-decoration-none"
                >
                  mulidairy123@gmail.com
                </a>
              </p>
            </div>

            <Nav
              className="ml-auto d-none d-md-block"
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
                alignRight
              >
                <NavDropdown.Item>
                  {" "}
                  <a
                    href=""
                    onClick={handleLogout}
                    style={{ textDecoration: "none" }}
                  >
                    <NavLink style={{ color: "black", textDecoration: "none" }}>
                      Logout
                    </NavLink>
                  </a>
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </div>
        </Container>
      </Navbar>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-container"
          style={{
            position: "fixed",
            top: "56px",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            zIndex: 1060,
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            maxHeight: "calc(100vh - 56px)",
            overflowY: "auto",
            borderTop: "2px solid #007bff",
          }}
        >
          <div style={{ color: "#333" }}>
            {/* Dashboard Text */}
            {dashboardText && (
              <div style={{ marginBottom: "20px", borderBottom: "1px solid #e0e0e0", paddingBottom: "15px" }}>
                <p className="mb-0" style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
                  {dashboardText}
                </p>
              </div>
            )}

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
    </div>
  );
}

export default Header;
