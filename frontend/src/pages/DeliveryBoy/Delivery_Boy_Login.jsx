import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import logo from "/mauli_logo.png";
import Card from "react-bootstrap/Card";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Delivery_Boy_Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [shift, setShift] = useState("");

  const handleStartDelivery = () => {
    const state = location.state;
    if (state && state.onLogin) {
      state.onLogin();
    }
    if (shift === "morning") {
      navigate("/delivery-boy-morning");
    } else if (shift === "evening") {
      navigate("/delivery-boy-evening");
    } else {
      toast.error("Please select a shift");
    }
  };

  const handleShiftChange = (event) => {
    setShift(event.target.value);
  };

  const [currentTime, setCurrentTime] = useState("");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      setCurrentTime(timeString);
    };

    updateCurrentTime(); // Initialize the current time immediately
    const intervalId = setInterval(updateCurrentTime, 1000); // Update time every second

    return () => clearInterval(intervalId); // Clean up interval on component unmount
  }, []);

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
      <div
        className="container-fluid"
        style={{
          backgroundColor: "#EF6E0B",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div className="inner-section">
          <div className="row">
            <div className="col-12">
              <img src={logo} alt="Logo" className="main_logo_mauli" />
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <Card style={{ margin: "8px" }}>
                <Card.Body>
                  <Card.Title style={{ fontSize: "16px" }}>
                    Date: {today}
                    <span style={{ float: "right" }}>Time: {currentTime}</span>
                  </Card.Title>
                  <Card.Text className="mt-4">
                    <p>Select milk delivery shift :</p>
                    <input
                      type="radio"
                      name="shift"
                      value="morning"
                      id="morning"
                      onChange={handleShiftChange}
                    />
                    &nbsp;<label htmlFor="morning">Morning shift</label>{" "}
                    &nbsp;&nbsp;
                    <input
                      type="radio"
                      name="shift"
                      value="evening"
                      id="evening"
                      onChange={handleShiftChange}
                    />
                    &nbsp; <label htmlFor="evening">Evening shift</label>
                    <button
                      type="submit"
                      className="mt-4"
                      style={{
                        backgroundColor: "black",
                        color: "white",
                        padding: "10px",
                        textAlign: "center",
                        width: "100%",
                        borderRadius: "20px",
                      }}
                      onClick={handleStartDelivery}
                    >
                      Start Milk Delivery
                    </button>
                  </Card.Text>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Delivery_Boy_Login;
