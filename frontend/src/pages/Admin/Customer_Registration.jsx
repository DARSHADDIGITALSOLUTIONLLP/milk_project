import React, { useState } from "react";
import WindowHeader from "../../window_partial/window_header";
import {
  Container,
  Form,
  Button,
  InputGroup,
} from "react-bootstrap";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";
import Swal from "sweetalert2";
import "../../window_partial/window.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

function Customer_Registration() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  React.useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [quantity, setQuantity] = useState(500);

  const handleQuantityChange = (type) => {
    setQuantity((prevQty) => {
      const newQty =
        type === "increment" ? prevQty + 250 : Math.max(500, prevQty - 250);
      setCustomerValues((prev) => ({ ...prev, quantity: newQty / 1000 }));
      return newQty;
    });
  };

  const [CustomerValues, setCustomerValues] = useState({
    name: "",
    address: "",
    email: "",
    contact: "",
    password: "",
    selectmilk: "",
    quantity: 0.5,
    shift: "",
  });

  const [formValues, setFormValues] = useState({
    confirmPassword: "",
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const isTokenValid = (token) => {
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      CustomerValues.password.length < 6 ||
      CustomerValues.password.length > 10
    ) {
      toast.error("Password length must be between 6 and 10 characters.");
      return;
    }

    if (CustomerValues.password !== formValues.confirmPassword) {
      toast.error("Confirm Password does not match with password.");
      return;
    }
    const {
      name,
      address,
      email,
      contact,
      password,
      quantity,
      selectmilk,
      shift,
    } = CustomerValues;

    const token = localStorage.getItem("token");

    if (!isTokenValid(token)) {
      toast.error("Your session has expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post(
        "/api/admin/add-user",
        {
          name,
          address,
          email,
          contact,
          password_hash: password,
          milk_type: selectmilk,
          quantity,
          shift,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Customer Account Created Successfully!",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/admin-dashboard");
        setCustomerValues({
          name: "",
          address: "",
          email: "",
          contact: "",
          password: "",
          selectmilk: "",
          quantity: 500,
          shift: "",
        });
        setFormValues({
          confirmPassword: "",
        });
      });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to create customer account.");
      }
    }
  };

  return (
    <div>
      <WindowHeader dashboardText="Customer Registration" />
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
          <h3 className="heading mt-4">New Customer Registration</h3>

          <Form onSubmit={handleSubmit} style={{ marginTop: isSmallScreen ? "1rem" : "0" }}>
            <div className="row" style={{ marginTop: isSmallScreen ? "0.5rem" : "1.5rem" }}>
              <div className="col-12">
                <Form.Group controlId="fullName">
                  <Form.Label>
                    Full Name <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={CustomerValues.name}
                    placeholder="Please enter full name"
                    onChange={(e) =>
                      setCustomerValues({
                        ...CustomerValues,
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
                    value={CustomerValues.address}
                    placeholder="Please enter your address"
                    maxLength="20"
                    onChange={(e) =>
                      setCustomerValues({
                        ...CustomerValues,
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
                    value={CustomerValues.email}
                    placeholder="Please enter your email"
                    onChange={(e) =>
                      setCustomerValues({
                        ...CustomerValues,
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
                    value={CustomerValues.contact}
                    placeholder="Please enter your mobile number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    title="Mobile number must be 10 digits"
                    onChange={(e) =>
                      setCustomerValues({
                        ...CustomerValues,
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
                      type={showPassword ? "text" : "password"}
                      name="password"
                      maxLength="10"
                      value={CustomerValues.password}
                      minLength="6"
                      placeholder="Please enter your Password"
                      onChange={(e) =>
                        setCustomerValues({
                          ...CustomerValues,
                          password: e.target.value,
                        })
                      }
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
                      placeholder="Confirm your password"
                      value={formValues.confirmPassword}
                      onChange={handleInputChange}
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

            <div className="row" style={{ marginTop: isSmallScreen ? "0.5rem" : "1.5rem" }}>
              <div className="col-12 col-md-6">
                <Form.Group className="mb-3" controlId="formMilkSelect">
                  <Form.Label>
                    Select Milk type <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Select
                    value={CustomerValues.selectmilk}
                    onChange={(e) =>
                      setCustomerValues({
                        ...CustomerValues,
                        selectmilk: e.target.value,
                      })
                    }
                    name="milkSelect"
                    style={{ border: "1px solid black" }}
                    required
                  >
                    <option value="">Select Milk Type</option>
                    <option value="buffalo">Buffalo</option>
                    <option value="cow">Cow</option>
                    <option value="pure">Pure</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-12 col-md-6">
                <Form.Group
                  className="mb-3"
                  style={{
                    padding: isSmallScreen ? "5px" : "10px",
                  }}
                >
                  <Form.Label className="me-3 mb-2">
                    Milk Quantity<span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <InputGroup style={{ flex: "1", maxWidth: isSmallScreen ? "100%" : "200px", width: isSmallScreen ? "100%" : "auto" }}>
                    <Button
                      variant="outline-primary"
                      onClick={() => handleQuantityChange("decrement")}
                      style={{
                        borderRadius: "8px",
                        fontSize: "16px",
                        padding: "5px 10px",
                      }}
                    >
                      -
                    </Button>
                    <Form.Control
                      type="text"
                      value={quantity}
                      readOnly
                      style={{
                        textAlign: "center",
                        fontWeight: "600",
                        border: "none",
                      }}
                    />
                    <Button
                      variant="outline-primary"
                      onClick={() => handleQuantityChange("increment")}
                      style={{
                        borderRadius: "8px",
                        fontSize: "16px",
                        padding: "5px 10px",
                      }}
                    >
                      +
                    </Button>
                    <Form.Label
                      className="ms-2 mb-0 mt-2"
                      style={{
                        fontWeight: "600",
                        color: "#333",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {quantity >= 1000
                        ? `${(quantity / 1000).toFixed(2)} ltr`
                        : `${quantity} ML`}
                    </Form.Label>
                  </InputGroup>
                </Form.Group>
              </div>
            </div>

            <div className="row mt-4">
              <div className="col-12">
                <Form.Group className="mb-3" controlId="formShift">
                  <Form.Label>
                    Select Shift <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <div
                    style={{
                      display: "flex",
                      gap: isSmallScreen ? "15px" : "20px",
                      padding: isSmallScreen ? "5px" : "10px",
                      borderRadius: "5px",
                      alignItems: "center",
                      flexWrap: isSmallScreen ? "nowrap" : "wrap",
                    }}
                  >
                    <Form.Check
                      type="checkbox"
                      id="formShiftMorning"
                      label="Morning"
                      value="morning"
                      checked={
                        CustomerValues.shift === "morning" ||
                        CustomerValues.shift === "both"
                      }
                      onChange={(e) => {
                        const { checked } = e.target;
                        let shiftValue;

                        if (checked && CustomerValues.shift === "evening") {
                          shiftValue = "both";
                        } else if (checked) {
                          shiftValue = "morning";
                        } else if (CustomerValues.shift === "both") {
                          shiftValue = "evening";
                        } else {
                          shiftValue = "";
                        }

                        setCustomerValues({
                          ...CustomerValues,
                          shift: shiftValue,
                        });
                      }}
                    />
                    <Form.Check
                      type="checkbox"
                      id="formShiftEvening"
                      label="Evening"
                      value="evening"
                      checked={
                        CustomerValues.shift === "evening" ||
                        CustomerValues.shift === "both"
                      }
                      onChange={(e) => {
                        const { checked } = e.target;
                        let shiftValue;

                        if (checked && CustomerValues.shift === "morning") {
                          shiftValue = "both";
                        } else if (checked) {
                          shiftValue = "evening";
                        } else if (CustomerValues.shift === "both") {
                          shiftValue = "morning";
                        } else {
                          shiftValue = "";
                        }

                        setCustomerValues({
                          ...CustomerValues,
                          shift: shiftValue,
                        });
                      }}
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
                    Customer Register
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

export default Customer_Registration;

