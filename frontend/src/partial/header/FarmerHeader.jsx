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
import "./Farmer_Header.css";
import logo from "/mauli_logo.png";
import "./Farmer.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

function WindowHeader({ dashboardText }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [activeSubMenu, setActiveSubMenu] = useState("");

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

  const getUsernameFromCookie = () => {
    const cookieValue = Cookies.get("Mauli-Dairy");
    if (cookieValue) {
      const userData = JSON.parse(cookieValue);
      return userData.name;
    }
    return "";
  };
  const username = getUsernameFromCookie();

  const toggleSidebar = () => {
    setSidebarOpen((prevOpen) => !prevOpen);
  };

  const handleSubMenuClick = (menu) => {
    setActiveSubMenu(menu);
  };

  const handleClose = () => {
    Cookies.remove("Mauli-Dairy", { path: "/" });
    navigate("/");
  };

  const closeModal = () => {
    setShowModal(false);
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
        transition:Bounce
      />
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>

        <ul className="sidebar-nav">
          <li>
            <NavLink
              to="/farmer/todays-orders"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Todays Orders
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/farmer/daily-order-history"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Daily Order History
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/farmer/payment-history"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Payment History
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
              style={{ position: "relative", left: "-15px" }}
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
    </div>
  );
}

export default WindowHeader;
