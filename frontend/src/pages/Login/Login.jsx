import { useEffect, useState } from "react";
import { Container, Row, Col, Button, Form, Modal } from "react-bootstrap";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";
import mauli_logo from "/mauli_logo.png";
import "./Login.css";
import Swal from "sweetalert2";
import { Link, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VITE_ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

function Login() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [otp, setOTP] = useState(null);
  const [timerCount, setTimer] = useState(60);
  const [OTPinput, setOTPinput] = useState(["", "", "", ""]);
  const [disable, setDisable] = useState(true);
  const [forgot, setForgot] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token"); // or check cookie

    if (token) {
      localStorage.removeItem("token"); // or call backend to clear cookie
      Cookies.remove("Mauli-Dairy", { path: "/" });
      }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post("/api/resetPass", {
        email,
        newpassword: newPassword,
        confirmpass: confirmPassword,
      });

      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong!");
    }
  };
  const openForgotPass = () => {
    setForgot(true);
  };

  const closeForgotPass = () => {
    setForgot(false);
  };
  function sendOtp() {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    if (disable) {
      const generatedOTP = Math.floor(Math.random() * 9000 + 1000);
      // console.log(generatedOTP);
      setOTP(generatedOTP);

      axios
        .post("/api/send_recovery_email", {
          OTP: generatedOTP,
          recipient_email: email,
        })
        .then(() => {
          toast.success("OTP sent successfully!");
          setDisable(true);
          setOTPinput(["", "", "", ""]);
          startTimer();
        })
        .catch(console.log);
    }
  }

  function resendOTP() {
    if (disable) return;
    axios
      .post("/api/send_recovery_email", {
        OTP: otp,
        recipient_email: email,
      })
      .then(() => {
        toast.success("A new OTP has been sent to your email.");
        setDisable(true);
        setOTPinput(["", "", "", ""]);
        startTimer();
      })
      .catch(console.log);
  }

  function verifyOTP() {
    if (parseInt(OTPinput.join("")) === otp) {
      toast.success("OTP Verified Successfully!");
      // window.location.href = "/forgotpass";
      openForgotPass();
      return;
    }
    toast.error("Incorrect OTP, please try again or resend OTP");
  }

  function startTimer() {
    setTimer(60);
    setDisable(true);
    let interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setDisable(false);
        }
        return prev - 1;
      });
    }, 1000);
  }

  const handleClose = () => {
    setShow(false);
    setEmail("");
    setPassword("");
    setEmailError("");
  };

  const handleOpen = () => {
    setShow(true);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("/api/login", {
        identifier: identifier,
        password_hash: password,
      });

      const { role, token, user } = response.data;
      localStorage.setItem("token", token);
      const encryptedRole = CryptoJS.AES.encrypt(
        role,
        VITE_ENCRYPTION_KEY
      ).toString();

      let cookieValue = {
        token: token,
        role: encryptedRole,
        mobile: user.contact,
        email: user.email,
        id: user.id,
      };

      // Conditionally set the name
      if (role === "admin") {
        cookieValue.name = user.dairy_name;
      } else if (role === "user") {
        cookieValue.name = user.name;
      } else if (role === "super_admin") {
        cookieValue.name = "Superadmin";
      } else if (role === "delivery_boy") {
        cookieValue.name = user.name;
      }else if (role === "farmer") {
        cookieValue.name = user.full_name;
      } else {
        cookieValue.name = "Unknown";
      }

      // Stringify and set the cookie
      Cookies.set("Mauli-Dairy", JSON.stringify(cookieValue), { expires: 7 });

      // Navigation based on role
      switch (role) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "user":
          navigate("/user-dashboard");
          break;
        case "super_admin":
          navigate("/superadmin-dashboard");
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
    }  catch (error) {
      if (
        error.response && 
        error.response.data.message
      ) {
        Swal.fire({
          title: "Access Denied",
          text: error.response.data.message,
          icon: "error",
          confirmButtonText: "OK",
        });
      } else {
        Swal.fire({
          title: "Error",
          text: "Failed to login. Please try again later.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };

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
          <Col md="4" className="image-col">
            <div className="image-wrapper">
              <img src={mauli_logo} className="img-fluid" alt="mauli_logo" />
            </div>
          </Col>
          <Col md="8" className="form-col">
            <Container>
              <Row>
                <Col md="12">
                  <Form className="toggle_btn" onSubmit={handleLogin}>
                    <p className="h4 text-center mb-4">Welcome to Dudh Dairy</p>
                    <p className="h6 text-center mb-4">
                      If you don't have an account, please register here.
                    </p>
                    <div className="text-center mb-4">
                      <Link to={"/register"} className="rl-btn btn btn-dark">
                        Registration
                      </Link>
                    </div>
                    <div className="m-line-div">
                      <div className="line mt-2"></div>
                      <p className="or h5">Or</p>
                      <div className="line mt-2"></div>
                    </div>
                    <div>
                      <p className="h2 text-center mb-4">Login</p>
                    </div>

                    <Form.Group className="mb-3" controlId="formBasicEmail">
                      <Form.Label>Email Address / Mobile</Form.Label>
                      <Form.Control
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Please enter your email address or contact"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-1" controlId="formBasicPassword">
                      <Form.Label>Password</Form.Label>
                      <div className="password-input">
                        <Form.Control
                          // type="text"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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
                    <p className="h6 forgot-password text-end">
                      <a
                        // href="/email-verification"
                        id="forgot_pass"
                        style={{ cursor: "pointer" }}
                        onClick={handleOpen}
                      >
                        Forgot Password
                      </a>
                    </p>
                    <div className="text-center">
                      <Button
                        className="rl-btn"
                        variant="outline-dark"
                        type="submit"
                      >
                        Login
                      </Button>
                    </div>
                  </Form>
                </Col>
              </Row>

              <div className="row mt-4 p-2">
                <div className="col-3"></div>
                <div
                  className="col-md-6 col-sm-12"
                  style={{ backgroundColor: "black", borderRadius: "40px" }}
                >
                  <center>
                    <h6 className="text-light pt-2">
                      <Link
                        to="https://www.dddigitalsolution.com/"
                        style={{ color: "white", textDecoration: "none" }}
                      >
                        Powered By DARSHAND DIGITAL SOLUTION LLP
                      </Link>
                    </h6>
                  </center>
                  
                </div>
                {/* <center>
                    <p>
                      If account is not created then go to{" "}
                      <Link to="/register">Register Account</Link>
                    </p>
                  </center> */}
              </div>
            </Container>
          </Col>
        </Row>
      </Container>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          {/* <Modal.Title>OTP</Modal.Title> */}
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-center align-items-center">
            <div className="" style={{ width: "400px" }}>
              <h3 className="text-center">Email Verification</h3>
              <div className="mb-3">
                <label className="form-label">Enter your email</label>
                <div className="input-group">
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={sendOtp}>
                    Send OTP
                  </button>
                </div>
              </div>

              <div className="mb-3 text-center">
                <label className="form-label">Enter OTP</label>
                <div className="d-flex justify-content-between">
                  {OTPinput.map((_, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      className="form-control text-center mx-1"
                      style={{ width: "50px", height: "50px" }}
                      value={OTPinput[index]}
                      onChange={(e) => {
                        let newOTP = [...OTPinput];
                        newOTP[index] = e.target.value;
                        setOTPinput(newOTP);
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                className="btn btn-success w-100 mb-3"
                onClick={verifyOTP}
              >
                Verify OTP
              </button>

              <div className="text-center">
                <p className="text-muted">
                  Didn't receive the code?{" "}
                  <span
                    style={{
                      color: disable ? "gray" : "blue",
                      cursor: disable ? "not-allowed" : "pointer",
                      textDecoration: disable ? "none" : "underline",
                    }}
                    onClick={resendOTP}
                  >
                    {disable ? `Resend OTP in ${timerCount}s` : "Resend OTP"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={forgot} onHide={closeForgotPass}>
        <Modal.Body>
          <div className=" d-flex justify-content-center align-items-center">
            <div className=" " style={{ maxWidth: "400px", width: "100%" }}>
              <h3 className="text-center mb-3">Reset Password</h3>

              {message && <div className="alert alert-info">{message}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-bold">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label fw-bold">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="confirmPassword"
                    className="form-label fw-bold"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100 fw-bold">
                  Update Password
                </button>
              </form>

              <div className="text-center mt-3">
                <a href="/" className="text-decoration-none">
                  Back to Login
                </a>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Login;
