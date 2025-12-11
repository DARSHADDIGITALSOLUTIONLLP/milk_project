import React, { useState } from "react";
import WindowHeader from "../../window_partial/window_header";
import {
  Container,
  Form,
  Button,
} from "react-bootstrap";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";
import Swal from "sweetalert2";
import "../../window_partial/window.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

function Delivery_Boy_Registration() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmDeliveryPass, setConfirmDeliveryPass] = useState("");
  const navigate = useNavigate();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  React.useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [DeliveryValues, setDeliveryValues] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    password: "",
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleDeliverySubmit = async (event) => {
    event.preventDefault();
    if (
      DeliveryValues.password.length < 6 ||
      DeliveryValues.password.length > 10
    ) {
      toast.error("Password length must be between 6 and 10 characters.");
      return;
    }

    if (DeliveryValues.password !== confirmDeliveryPass) {
      toast.error("Confirm Password does not match with password.");
      return;
    }

    const { name, address, email, contact, password } = DeliveryValues;

    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        "/api/admin/register-delivery-boy",
        {
          name,
          address,
          email,
          contact,
          password_hash: password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Delivery Boy Registered Successfully!",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/admin-dashboard");
        setDeliveryValues({
          name: "",
          address: "",
          email: "",
          contact: "",
          password: "",
        });
        setConfirmDeliveryPass("");
      });
    } catch (err) {
      console.log(err.message);
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to create Delivery Boy account.");
      }
    }
  };

  return (
    <div>
      <WindowHeader dashboardText="Delivery Boy Registration" />
      <div
        style={{
          marginTop: isSmallScreen ? "40px" : "0px",
        }}
      >
        <Container fluid className="main-content mt-0">
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
          <h3 className="heading mt-4">Delivery Boy Registration</h3>

          <Form onSubmit={handleDeliverySubmit}>
            <div className="row mt-4">
              <div className="col-12">
                <Form.Group controlId="Delivery Boy full Name">
                  <Form.Label>
                    Full Name <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={DeliveryValues.name}
                    onChange={(e) =>
                      setDeliveryValues({
                        ...DeliveryValues,
                        name: e.target.value,
                      })
                    }
                    name="fullName"
                    placeholder="Enter Delivery Boy full name"
                    required
                  />
                </Form.Group>
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-12">
                <Form.Group controlId="address">
                  <Form.Label>
                    Address <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    maxLength="30"
                    minLength="0"
                    value={DeliveryValues.address}
                    onChange={(e) =>
                      setDeliveryValues({
                        ...DeliveryValues,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter Delivery Boy full address"
                    name="address"
                    required
                  />
                </Form.Group>
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-12 col-md-6">
                <Form.Group controlId="email">
                  <Form.Label>
                    Email-ID <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={DeliveryValues.email}
                    onChange={(e) =>
                      setDeliveryValues({
                        ...DeliveryValues,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter Delivery Boy email-ID"
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-12 col-md-6">
                <Form.Group controlId="mobileNumber">
                  <Form.Label>
                    Mobile Number <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    maxLength="10"
                    minLength="10"
                    value={DeliveryValues.contact}
                    onChange={(e) =>
                      setDeliveryValues({
                        ...DeliveryValues,
                        contact: e.target.value,
                      })
                    }
                    placeholder="Enter phone no"
                    name="mobileNumber"
                    required
                  />
                </Form.Group>
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-12 col-md-6">
                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>
                    Create Password <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <div className="password-input">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      maxLength="10"
                      value={DeliveryValues.password}
                      onChange={(e) =>
                        setDeliveryValues({
                          ...DeliveryValues,
                          password: e.target.value,
                        })
                      }
                      minLength="6"
                      placeholder="Please enter your Password"
                      required
                    />
                    <span
                      className="password-toggle"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeSlashFill /> : <EyeFill />}
                    </span>
                  </div>
                </Form.Group>
              </div>
              <div className="col-12 col-md-6">
                <Form.Group className="mb-3" controlId="formConfirmPassword">
                  <Form.Label>
                    Confirm Password <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <div className="password-input">
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={confirmDeliveryPass}
                      onChange={(e) => setConfirmDeliveryPass(e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                    <span
                      className="password-toggle"
                      onClick={toggleConfirmPasswordVisibility}
                    >
                      {showConfirmPassword ? <EyeSlashFill /> : <EyeFill />}
                    </span>
                  </div>
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
                    style={{ width: isSmallScreen ? "100%" : "70%" }}
                  >
                    Delivery Boy Register
                  </Button>
                </center>
              </div>
            </div>
          </Form>
        </Container>
      </div>
    </div>
  );
}

export default Delivery_Boy_Registration;

