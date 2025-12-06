import React from "react";
import "./Register.css";
import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  InputGroup,
  Form,
  Modal,
  Card,
} from "react-bootstrap";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import mauli_logo from "/mauli_logo.png";

function Register() {
  const [activeForm, setActiveForm] = useState("customer");
  const [selectedDairy, setSelectedDairy] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toggleBtnMarginTop, setToggleBtnMarginTop] = useState("2rem");
  const [backBtnMarginTop, setBackBtnMarginTop] = useState("443px");
  const [error, setError] = useState("");
  const [dairyList, setDairyList] = useState([]);
  const navigate = useNavigate();
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPass, setConfirmPass] = useState("");

  const VITE_ENCRYPTION_RAZORPAY_KEY = import.meta.env
    .VITE_ENCRYPTION_RAZORPAY_KEY;

  // Helper function to calculate GST (18%)
  const calculateGST = (amount) => {
    return Math.round(amount * 0.18);
  };

  // Helper function to calculate total (subtotal + GST)
  const calculateTotal = (subtotal) => {
    return subtotal + calculateGST(subtotal);
  };

  // Helper function to format price breakdown (Subtotal + GST = Total)
  const formatPriceBreakdown = (subtotal) => {
    const gst = calculateGST(subtotal);
    const total = calculateTotal(subtotal);
    return {
      subtotal,
      gst,
      total,
      display: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#666" }}>
            Subtotal: ₹{subtotal}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            GST (18%): ₹{gst}
          </div>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#000", marginTop: "5px" }}>
            Total: ₹{total}
          </div>
        </div>
      )
    };
  };

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;

      if (activeForm === "customer") {
        // Desktop: minimal margin
        setToggleBtnMarginTop("2rem");
        if (screenWidth <= 245) {
          setToggleBtnMarginTop("60rem");
        } else if (screenWidth <= 380) {
          setToggleBtnMarginTop("53rem");
        } else if (screenWidth <= 480) {
          setToggleBtnMarginTop("50rem");
        } else if (screenWidth <= 768) {
          setToggleBtnMarginTop("50rem");
        }
      } else if (activeForm === "dairy") {
        // Desktop: minimal margin
        setToggleBtnMarginTop("2rem");
        if (screenWidth <= 320) {
          setToggleBtnMarginTop("35rem");
        } else if (screenWidth <= 480) {
          setToggleBtnMarginTop("30rem");
        } else if (screenWidth <= 768) {
          setToggleBtnMarginTop("28rem");
        }
      } else {
        setToggleBtnMarginTop("2rem");
      }
    };

    handleResize(); // Set margin when component mounts
    window.addEventListener("resize", handleResize); // Adjust on resize

    return () => window.removeEventListener("resize", handleResize); // Cleanup
  }, [activeForm]);

  useEffect(() => {
    axios
      .get("/api/admin/dairylist")
      .then((response) => {
        setDairyList(response.data.Dairy);
      })
      .catch((error) => {
        console.error("Error fetching dairy list:", error);
        toast.error("Failed to fetch dairy list.");
      });
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };
  const [DairyValues, setDairyValues] = useState({
    dairyName: "",
    ownerName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    email: "",
    contactNumber: "",
    gstNumber: "",
    licenseNumber: "",
    password: "",
  });

  const handleShiftChange = (e) => {
    const { value, checked } = e.target;
    let updatedShifts = [...CustomerValues.shift];

    if (checked) {
      updatedShifts.push(Number(value));
    } else {
      updatedShifts = updatedShifts.filter((shift) => shift !== Number(value));
    }

    setCustomerValues({ ...CustomerValues, shift: updatedShifts });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const [CustomerValues, setCustomerValues] = useState({
    name: "",
    address: "",
    email: "",
    contactNumber: "",
    password: "",
    selectdairy: "",
    selectmilk: "",
    quantity: 0.5,
    shift: [],
  });

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const [formValues, setFormValues] = useState({
    name: "",
    address: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    dairyName: "",
    contactNumber: "",
  });

  const handleFormToggle = (formType) => {
    setActiveForm(formType);
    setFormValues({
      name: "",
      address: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      dairyName: "",
      contactNumber: "",
    });
    setDairyValues({
      dairyName: "",
      ownerName: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      email: "",
      contactNumber: "",
      gstNumber: "",
      licenseNumber: "",
      password: "",
    });
    setCustomerValues({
      selectdairy: "",
      name: "",
      address: "",
      email: "",
      contactNumber: "",
      password: "",
      selectmilk: "",
      quantity: "",
      shift: [],
    });
  };

  const [quantity, setQuantity] = useState(500);

  const handleQuantityChange = (type) => {
    setQuantity((prevQty) => {
      const newQty =
        type === "increment" ? prevQty + 250 : Math.max(500, prevQty - 250);
      setCustomerValues((prev) => ({ ...prev, quantity: newQty / 1000 }));
      return newQty;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      CustomerValues.password.length < 6 ||
      CustomerValues.password.length > 10
    ) {
      toast.error("Password length must be between 6 and 10 characters.");
      return;
    }

    if (CustomerValues.password !== confirmPass) {
      toast.error("Confirm Password does not match with password.");
      return;
    }

    if (activeForm === "customer") {
      const dairy_name = CustomerValues.selectdairy;
      const name = CustomerValues.name;
      const address = CustomerValues.address;
      const email = CustomerValues.email;
      const contact = CustomerValues.contactNumber;
      const password_hash = CustomerValues.password;
      const milk_type = CustomerValues.selectmilk;
      const quantity = CustomerValues.quantity;
      const shift = CustomerValues.shift;
      // const startDate = new Date();
      // startDate.setDate(startDate.getDate() + 1);

      axios
        .post("/api/user/register", {
          dairy_name,
          name,
          address,
          email,
          contact,
          password_hash,
          milk_type,
          quantity,
          // start_date:startDate,
          shift,
        })
        .then((res) => {
          setCustomerValues({
            name: "",
            address: "",
            email: "",
            contactNumber: "",
            password: "",
            selectdairy: "",
            selectmilk: "",
            quantity: 500,
            shift: [],
          });

          setQuantity(500);
          setFormValues({
            confirmPassword: "",
          });
          setConfirmPass("");
          setSelectedDairy("");
          toast.success("Customer Account Created Successfully!");
        })
        .catch((err) => {
          console.log(err);

          if (err.response && err.response.data && err.response.data.message) {
            const errorMessage = err.response.data.message;

            if (
              errorMessage === "Email is already registered as an admin" ||
              errorMessage === "Email already in use"
            ) {
              toast.error(
                "Email already exists. Please use a different email."
              );
            } else if (
              errorMessage ===
              "Contact number is already registered as an admin"
            ) {
              toast.error("Contact number is already registered as an admin.");
            } else {
              toast.error(errorMessage);
            }
          } else {
            toast.error("Failed to create customer account.");
          }
        });
    }
  };

  const handleDairySubmit = (event) => {
    event.preventDefault();
    // setShowPaymentModal(true);
  };

  const renderCustomerForm = () => (
    <Form className="customer-form" onSubmit={handleSubmit}>
      <p className="h4 text-center mb-4">Customer Registration</p>
      <Form.Group className="mb-3" controlId="formFullName">
        <Form.Label>
          Full name <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={CustomerValues.name}
          placeholder="Please enter full name"
          onChange={(e) =>
            setCustomerValues({ ...CustomerValues, name: e.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formAddress">
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
            setCustomerValues({ ...CustomerValues, address: e.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formEmail">
        <Form.Label>
          Email Id <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={CustomerValues.email}
          placeholder="Please enter your email"
          onChange={(e) =>
            setCustomerValues({ ...CustomerValues, email: e.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formMobile">
        <Form.Label>
          Mobile <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <Form.Control
          type="text"
          name="mobile"
          value={CustomerValues.contactNumber}
          placeholder="Please enter your mobile number"
          pattern="[0-9]{10}"
          maxLength="10"
          title="Mobile number must be 10 digits"
          onChange={(e) =>
            setCustomerValues({
              ...CustomerValues,
              contactNumber: e.target.value,
            })
          }
          required
        />
      </Form.Group>
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
              setCustomerValues({ ...CustomerValues, password: e.target.value })
            }
            required
          />
          <span className="password-toggle" onClick={togglePasswordVisibility}>
            {showPassword ? <EyeSlashFill /> : <EyeFill />}
          </span>
        </div>
      </Form.Group>
      <Form.Group className="mb-3" controlId="formConfirmPassword">
        <Form.Label>
          Confirm Password <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <div className="password-input">
          <Form.Control
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm your password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            required
          />
          <span
            className="password-toggle"
            onClick={toggleConfirmPasswordVisibility}
            style={{ cursor: "pointer" }} // Added cursor style for better UX
          >
            {showConfirmPassword ? <EyeSlashFill /> : <EyeFill />}
          </span>
        </div>
      </Form.Group>
      <Form.Group className="mb-3" controlId="formDairySelect">
        <Form.Label>
          Select Dairy <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <Form.Select
          value={CustomerValues.selectdairy}
          onChange={(e) =>
            setCustomerValues({
              ...CustomerValues,
              selectdairy: e.target.value,
            })
          }
          name="dairySelect"
          style={{ border: "1px solid black" }}
          required
        >
          <option value="">Select a dairy </option>
          {Array.isArray(dairyList) &&
            dairyList.map((dairy, index) => (
              <option key={index} value={dairy.dairy_name}>
                {dairy.dairy_name}
              </option>
            ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="formMilkSelect">
        <Form.Label>
          Select Milk type <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <Form.Select
          value={CustomerValues.selectmilk}
          onChange={(e) =>
            setCustomerValues({ ...CustomerValues, selectmilk: e.target.value })
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

      <Form.Group
        className="mb-3"
        style={{
          padding: "10px",
        }}
      >
        <Form.Label className="me-3 mb-0">
          Milk Quantity<span style={{ color: "red" }}>*</span>
        </Form.Label>
        <InputGroup style={{ flex: "1", maxWidth: "200px" }}>
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
              // maxWidth: "60px",
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
            style={{ fontWeight: "600", color: "#333", whiteSpace: "nowrap" }}
          >
            {quantity >= 1000
              ? `${(quantity / 1000).toFixed(2)} ltr`
              : `${quantity} ML`}
          </Form.Label>
        </InputGroup>
      </Form.Group>

      <Form.Group className="mb-3" controlId="formShift">
        <Form.Label>
          Select Shift <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <div
          className="shift-checkboxes"
          style={{
            display: "flex",
            gap: "20px",
            padding: "10px",
            borderRadius: "5px",
            alignItems: "center",
            flexWrap: "nowrap",
          }}
        >
          <Form.Check
            type="checkbox"
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

      <div className="text-center">
        {/* <Link to="/user-dashboard" style={{ textDecoration:'none'}}> */}
        <Button
          className="rl-btn mt-2 mb-1"
          variant="outline-dark"
          type="submit"
          style={{ width: "50%", backgroundColor: "black", color: "white" }}
        >
          Create Account
        </Button>
        {/* <p>
          If Already account is created then go to <Link to="/">Login</Link>
        </p> */}
        {/* </Link> */}
      </div>
    </Form>
  );

  const checkUser = async () => {
    try {
      const response = await axios.post("/api/admin/checkUser", {
        dairy_name: DairyValues.dairyName,
        email: DairyValues.email,
        contact: DairyValues.contactNumber,
        password_hash: DairyValues.password,
        address: DairyValues.address,
      });

      if (DairyValues.password !== formValues.confirmPassword) {
        toast.error("Confirm Password do not match with Password.");
        return;
      }

      if (DairyValues.password.length < 6 || DairyValues.password.length > 10) {
        toast.error("Password must be between 6 to 10 characters.");
        return;
      }

      // Since axios doesn't use response.ok, we check the status like this:
      if (response.status !== 200) {
        toast.error(response.data.message);
        return;
      }

      setShowPaymentModal(true);
    } catch (error) {
      console.error("Error during registration:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(error.response.data.message); // Display API error message
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  const renderDairyForm = () => (
    <Form onSubmit={handleDairySubmit}>
      <p className="h4 text-center mb-4">Dairy Registration</p>
      <Form.Group className="mb-3" controlId="formDairyName">
        <Form.Label>
          Dairy Name <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <Form.Control
          type="text"
          name="dairyName"
          placeholder="Please enter dairy name"
          value={DairyValues.dairyName}
          onChange={(e) =>
            setDairyValues({ ...DairyValues, dairyName: e.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formAddress">
        <Form.Label>
          Address <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <Form.Control
          type="text"
          name="address"
          placeholder="Please enter dairy address"
          maxLength="100"
          value={DairyValues.address}
          onChange={(e) =>
            setDairyValues({ ...DairyValues, address: e.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formEmail">
        <Form.Label>
          Email Id <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <Form.Control
          type="email"
          name="email"
          placeholder="Please enter dairy email"
          value={DairyValues.email}
          onChange={(e) =>
            setDairyValues({ ...DairyValues, email: e.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formContactNumber">
        <Form.Label>
          Contact Number <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <Form.Control
          type="text"
          name="contactNumber"
          placeholder="Please enter dairy contact number"
          pattern="[0-9]{10}"
          maxLength="10"
          title="Contact number must be 10 digits"
          value={DairyValues.contactNumber}
          onChange={(e) =>
            setDairyValues({ ...DairyValues, contactNumber: e.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formPassword">
        <Form.Label>
          Create Password <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <div className="password-input">
          <Form.Control
            type={showPassword ? "text" : "password"}
            name="password"
            maxLength="10"
            minLength="6"
            placeholder="Please enter your Password"
            value={DairyValues.password}
            onChange={(e) =>
              setDairyValues({ ...DairyValues, password: e.target.value })
            }
            required
          />
          <span className="password-toggle" onClick={togglePasswordVisibility}>
            {showPassword ? <EyeSlashFill /> : <EyeFill />}
          </span>
        </div>
      </Form.Group>
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
      <div className="text-center">
        <Button
          className="rl-btn mt-2 mb-1"
          variant="outline-dark"
          type="submit"
          onClick={checkUser}
          style={{ width: "50%", backgroundColor: "black", color: "white" }}
        >
          Make Payment
        </Button>
        <p>
          If Already account is created then go to <Link to="/">Login</Link>
        </p>
      </div>
      {error && <div className="text-center text-danger mt-2">{error}</div>}
    </Form>
  );

  async function checkout(totalAmount, periods) {
    try {
      // Calculate subtotal from total (reverse calculation)
      // total = subtotal + (subtotal * 0.18)
      // total = subtotal * 1.18
      // subtotal = total / 1.18
      const subtotal = Math.round(totalAmount / 1.18);
      const gst = totalAmount - subtotal;

      console.log("💰 Payment breakdown:", {
        subtotal: subtotal,
        gst: gst,
        total: totalAmount,
        period: periods
      });

      const {
        data: { order },
      } = await axios.post("api/admin/usermakepayment", {
        amount: totalAmount, // Send total amount (subtotal + GST) to backend
      });
      const name = DairyValues.dairyName;
      const address = DairyValues.address;
      const email = DairyValues.email;
      const contact = DairyValues.contactNumber;
      const hash = DairyValues.password;

      const options = {
        key: VITE_ENCRYPTION_RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "Mauli Dairy",
        description: "Subscription Payment",
        image: "/mauli_logo.png",
        order_id: order.id,
        callback_url: "/api/admin/paymentVerification",
        prefill: {
          name: name,
          email: email,
          contact: contact,
        },
        notes: {
          dairy_name: name,
          contact: contact,
          email: email,
          address: address,
          password_hash: hash,
          periods: periods,
          amount: totalAmount, // Total amount (subtotal + GST)
          subtotal: subtotal, // Subtotal for reference
          gst: gst, // GST amount for reference
        },
        theme: {
          color: "#000000",
        },
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className="login-container">
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
      <Container fluid>
        <Row className="login-row">
          <Col md="6" className="image-col" tabIndex={-1}>
            <div 
              className="image-wrapper"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onFocus={(e) => e.target.blur()}
            >
              <img 
                src={mauli_logo} 
                className="img-fluid" 
                alt="mauli_logo"
                tabIndex={-1}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onFocus={(e) => e.target.blur()}
              />
            </div>
          </Col>
          <Col md="6" className="form-col">
            <Container>
              <Row>
                <Col md="12">
                  <div
                    className="text-center mb-4 toggle_btn"
                    style={{ marginTop: toggleBtnMarginTop }}
                  >
                    <div style={{ marginRight: "100rem" }}>
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            marginRight: "5px",
                            color: "#FF6600",
                          }}
                        >
                          ←
                        </span>
                        <Link
                          to="/"
                          style={{
                            color: "#FF6600",
                            textDecoration: "none",
                          }}
                        >
                          Back
                        </Link>
                      </button>
                    </div>
                    <Button
                      className="toggle-btn mx-2"
                      style={{
                        width: "40%",
                        color: "white",
                        backgroundColor: "black",
                      }}
                      variant={
                        activeForm === "customer" ? "info" : "outline-info"
                      }
                      onClick={() => handleFormToggle("customer")}
                    >
                      Customer
                    </Button>
                    <Button
                      className="toggle-btn"
                      style={{
                        width: "40%",
                        color: "white",
                        backgroundColor: "black",
                      }}
                      variant={activeForm === "dairy" ? "info" : "outline-info"}
                      onClick={() => handleFormToggle("dairy")}
                    >
                      Dairy
                    </Button>
                  </div>
                  {activeForm === "customer"
                    ? renderCustomerForm()
                    : renderDairyForm()}
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>

      <Modal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        size="xl"
      >
        <Modal.Header closeButton>Subscription Plan</Modal.Header>
        <Modal.Body>
          <Container>
            <Row>
              <Col xs={12} sm={6} md={6} lg={3} xl={3} className="mb-3">
                <Card
                  style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px" }}
                  className="subscription_card"
                >
                  <Card.Body>
                    <center>
                      <Card.Title className="card_title">Basic</Card.Title>
                    </center>
                    <center>
                      <h5 className="price mb-2">{formatPriceBreakdown(299).display}</h5>
                    </center>
                    <Card.Text>
                      <div style={{ textAlign: "center" }}>
                        <p>
                          <p>(30 days)</p>
                        </p>
                      </div>
                    </Card.Text>
                    <center>
                      <Button
                        className="mt-4 pay_btn"
                        style={{
                          width: "100%",
                          backgroundColor: "black",
                          color: "white",
                          border: "none",
                        }}
                        onClick={() => checkout(calculateTotal(299), "monthly")}
                      >
                        Pay Now
                      </Button>
                    </center>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} sm={6} md={6} lg={3} className="mb-3">
                <Card
                  style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px" }}
                  className="subscription_card"
                >
                  <Card.Body>
                    <center>
                      <Card.Title className="card_title">Plus</Card.Title>
                    </center>
                    <center>
                      <h5 className="price mb-2">{formatPriceBreakdown(499).display}</h5>
                    </center>
                    <Card.Text>
                      <div style={{ textAlign: "center" }}>
                        <p>
                          <p>(90 days)</p>
                        </p>
                      </div>
                    </Card.Text>
                    <center>
                      <Button
                        className="mt-4 pay_btn"
                        style={{
                          width: "100%",
                          backgroundColor: "black",
                          color: "white",
                          border: "none",
                        }}
                        onClick={() => checkout(calculateTotal(499), "quarterly")}
                      >
                        Pay Now
                      </Button>
                    </center>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} sm={6} md={6} lg={3} className="mb-3">
                <Card
                  style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px" }}
                  className="subscription_card"
                >
                  <Card.Body>
                    <center>
                      <Card.Title className="card_title">Gold</Card.Title>
                    </center>
                    <center>
                      <h5 className="price mb-2">{formatPriceBreakdown(799).display}</h5>
                    </center>
                    <Card.Text>
                      <div style={{ textAlign: "center" }}>
                        <p>
                          <p>(180 days)</p>
                        </p>
                      </div>
                    </Card.Text>
                    <center>
                      <Button
                        className="mt-4 pay_btn"
                        style={{
                          width: "100%",
                          backgroundColor: "black",
                          color: "white",
                          border: "none",
                        }}
                        onClick={() => checkout(calculateTotal(799), "half-yearly")}
                      >
                        Pay Now
                      </Button>
                    </center>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} sm={6} md={6} lg={3} className="mb-3">
                <Card
                  style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px" }}
                  className="subscription_card"
                >
                  <Card.Body>
                    <center>
                      <Card.Title className="card_title">Platinum</Card.Title>
                    </center>
                    <center>
                      <h5 className="price mb-2">{formatPriceBreakdown(1499).display}</h5>
                    </center>
                    <Card.Text>
                      <div style={{ textAlign: "center" }}>
                        <p>
                          <p>(365 days)</p>
                        </p>
                      </div>
                    </Card.Text>
                    <center>
                      <Button
                        className="mt-4 pay_btn"
                        style={{
                          width: "100%",
                          backgroundColor: "black",
                          color: "white",
                          border: "none",
                        }}
                        onClick={() => checkout(calculateTotal(1499), "yearly")}
                      >
                        Pay Now
                      </Button>
                    </center>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Register;
