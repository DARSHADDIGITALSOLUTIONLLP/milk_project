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

function Farmer_Registration() {
  const [showFarmerPassword, setShowFarmerPassword] = useState(false);
  const [showFarmerConfirmPassword, setShowFarmerConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  React.useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [FarmerValues, setFarmerValues] = useState({
    name: "",
    address: "",
    email: "",
    contact: "",
    password: "",
    selectmilk: [],
  });

  const [farmerformValues, setFarmerFormValues] = useState({
    confirmPassword: "",
  });

  const handleMilkChange = (e) => {
    const { value, checked } = e.target;
    const updatedMilk = checked
      ? [...FarmerValues.selectmilk, value]
      : FarmerValues.selectmilk.filter((item) => item !== value);

    setFarmerValues({
      ...FarmerValues,
      selectmilk: updatedMilk,
    });
  };

  const toggleFarmerPasswordVisibility = () => {
    setShowFarmerPassword(!showFarmerPassword);
  };

  const toggleFarmerConfirmPasswordVisibility = () => {
    setShowFarmerConfirmPassword(!showFarmerConfirmPassword);
  };

  const handleFarmerInputChange = (event) => {
    const { name, value } = event.target;
    setFarmerFormValues({
      ...farmerformValues,
      [name]: value,
    });
  };

  const isTokenValid = (token) => {
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  };

  const handleFarmerSubmit = async (e) => {
    e.preventDefault();
    if (
      FarmerValues.password.length < 4 ||
      FarmerValues.password.length > 10
    ) {
      toast.error("Password length must be between 6 and 10 characters.");
      return;
    }

    if (FarmerValues.password !== farmerformValues.confirmPassword) {
      toast.error("Confirm Password does not match with password.");
      return;
    }
    const {
      name,
      address,
      email,
      contact,
      password,
      selectmilk,
    } = FarmerValues;

    const token = localStorage.getItem("token");

    if (!isTokenValid(token)) {
      toast.error("Your session has expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post(
        "/api/admin/farmer_registration",
        {
          full_name: name,
          address,
          email,
          contact,
          password_hash: password,
          milk_types: selectmilk,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Farmer Account Created Successfully!",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/admin-dashboard");
        setFarmerValues({
          name: "",
          address: "",
          email: "",
          contact: "",
          password: "",
          selectmilk: [],
        });
        setFarmerFormValues({
          confirmPassword: "",
        });
      });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to create farmer account.");
      }
    }
  };

  return (
    <div>
      <WindowHeader dashboardText="Farmer Registration" />
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
          <h3 className="heading mt-4">New Farmer Registration</h3>

          <Form onSubmit={handleFarmerSubmit} style={{ marginTop: isSmallScreen ? "1rem" : "0" }}>
            <div className="row" style={{ marginTop: isSmallScreen ? "0.5rem" : "1.5rem" }}>
              <div className="col-12">
                <Form.Group controlId="fullName">
                  <Form.Label>
                    Full Name <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={FarmerValues.name}
                    placeholder="Please enter full name"
                    onChange={(e) =>
                      setFarmerValues({
                        ...FarmerValues,
                        name: e.target.value,
                      })
                    }
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
                    type="text"
                    name="address"
                    value={FarmerValues.address}
                    placeholder="Please enter your address"
                    maxLength="20"
                    onChange={(e) =>
                      setFarmerValues({
                        ...FarmerValues,
                        address: e.target.value,
                      })
                    }
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
                    value={FarmerValues.email}
                    placeholder="Please enter your email"
                    onChange={(e) =>
                      setFarmerValues({
                        ...FarmerValues,
                        email: e.target.value,
                      })
                    }
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
                    name="mobile"
                    value={FarmerValues.contact}
                    placeholder="Please enter your mobile number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    title="Mobile number must be 10 digits"
                    onChange={(e) =>
                      setFarmerValues({
                        ...FarmerValues,
                        contact: e.target.value,
                      })
                    }
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
                      type={showFarmerPassword ? "text" : "password"}
                      name="password"
                      maxLength="10"
                      value={FarmerValues.password}
                      minLength="4"
                      placeholder="Please enter your Password"
                      onChange={(e) =>
                        setFarmerValues({
                          ...FarmerValues,
                          password: e.target.value,
                        })
                      }
                      required
                    />
                    <span
                      className="password-toggle"
                      onClick={toggleFarmerPasswordVisibility}
                    >
                      {showFarmerPassword ? <EyeSlashFill /> : <EyeFill />}
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
                      type={showFarmerConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={farmerformValues.confirmPassword}
                      onChange={handleFarmerInputChange}
                      required
                    />
                    <span
                      className="password-toggle"
                      onClick={toggleFarmerConfirmPasswordVisibility}
                    >
                      {showFarmerConfirmPassword ? (
                        <EyeSlashFill />
                      ) : (
                        <EyeFill />
                      )}
                    </span>
                  </div>
                </Form.Group>
              </div>
            </div>

            <div className="row mt-4">
              <div className="col-12">
                <Form.Group className="mb-3" controlId="formMilkSelect">
                  <Form.Label className="mb-2">
                    Type of Milk <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <div style={{ 
                    display: "flex", 
                    flexDirection: isSmallScreen ? "column" : "row",
                    gap: isSmallScreen ? "10px" : "20px",
                    padding: isSmallScreen ? "5px" : "10px",
                  }}>
                    <Form.Check
                      type="checkbox"
                      label="Pure"
                      value="pure"
                      checked={FarmerValues.selectmilk.includes("pure")}
                      onChange={handleMilkChange}
                      name="milkSelect"
                      style={{
                        display: "flex",
                        alignItems: "center",
                      }}
                      id="milkPure"
                    />

                    <Form.Check
                      type="checkbox"
                      label="Cow"
                      value="cow"
                      checked={FarmerValues.selectmilk.includes("cow")}
                      onChange={handleMilkChange}
                      name="milkSelect"
                      style={{
                        display: "flex",
                        alignItems: "center",
                      }}
                      id="milkCow"
                    />

                    <Form.Check
                      type="checkbox"
                      label="Buffalo"
                      value="buffalo"
                      checked={FarmerValues.selectmilk.includes("buffalo")}
                      onChange={handleMilkChange}
                      name="milkSelect"
                      style={{
                        display: "flex",
                        alignItems: "center",
                      }}
                      id="milkBuffalo"
                    />
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
                    Farmer Register
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

export default Farmer_Registration;

