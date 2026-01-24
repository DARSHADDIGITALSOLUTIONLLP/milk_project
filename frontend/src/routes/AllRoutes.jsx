import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Dairy_Register from "../pages/SuperAdmin/Dairy_Register";
import Dashboard from "../pages/SuperAdmin/Dashboard";
import Dairy_List from "../pages/SuperAdmin/Dairy_List";
import Manage_Subscription_Plans from "../pages/SuperAdmin/Manage_Subscription_Plans";
import User_Dashboard from "../pages/User/User_Dashboard";
import AddItem from "../pages/User/AddItem";
import Admin_Dashboard from "../pages/Admin/Admin_Dashboard";
import Manage_Customer_Notification from "../pages/Admin/Manage_Customer_Notification";
import Admin_Customer_List from "../pages/Admin/Admin_Customer_List";
import Additional_Orders from "../pages/Admin/Additional_Orders";
import Customer_Morning from "../pages/Admin/Customer_Morning";
import Customer_Evening from "../pages/Admin/Customer_Evening";
import Farmer_List from "../pages/Admin/Farmer_List";
import Todays_Order from "../pages/Farmer/Todays_Order";
import Farmer_Payment_History from "../pages/Farmer/Payment_History";
import Payment_History from "../pages/Admin/Payment_History";
import Farmer_Order_History from "../pages/Admin/Farmer_Order_History";
import Admin_Farmer_Payment_History from "../pages/Admin/Farmer_Payment_History";
import Delivery_Boy_List from "../pages/Admin/Delivery_Boy_List";
import Daily_Report from "../pages/Admin/Daily_Report";
import Farmer_Registration from "../pages/Admin/Farmer_Registration";
import Delivery_Boy_Registration from "../pages/Admin/Delivery_Boy_Registration";
import Delivery_Boy_Login from "../pages/DeliveryBoy/Delivery_Boy_Login";
import Delivery_Boy_Morning from "../pages/DeliveryBoy/Delivery_Boy_Morning";
import Delivery_Boy_Evening from "../pages/DeliveryBoy/Delivery_Boy_Evening";
import Daily_Order_History from "../pages/Farmer/Daily_Order_History";
import RedirectToDashboard from "../components/RedirectToDashboard";

const VITE_ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

// Check if user is logged in
export function isLoggedIn() {
  const cookieValue = Cookies.get("Mauli-Dairy");
  if (cookieValue) {
    const userData = JSON.parse(cookieValue);
    return !!userData.token;
  }
  return false;
}

// Get user role from encrypted cookie
export function getUserRole() {
  const cookieValue = Cookies.get("Mauli-Dairy");
  if (cookieValue) {
    const userData = JSON.parse(cookieValue);
    const bytes = CryptoJS.AES.decrypt(userData.role, VITE_ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  return null;
}

// Role-based navigation
export const RoleBasedRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = getUserRole();
    if (isLoggedIn()) {
      switch (role) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "user":
          navigate("/user-dashboard");
          break;
        case "super_admin":
          navigate("/dairy-registration");
          break;
        case "delivery_boy":
          navigate("/delivery-boy-login");
          break;
        case "farmer":
          navigate("/farmer/todays-orders");
          break;
        default:
          Swal.fire({
            title: "Error",
            text: "Unauthorized role!",
            icon: "error",
            confirmButtonText: "OK",
          });
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  return null;
};

// Route for a single role
const UserRoleRoute = ({ role, component }) => {
  const userRole = getUserRole();
  const isLoggedInUser = isLoggedIn();
  if (!isLoggedInUser) {
    return <Navigate to="/" />;
  }
  if (userRole !== role) {
    return <Navigate to="/" />;
  }
  return component;
};

// Route for multiple roles
const MultiRoleRoute = ({ roles, component }) => {
  const userRole = getUserRole();
  const isLoggedInUser = isLoggedIn();
  if (!isLoggedInUser) {
    return <Navigate to="/" />;
  }
  if (!roles.includes(userRole)) {
    return <Navigate to="/" />;
  }
  return component;
};

// All Routes
function AllRoutes() {
  return (
    <Routes>
      {/* Login/Register */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Check Admin Logged In */}
      <Route path="/check-admin" element={<RedirectToDashboard />} />

      {/* Superadmin */}
      <Route
        path="/superadmin-dashboard"
        element={<UserRoleRoute role="super_admin" component={<Dashboard />} />}
      />
      <Route
        path="/dairy-registration"
        element={
          <UserRoleRoute role="super_admin" component={<Dairy_Register />} />
        }
      />
      <Route
        path="/dairy-list"
        element={
          <UserRoleRoute role="super_admin" component={<Dairy_List />} />
        }
      />
      <Route
        path="/manage-subscription-plans"
        element={
          <UserRoleRoute role="super_admin" component={<Manage_Subscription_Plans />} />
        }
      />

      {/* User Pages */}
      <Route
        path="/user-dashboard"
        element={<UserRoleRoute role="user" component={<User_Dashboard />} />}
      />
      <Route
        path="/user/add-item"
        element={<UserRoleRoute role="user" component={<AddItem />} />}
      />

      {/* Farmer Routes */}
      <Route
        path="/farmer/todays-orders"
        element={<UserRoleRoute role="farmer" component={<Todays_Order />} />}
      />
      <Route
        path="/farmer/daily-order-history"
        element={
          <UserRoleRoute role="farmer" component={<Daily_Order_History />} />
        }
      />
      <Route
        path="/farmer/payment-history"
        element={
          <UserRoleRoute role="farmer" component={<Farmer_Payment_History />} />
        }
      />

      {/* Admin Pages */}
      <Route
        path="/admin-dashboard"
        element={<UserRoleRoute role="admin" component={<Admin_Dashboard />} />}
      />
      <Route
        path="/manage-customer-notification"
        element={
          <UserRoleRoute
            role="admin"
            component={<Manage_Customer_Notification />}
          />
        }
      />
      <Route
        path="/admin-customer-list"
        element={
          <UserRoleRoute role="admin" component={<Admin_Customer_List />} />
        }
      />
      <Route
        path="/customer-morning"
        element={
          <UserRoleRoute role="admin" component={<Customer_Morning />} />
        }
      />
      <Route
        path="/customer-evening"
        element={
          <UserRoleRoute role="admin" component={<Customer_Evening />} />
        }
      />
      <Route
        path="/delivery-boy-list"
        element={
          <UserRoleRoute role="admin" component={<Delivery_Boy_List />} />
        }
      />
      <Route
        path="/daily-report"
        element={
          <UserRoleRoute role="admin" component={<Daily_Report />} />
        }
      />
      <Route
        path="/payment-history"
        element={<UserRoleRoute role="admin" component={<Payment_History />} />}
      />
      <Route
        path="/additional-orders"
        element={
          <UserRoleRoute role="admin" component={<Additional_Orders />} />
        }
      />
      <Route
        path="/farmer-list"
        element={<UserRoleRoute role="admin" component={<Farmer_List />} />}
      />
      <Route
        path="/farmer-payment-history"
        element={
          <UserRoleRoute
            role="admin"
            component={<Admin_Farmer_Payment_History />}
          />
        }
      />
      <Route
        path="/farmer-order-history"
        element={
          <UserRoleRoute role="admin" component={<Farmer_Order_History />} />
        }
      />
      <Route
        path="/farmer-registration"
        element={
          <UserRoleRoute role="admin" component={<Farmer_Registration />} />
        }
      />
      <Route
        path="/delivery-boy-registration"
        element={
          <UserRoleRoute role="admin" component={<Delivery_Boy_Registration />} />
        }
      />

      {/* Delivery Boy Pages */}
      <Route
        path="/delivery-boy-login"
        element={
          <MultiRoleRoute
            roles={["admin", "delivery_boy"]}
            component={<Delivery_Boy_Login />}
          />
        }
      />
      <Route
        path="/delivery-boy-morning"
        element={
          <MultiRoleRoute
            roles={["admin", "delivery_boy"]}
            component={<Delivery_Boy_Morning />}
          />
        }
      />
      <Route
        path="/delivery-boy-evening"
        element={
          <MultiRoleRoute
            roles={["admin", "delivery_boy"]}
            component={<Delivery_Boy_Evening />}
          />
        }
      />

      {/* Redirect all unknown routes to login */}
      {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
    </Routes>
  );
}

export default AllRoutes;
