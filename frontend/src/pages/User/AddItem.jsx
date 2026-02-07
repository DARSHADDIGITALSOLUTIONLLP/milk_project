import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AddItem.css";
import Userheader from "../../partial/header/Userheader";
import { Col, Container, Row } from "react-bootstrap";
import axios from "axios";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddItem = () => {
  const [purequantity, setPureQuantity] = useState(0);
  const [cowquantity, setCowQuantity] = useState(0);
  const [buffaloquantity, setBuffaloQuantity] = useState(0);
  const [rates, setRates] = useState({
    cow: "",
    buffalo: "",
    pure: "",
  });
  const [date, setDate] = useState("");
  const [shift, setShift] = useState("");
  const getRates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/user/getAllRates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRates({
        cow: response.data.cow_rate,
        buffalo: response.data.buffalo_rate,
        pure: response.data.pure_rate,
      });
    } catch (error) {
      console.error("Error fetching rates:", error);
    }
  };

  useEffect(() => {
    getRates();
  }, []);

  const handleOrder = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    // Form the quantity array in [pure, cow, buffalo] order
    const quantity = [purequantity, cowquantity, buffaloquantity];

    if (!date || !shift ) {
      toast.error("Please select both date and shift.");
      return;
    }

    try {
      const response = await axios.post(
        "/api/user/additional_Order",
        {
          date,
          shift,
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Replace with real token
          },
        }
      );
      setDate("");
      setShift("");
      setPureQuantity(0);
      setCowQuantity(0);
      setBuffaloQuantity(0);
      toast.success(response.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error placing order");
    }
  };

  const incrementPureQty = () => setPureQuantity((prev) => prev + 0.25);
  const decrementPureQty = () =>
    setPureQuantity((prev) => (prev > 0 ? prev - 0.25 : prev));
  const getPureDisplay = () =>
    purequantity < 1 ? `${purequantity * 1000} ml` : `${purequantity} ltr`;

  const incrementCowQty = () => setCowQuantity((prev) => prev + 0.25);
  const decrementCowQty = () =>
    setCowQuantity((prev) => (prev > 0 ? prev - 0.25 : prev));
  const getCowDisplay = () =>
    cowquantity < 1 ? `${cowquantity * 1000} ml` : `${cowquantity} ltr`;

  const incrementBuffaloQty = () => setBuffaloQuantity((prev) => prev + 0.25);
  const decrementBuffaloQty = () =>
    setBuffaloQuantity((prev) => (prev > 0 ? prev - 0.25 : prev));

  const getBuffaloDisplay = () =>
    buffaloquantity < 1
      ? `${buffaloquantity * 1000} ml`
      : `${buffaloquantity} ltr`;

  return (
    <>
      <Userheader></Userheader>
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

      <Container>
        <Link to="/user-dashboard" className="back-link">
          ← Back
        </Link>
        <Row className="mt-3 mb-3" style={{ flexWrap: "wrap" }}>
          <Col lg={6} md={12} className="mt-2">
            <section className="add-item-section">
              <div className="title-row">
                <p>Add item</p>
                <p>Product details</p>
              </div>
              <hr />

              <div className="milk-category">
                <div>
                  <p className="category-title">Pure milk</p>
                </div>
                <div className="item-card-container">
                  <div className="item-card">
                    <div className="item-image">
                      <img src="/milk.png" alt="Pure Milk" />
                    </div>
                    <div className="item-info">
                      <div>
                        <p className="item-title">Pure milk</p>
                        <p className="item-subtitle">
                          {getPureDisplay()} &nbsp;&nbsp; MRP :{" "}
                          <span className="item-price">
                            {(purequantity * rates.pure).toFixed(2)}
                          </span>
                        </p>
                      </div>
                      <div className="quantity-selector">
                        <span className="qty-btn" onClick={decrementPureQty}>
                          -
                        </span>
                        <span className="qty-number">{purequantity}</span>
                        <span className="qty-btn" onClick={incrementPureQty}>
                          +
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* <div className="item-card">
                    <div className="item-image">
                      <img src="/milk.png" alt="Pure Milk" />
                    </div>
                    <div className="item-info">
                      <div>
                        <p className="item-title">Pure milk</p>
                        <p className="item-subtitle">
                          1000 ml&nbsp;&nbsp; MRP :{" "}
                          <span className="item-price">70.00</span>
                        </p>
                      </div>
                      <div className="quantity-selector">
                        <span className="qty-btn" onClick={decrementQty}>-</span>
                        <span className="qty-number">1</span>
                        <span className="qty-btn" onClick={incrementQty}>+</span>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>

              <div className="milk-category">
                <div>
                  <p className="category-title">Cow milk</p>
                </div>
                <div className="item-card-container">
                  <div className="item-card">
                    <div className="item-image">
                      <img src="/milk.png" alt="Pure Milk" />
                    </div>
                    <div className="item-info">
                      <div>
                        <p className="item-title">Cow milk</p>
                        <p className="item-subtitle">
                          {getCowDisplay()} &nbsp;&nbsp; MRP :{" "}
                          <span className="item-price">
                            {(cowquantity * rates.cow).toFixed(2)}
                          </span>
                        </p>
                      </div>
                      <div className="quantity-selector">
                        <span className="qty-btn" onClick={decrementCowQty}>
                          -
                        </span>
                        <span className="qty-number">{cowquantity}</span>
                        <span className="qty-btn" onClick={incrementCowQty}>
                          +
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* <div className="item-card">
                    <div className="item-image">
                      <img src="/milk.png" alt="Pure Milk" />
                    </div>
                    <div className="item-info">
                      <div>
                        <p className="item-title">Cow milk</p>
                        <p className="item-subtitle">
                          1000 ml&nbsp;&nbsp; MRP :{" "}
                          <span className="item-price">70.00</span>
                        </p>
                      </div>
                      <div className="quantity-selector">
                        <span className="qty-btn">-</span>
                        <span className="qty-number">1</span>
                        <span className="qty-btn">+</span>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>

              <div className="milk-category">
                <div>
                  <p className="category-title">Buffalo milk</p>
                </div>
                <div className="item-card-container">
                  <div className="item-card">
                    <div className="item-image">
                      <img src="/milk.png" alt="Pure Milk" />
                    </div>
                    <div className="item-info">
                      <div>
                        <p className="item-title">Buffalo milk</p>
                        <p className="item-subtitle">
                          {getBuffaloDisplay()} &nbsp;&nbsp; MRP :{" "}
                          <span className="item-price">
                            {(buffaloquantity * rates.buffalo).toFixed(2)}
                          </span>
                        </p>
                      </div>
                      <div className="quantity-selector">
                        <span className="qty-btn" onClick={decrementBuffaloQty}>
                          -
                        </span>
                        <span className="qty-number">{buffaloquantity}</span>
                        <span className="qty-btn" onClick={incrementBuffaloQty}>
                          +
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* 
                  <div className="item-card">
                    <div className="item-image">
                      <img src="/milk.png" alt="Pure Milk" />
                    </div>
                    <div className="item-info">
                      <div>
                        <p className="item-title">Buffalo milk</p>
                        <p className="item-subtitle">
                          1000 ml&nbsp;&nbsp; MRP :{" "}
                          <span className="item-price">70.00</span>
                        </p>
                      </div>
                      <div className="quantity-selector">
                        <span className="qty-btn">-</span>
                        <span className="qty-number">1</span>
                        <span className="qty-btn">+</span>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </section>
          </Col>

          <Col lg={6} md={12} className="mt-2">
            <aside className="summary-panel">
              <p style={{ color: "#FF6600", fontSize: "25px" }}>
                Product details
              </p>
              <p>Only subscribed users can add additional order</p>
              <hr />
              <div>
                <div className="summary-item">
                  <span>Pure milk</span>
                  <span>Rs {rates.pure}</span>
                </div>
                <small>
                  {getPureDisplay()} MRP :{" "}
                  {(purequantity * rates.pure).toFixed(2)}
                </small>
              </div>
              <div>
                <div className="summary-item">
                  <span>Cow milk</span>
                  <span>Rs {rates.cow}</span>
                </div>
                <small>
                  {getCowDisplay()} ml MRP :{" "}
                  {(cowquantity * rates.cow).toFixed(2)}
                </small>
              </div>
              <div>
                <div className="summary-item">
                  <span>Buffalo milk</span>
                  <span>Rs {rates.buffalo}</span>
                </div>
                <small>
                  {getBuffaloDisplay()} ml MRP :{" "}
                  {(buffaloquantity * rates.buffalo).toFixed(2)}
                </small>
              </div>
              <hr />
              <div className="total">
                <span>Total Amount</span>
                <span>
                  Rs{" "}
                  {(
                    purequantity * rates.pure +
                    cowquantity * rates.cow +
                    buffaloquantity * rates.buffalo
                  ).toFixed(2)}
                </span>
              </div>
              <form className="order-info">
                <label>
                  Select your date
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <div className="shift-select">
                  <span>Select shift</span>
                  <label>
                    <input
                      type="radio"
                      name="shift"
                      value="morning"
                      checked={shift === "morning"}
                      onChange={(e) => setShift(e.target.value)}
                    />{" "}
                    Morning
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="shift"
                      value="evening"
                      checked={shift === "evening"}
                      onChange={(e) => setShift(e.target.value)}
                    />{" "}
                    Evening
                  </label>
                </div>
                <button className="order-btn" onClick={handleOrder}>
                  Place order
                </button>
              </form>
            </aside>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AddItem;
