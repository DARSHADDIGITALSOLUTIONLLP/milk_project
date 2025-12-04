import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Card from "react-bootstrap/Card";
import footer_img from "/delivery-photo.png";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import useSwipe from "../../utils/useSwipe";
import { LiaBackwardSolid } from "react-icons/lia";
import Swal from "sweetalert2";
import { MdArrowDropDown, MdArrowDropUp } from "react-icons/md";
import { IoMdArrowDropright } from "react-icons/io";
import "../User/User_Dashboard.css";

function Delivery_Boy_Morning() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentCustomerIndex, setCurrentCustomerIndex] = useState(0);
  const [date, setDate] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [activeMonth, setActiveMonth] = useState(new Date());
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [todayMilkQuantity, setTodayMilkQuantity] = useState(0); // Quantity to be delivered today

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  // const handleAdditionalIncrementRemain = (type) => {
  //   setCustomers((prevCustomers) => {
  //     const updatedCustomers = [...prevCustomers];
  //     const customer = { ...updatedCustomers[currentCustomerIndex] };

  //     if (type === "cow") customer.cow_milk = (customer.cow_milk || 0) + 0.25;
  //     if (type === "buffalo")
  //       customer.buffalo_milk = (customer.buffalo_milk || 0) + 0.25;
  //     if (type === "pure")
  //       customer.pure_milk = (customer.pure_milk || 0) + 0.25;

  //     updatedCustomers[currentCustomerIndex] = customer;
  //     return updatedCustomers;
  //   });
  // };

  // const handleAdditionalDecrementRemain = (type) => {
  //   setCustomers((prevCustomers) => {
  //     const updatedCustomers = [...prevCustomers];
  //     const customer = { ...updatedCustomers[currentCustomerIndex] };

  //     if (type === "cow")
  //       customer.cow_milk = Math.max((customer.cow_milk || 0) - 0.25, 0);
  //     if (type === "buffalo")
  //       customer.buffalo_milk = Math.max(
  //         (customer.buffalo_milk || 0) - 0.25,
  //         0
  //       );
  //     if (type === "pure")
  //       customer.pure_milk = Math.max((customer.pure_milk || 0) - 0.25, 0);

  //     updatedCustomers[currentCustomerIndex] = customer;
  //     return updatedCustomers;
  //   });
  // };

  useEffect(() => {
    const getData = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await axios.get(
          `/api/deliveryBoy/users/pending-morning-orders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Process regular orders
        const regularOrders = response.data.regular_orders.map((customer) => ({
          ...customer,
          quantity: customer.quantity || 0,
          type: "regular",
        }));

        const additionalOrders = response.data.additional_orders.map(
          (order) => {
            const quantities = JSON.parse(order.quantity_array); // e.g. [1.5, 0.25, 2]
            return {
              id: order.userid,
              name: order.user.name,
              dairy_name: order.user.dairy_name,
              cow_milk: quantities[0] || 0,
              buffalo_milk: quantities[1] || 0,
              pure_milk: quantities[2] || 0,
              type: "additional",
              date: order.date,
            };
          }
        );

        const allCustomers = [...regularOrders, ...additionalOrders];
        setCustomers(allCustomers);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    getData();
  }, []);

  const handleIncrement = () => {
    setCustomers((prevCustomers) =>
      prevCustomers.map((customer, index) =>
        index === currentCustomerIndex
          ? { ...customer, quantity: customer.quantity + 0.25 }
          : customer
      )
    );
  };

  const handleDecrement = () => {
    setCustomers((prevCustomers) =>
      prevCustomers.map((customer, index) =>
        index === currentCustomerIndex
          ? { ...customer, quantity: Math.max(customer.quantity - 0.25, 0) }
          : customer
      )
    );
  };


  const handleNext = () => {
    setCurrentCustomerIndex((prevIndex) => (prevIndex + 1) % customers.length);
  };

  const handlePrevious = () => {
    setCurrentCustomerIndex(
      (prevIndex) => (prevIndex - 1 + customers.length) % customers.length
    );
  };

  const handleSwipeLeft = () => {
    handleNext();
  };

  const handleSwipeRight = () => {
    handlePrevious();
  };

  useSwipe(handleSwipeLeft, handleSwipeRight);

  const currentCustomer = customers[currentCustomerIndex];

  // Fetch delivered orders for the currently selected customer (for card view)
  const fetchDeliveredOrdersForCustomer = async (customerId) => {
    if (!customerId) return;
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `/api/deliveryBoy/users/${customerId}/delivered-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const fetchedOrders = (response.data.orders || []).map((order) => ({
          cow_quantity: order.cow_quantity || 0,
          buffalo_quantity: order.buffalo_quantity || 0,
          pure_quantity: order.pure_quantity || 0,
          shift: order.shift,
          order_date: order.date,
          status: order.status,
        }));
        setDeliveredOrders(fetchedOrders);
      }
    } catch (error) {
      console.error("Error fetching delivered orders for customer:", error);
      setDeliveredOrders([]);
    }
  };

  // When the current customer changes, load their delivered orders
  useEffect(() => {
    if (currentCustomer && currentCustomer.id) {
      fetchDeliveredOrdersForCustomer(currentCustomer.id);
      // Initialize today's quantity based on customer type
      if (currentCustomer.type === "regular") {
        setTodayMilkQuantity(currentCustomer.quantity || 0);
      } else {
        setTodayMilkQuantity(0);
      }
    } else {
      setDeliveredOrders([]);
      setTodayMilkQuantity(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCustomer?.id]);

  const handleLogout = (e) => {
    e.preventDefault(); // Prevent the default form submission
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
        navigate("/"); // Navigate to home only after confirmation
      }
    });
  };
  const [result, setResult] = useState([]);
  const checkMilkType = () => {
    if (!currentCustomer || !currentCustomer.milk_type) {
      return;
    }

    if (currentCustomer.milk_type === "cow") {
      setResult(["pure", "buffalo"]);
    } else if (currentCustomer.milk_type === "buffalo") {
      setResult(["pure", "cow"]);
    } else {
      setResult(["buffalo", "cow"]);
    }
  };

  useEffect(() => {
    if (currentCustomer) {
      checkMilkType();
    }
  }, [currentCustomer]);

  const [demoQuantities, setDemoQuantities] = useState([]);

  useEffect(() => {
    if (result.length > 0) {
      setDemoQuantities(new Array(result.length).fill(0)); // Initialize with 0s for each milk type
    }
  }, [result]); // Runs whenever `result` updates

  // const handleIncrementRemain = (index) => {
  //   setDemoQuantities((prevQuantities) =>
  //     prevQuantities.map((qty, i) => (i === index ? qty + 0.25 : qty))
  //   );
  // };

  // const handleDecrementRemain = (index) => {
  //   setDemoQuantities((prevQuantities) =>
  //     prevQuantities.map((qty, i) =>
  //       i === index && qty > 0 ? qty - 0.25 : qty
  //     )
  //   );
  // };

  const handleDelivery = async () => {
    let currentCustomer = customers[currentCustomerIndex];
    const id = currentCustomer.id;
    const token = localStorage.getItem("token");
    
    // Use todayMilkQuantity from card input
    const deliveryQuantity = todayMilkQuantity;
    
    if (currentCustomer.type == "additional") {
      try {
        const cowMilk = currentCustomer.cow_milk || 0;
        const buffaloMilk = currentCustomer.buffalo_milk || 0;
        const pureMilk = currentCustomer.pure_milk || 0;

        const response = await axios.post(
          `api/deliveryBoy/users/${id}/delivery`,
          {
            id,
            shift: "morning",
            cow_milk: cowMilk,
            buffalo_milk: buffaloMilk,
            pure_milk: pureMilk,
            delivery_status: true,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          toast.success(`Delivery successful for ${currentCustomer.name}`, {
            autoClose: 2000,
          });

          // Refresh delivered orders for card view
          await fetchDeliveredOrdersForCustomer(id);

          setCustomers((prevCustomers) => {
            const newCustomers = prevCustomers.filter(
              (_, index) => index !== currentCustomerIndex
            );

            if (newCustomers.length > 0) {
              setCurrentCustomerIndex(
                (prevIndex) => prevIndex % newCustomers.length
              );
            } else {
              setCurrentCustomerIndex(0);
            }

            return newCustomers;
          });
        } else {
          toast.error("Delivery failed", { autoClose: 2000 });
        }
      } catch (error) {
        if (error.response && error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Delivery failed");
        }
        console.error("Error delivering order:", error);
      }
    } else {
      try {
        const { id } = currentCustomer;
        
        // Use the quantity entered in the card
        const cowMilk =
          currentCustomer.milk_type === "cow"
            ? deliveryQuantity
            : demoQuantities["cow"] || 0;

        const buffaloMilk =
          currentCustomer.milk_type === "buffalo"
            ? deliveryQuantity
            : demoQuantities["buffalo"] || 0;

        const pureMilk =
          currentCustomer.milk_type === "pure"
            ? deliveryQuantity
            : demoQuantities["pure"] || 0;

        const response = await axios.post(
          `api/deliveryBoy/users/${id}/delivery`,
          {
            id,
            shift: "morning",
            cow_milk: cowMilk,
            buffalo_milk: buffaloMilk,
            pure_milk: pureMilk,
            delivery_status: true,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          toast.success(`Delivery successful for ${currentCustomer.name}`, {
            autoClose: 2000,
          });

          // Refresh delivered orders for card view
          await fetchDeliveredOrdersForCustomer(id);

          setCustomers((prevCustomers) => {
            const newCustomers = prevCustomers.filter(
              (_, index) => index !== currentCustomerIndex
            );

            if (newCustomers.length > 0) {
              setCurrentCustomerIndex(
                (prevIndex) => prevIndex % newCustomers.length
              );
            } else {
              setCurrentCustomerIndex(0);
            }

            return newCustomers;
          });
        } else {
          toast.error("Delivery failed", { autoClose: 2000 });
        }
      } catch (error) {
        if (error.response && error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Delivery failed");
        }
        console.error("Error delivering order:", error);
      }
    }
  };

  const handleNotPresent = async () => {
    const currentCustomer = customers[currentCustomerIndex];
    const token = localStorage.getItem("token");
    const id = currentCustomer.id;
    if (currentCustomer.type == "additional") {
      try {
        const cowMilk = currentCustomer.cow_milk || 0;
        const buffaloMilk = currentCustomer.buffalo_milk || 0;
        const pureMilk = currentCustomer.pure_milk || 0;
        const response = await axios.post(
          `api/deliveryBoy/users/${id}/delivery`,
          {
            id,
            shift: "morning",
            cow_milk: cowMilk,
            buffalo_milk: buffaloMilk,
            pure_milk: pureMilk,
            delivery_status: false,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          toast.success(`Marked as Not Present for ${currentCustomer.name}`, {
            autoClose: 2000,
          });

          setCustomers((prevCustomers) => {
            const newCustomers = prevCustomers.filter(
              (_, index) => index !== currentCustomerIndex
            );

            if (newCustomers.length > 0) {
              setCurrentCustomerIndex(
                (prevIndex) => prevIndex % newCustomers.length
              );
            } else {
              setCurrentCustomerIndex(0);
            }

            return newCustomers;
          });
        } else {
          toast.error("Failed to mark as Not Present", { autoClose: 2000 });
        }
      } catch (error) {
        console.error("Error marking as Not Present:", error);
        toast.error("Failed to mark as Not Present");
      }
    } else {
      try {
        const { id, quantity } = currentCustomer;
        const cowMilk =
          currentCustomer.milk_type === "cow"
            ? quantity
            : demoQuantities[result.indexOf("cow")] || 0;

        const buffaloMilk =
          currentCustomer.milk_type === "buffalo"
            ? quantity
            : demoQuantities[result.indexOf("buffalo")] || 0;

        const pureMilk =
          currentCustomer.milk_type === "pure"
            ? quantity
            : demoQuantities[result.indexOf("pure")] || 0;
        const response = await axios.post(
          `api/deliveryBoy/users/${id}/delivery`,
          {
            id,
            shift: "morning",
            cow_milk: cowMilk,
            buffalo_milk: buffaloMilk,
            pure_milk: pureMilk,
            delivery_status: false,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          toast.success(`Marked as Not Present for ${currentCustomer.name}`, {
            autoClose: 2000,
          });

          setCustomers((prevCustomers) => {
            const newCustomers = prevCustomers.filter(
              (_, index) => index !== currentCustomerIndex
            );

            if (newCustomers.length > 0) {
              setCurrentCustomerIndex(
                (prevIndex) => prevIndex % newCustomers.length
              );
            } else {
              setCurrentCustomerIndex(0);
            }

            return newCustomers;
          });
        } else {
          toast.error("Failed to mark as Not Present", { autoClose: 2000 });
        }
      } catch (error) {
        console.error("Error marking as Not Present:", error);
        toast.error("Failed to mark as Not Present");
      }
    }
  };
  const handleIncrementRemain = (type) => {
    setDemoQuantities((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + 0.25,
    }));
  };

  const handleDecrementRemain = (type) => {
    setDemoQuantities((prev) => ({
      ...prev,
      [type]: Math.max((prev[type] || 0) - 0.25, 0),
    }));
  };

  const handleAdditionalIncrementRemain = (type) => {
    setCustomers((prevCustomers) => {
      const updatedCustomers = [...prevCustomers];
      const customer = { ...updatedCustomers[currentCustomerIndex] };

      if (type === "cow") customer.cow_milk = (customer.cow_milk || 0) + 0.25;
      if (type === "buffalo")
        customer.buffalo_milk = (customer.buffalo_milk || 0) + 0.25;
      if (type === "pure")
        customer.pure_milk = (customer.pure_milk || 0) + 0.25;

      updatedCustomers[currentCustomerIndex] = customer;
      return updatedCustomers;
    });
  };

  const handleAdditionalDecrementRemain = (type) => {
    setCustomers((prevCustomers) => {
      const updatedCustomers = [...prevCustomers];
      const customer = { ...updatedCustomers[currentCustomerIndex] };

      if (type === "cow")
        customer.cow_milk = Math.max((customer.cow_milk || 0) - 0.25, 0);
      if (type === "buffalo")
        customer.buffalo_milk = Math.max(
          (customer.buffalo_milk || 0) - 0.25,
          0
        );
      if (type === "pure")
        customer.pure_milk = Math.max((customer.pure_milk || 0) - 0.25, 0);

      updatedCustomers[currentCustomerIndex] = customer;
      return updatedCustomers;
    });
  };

  return (
    <div>
      <div
        className="container-fluid"
        style={{
          backgroundColor: "#EF6E0B",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: customers.length === 0 ? "100vh" : null,
        }}
      >
        <div className="inner-section">
          {/* Header Section */}
          <div className="row mt-4 mb-4 bg-white shadow-sm align-items-center rounded-3 px-4 py-2">
            <div className="col-2 text-start">
              <Link to="/delivery-boy-login" className="text-dark ms-2">
                <LiaBackwardSolid size={28} />
              </Link>
            </div>
            <div className="col-8 text-center">
              <h4 className="fw-bold text-dark mb-0">Milk Delivery</h4>
              <p className="fw-semibold" style={{ color: "#EF6E0B" }}>
                Morning Shift
              </p>
            </div>
            <div className="col-2 text-end">
              <Link
                to="/delivery-boy-list"
                onClick={handleLogout}
                className="text-danger fw-bold me-2"
                style={{ textDecoration: "none" }}
              >
                Logout
              </Link>
            </div>
          </div>

          {/* Order Info Section */}
          <div className="row text-center text-white mb-4">
            <div className="col-6 p-3 border-end border-secondary">
              <h6>Today's Total Orders</h6>
              <h2 className="fw-bold">{customers.length}</h2>
            </div>
            <div className="col-6 p-3">
              <h6>Date: {date.toLocaleDateString()}</h6>
              <h6>Time: {date.toLocaleTimeString()}</h6>
            </div>
          </div>

          {/* Customer Details Section */}
          <div className="row">
            <div className="col-12">
              <Card className="shadow-lg rounded-3 border-0 m-3">
                <Card.Body>
                  {currentCustomer ? (
                    <>
                      <div className="row">
                        <div className="col-6">
                          <p className="text-muted mb-1">Customer Name:</p>
                        </div>
                        <div className="col-6">
                          <p className="fw-bold text-dark">
                            {currentCustomer.name}
                          </p>
                        </div>
                      </div>

                      {/* Type of Milk / Qty section intentionally hidden on delivery dashboard as per requirement */}

                      {currentCustomer.type == "additional" && (
                        <div>
                          <div
                            className="d-flex flex-wrap mt-2 align-items-center border-top pt-2"
                            style={{ backgroundColor: "#fff" }}
                          >
                            <div className="col-6">
                              <span className="fw-bold text-dark">Cow</span>
                            </div>
                            <div className="col-6 d-flex justify-content-end align-items-center">
                              <p className="mb-0 me-2 text-secondary">Qty:</p>
                              <div className="d-flex align-items-center">
                                <button
                                  onClick={() =>
                                    handleAdditionalDecrementRemain("cow")
                                  }
                                  className="btn btn-sm btn-outline-secondary"
                                  style={{ width: "32px", height: "32px" }}
                                >
                                  -
                                </button>
                                <span
                                  className="fw-bold mx-2"
                                  style={{
                                    minWidth: "30px",
                                    textAlign: "center",
                                  }}
                                >
                                  {currentCustomer.cow_milk || 0}
                                  {/* {console.log("milk type",milkType)}
                                    {console.log("Quantities",demoQuantities[milkType])} */}
                                </span>
                                <button
                                  onClick={() =>
                                    handleAdditionalIncrementRemain("cow")
                                  }
                                  className="btn btn-sm btn-outline-secondary"
                                  style={{ width: "32px", height: "32px" }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          <div
                            className="d-flex flex-wrap mt-2 align-items-center border-top pt-2"
                            style={{ backgroundColor: "#fff" }}
                          >
                            <div className="col-6">
                              <span className="fw-bold text-dark">Buffalo</span>
                            </div>
                            <div className="col-6 d-flex justify-content-end align-items-center">
                              <p className="mb-0 me-2 text-secondary">Qty:</p>
                              <div className="d-flex align-items-center">
                                <button
                                  onClick={() =>
                                    handleAdditionalDecrementRemain("buffalo")
                                  }
                                  className="btn btn-sm btn-outline-secondary"
                                  style={{ width: "32px", height: "32px" }}
                                >
                                  -
                                </button>
                                <span
                                  className="fw-bold mx-2"
                                  style={{
                                    minWidth: "30px",
                                    textAlign: "center",
                                  }}
                                >
                                  {currentCustomer.buffalo_milk || 0}
                                  {/* {console.log("milk type",milkType)}
                                    {console.log("Quantities",demoQuantities[milkType])} */}
                                </span>
                                <button
                                  onClick={() =>
                                    handleAdditionalIncrementRemain("buffalo")
                                  }
                                  className="btn btn-sm btn-outline-secondary"
                                  style={{ width: "32px", height: "32px" }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          <div
                            className="d-flex flex-wrap mt-2 align-items-center border-top pt-2"
                            style={{ backgroundColor: "#fff" }}
                          >
                            <div className="col-6">
                              <span className="fw-bold text-dark">Pure</span>
                            </div>
                            <div className="col-6 d-flex justify-content-end align-items-center">
                              <p className="mb-0 me-2 text-secondary">Qty:</p>
                              <div className="d-flex align-items-center">
                                <button
                                  onClick={() =>
                                    handleAdditionalDecrementRemain("pure")
                                  }
                                  className="btn btn-sm btn-outline-secondary"
                                  style={{ width: "32px", height: "32px" }}
                                >
                                  -
                                </button>
                                <span
                                  className="fw-bold mx-2"
                                  style={{
                                    minWidth: "30px",
                                    textAlign: "center",
                                  }}
                                >
                                  {currentCustomer.pure_milk || 0}
                                  {/* {console.log("milk type",milkType)}
                                    {console.log("Quantities",demoQuantities[milkType])} */}
                                </span>
                                <button
                                  onClick={() =>
                                    handleAdditionalIncrementRemain("pure")
                                  }
                                  className="btn btn-sm btn-outline-secondary"
                                  style={{ width: "32px", height: "32px" }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Customer Monthly Milk Card (same design as user dashboard) */}
                      <div className="mt-4">
                        <div className="milk-card-container">
                          <div className="card-header-section">
                            <div className="card-title">
                              <h5 style={{ margin: 0, fontWeight: "bold" }}>
                                {currentCustomer.name}
                              </h5>
                              <p style={{ margin: 0, fontSize: "14px" }}>
                                Dairy: {currentCustomer.dairy_name}
                              </p>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                                alignItems: "flex-end",
                              }}
                            >
                              <div
                                className="card-month-info"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => {
                                    const newMonth = new Date(activeMonth);
                                    newMonth.setMonth(newMonth.getMonth() - 1);
                                    setActiveMonth(newMonth);
                                  }}
                                  style={{ padding: "2px 8px", fontSize: "12px" }}
                                >
                                  ← Prev
                                </button>
                                <span style={{ fontWeight: "bold" }}>
                                  {activeMonth.toLocaleString("default", {
                                    month: "long",
                                  })}{" "}
                                  {activeMonth.getFullYear()}
                                </span>
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => {
                                    const newMonth = new Date(activeMonth);
                                    newMonth.setMonth(newMonth.getMonth() + 1);
                                    setActiveMonth(newMonth);
                                  }}
                                  style={{ padding: "2px 8px", fontSize: "12px" }}
                                >
                                  Next →
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="milk-card-grid">
                            <table className="milk-card-table">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Morning</th>
                                  <th>Evening</th>
                                  <th>Date</th>
                                  <th>Morning</th>
                                  <th>Evening</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Array.from({ length: 16 }, (_, i) => {
                                  const date1 = i + 1;
                                  const date2 = i + 17;
                                  const daysInMonth = new Date(
                                    activeMonth.getFullYear(),
                                    activeMonth.getMonth() + 1,
                                    0
                                  ).getDate();

                                  const getDateData = (day) => {
                                    if (day > daysInMonth) return null;

                                    const dateStr = `${activeMonth.getFullYear()}-${String(
                                      activeMonth.getMonth() + 1
                                    ).padStart(2, "0")}-${String(day).padStart(
                                      2,
                                      "0"
                                    )}`;

                                    const today = new Date().toISOString().split("T")[0];
                                    const isToday = dateStr === today;
                                    const isCurrentMonth = activeMonth.getMonth() === new Date().getMonth() && 
                                                          activeMonth.getFullYear() === new Date().getFullYear();

                                    const morningOrders = deliveredOrders.filter(
                                      (q) =>
                                        q.order_date === dateStr &&
                                        q.shift === "morning"
                                    );
                                    const eveningOrders = deliveredOrders.filter(
                                      (q) =>
                                        q.order_date === dateStr &&
                                        q.shift === "evening"
                                    );

                                    const getMilkQty = (orders) => {
                                      const total = orders.reduce(
                                        (acc, order) => {
                                          acc.cow += order.cow_quantity || 0;
                                          acc.buffalo +=
                                            order.buffalo_quantity || 0;
                                          acc.pure += order.pure_quantity || 0;
                                          return acc;
                                        },
                                        { cow: 0, buffalo: 0, pure: 0 }
                                      );

                                      // Show total quantity (sum of all milk types)
                                      return (
                                        total.cow + total.buffalo + total.pure
                                      );
                                    };

                                    return {
                                      morning: getMilkQty(morningOrders),
                                      evening: getMilkQty(eveningOrders),
                                      isToday: isToday && isCurrentMonth,
                                    };
                                  };

                                  const data1 = getDateData(date1);
                                  const data2 =
                                    date2 <= daysInMonth
                                      ? getDateData(date2)
                                      : null;

                                  return (
                                    <tr key={i}>
                                      <td className="date-cell">{date1}</td>
                                      <td className="qty-cell" style={{ padding: data1?.isToday ? "2px" : "8px" }}>
                                        {data1?.isToday ? (
                                          <input
                                            type="number"
                                            step="0.25"
                                            min="0"
                                            value={todayMilkQuantity}
                                            onChange={(e) => setTodayMilkQuantity(parseFloat(e.target.value) || 0)}
                                            style={{
                                              width: "100%",
                                              border: "1px solid #007bff",
                                              borderRadius: "3px",
                                              padding: "4px",
                                              textAlign: "center",
                                              fontSize: "14px",
                                              backgroundColor: "#e7f3ff",
                                            }}
                                          />
                                        ) : (
                                          data1?.morning > 0 ? data1.morning : ""
                                        )}
                                      </td>
                                      <td className="qty-cell">
                                        {data1?.evening > 0 ? data1.evening : ""}
                                      </td>
                                      <td className="date-cell">
                                        {date2 <= daysInMonth ? date2 : ""}
                                      </td>
                                      <td className="qty-cell" style={{ padding: data2?.isToday ? "2px" : "8px" }}>
                                        {data2?.isToday ? (
                                          <input
                                            type="number"
                                            step="0.25"
                                            min="0"
                                            value={todayMilkQuantity}
                                            onChange={(e) => setTodayMilkQuantity(parseFloat(e.target.value) || 0)}
                                            style={{
                                              width: "100%",
                                              border: "1px solid #007bff",
                                              borderRadius: "3px",
                                              padding: "4px",
                                              textAlign: "center",
                                              fontSize: "14px",
                                              backgroundColor: "#e7f3ff",
                                            }}
                                          />
                                        ) : (
                                          data2?.morning > 0 ? data2.morning : ""
                                        )}
                                      </td>
                                      <td className="qty-cell">
                                        {data2?.evening > 0 ? data2.evening : ""}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      <div className="row mt-4">
                        <div className="col-6">
                          <button
                            className="btn w-100 shadow-sm"
                            onClick={handleDelivery}
                            style={{
                              backgroundColor: "#EF6E0B",
                              color: "white",
                            }}
                          >
                            Delivery
                          </button>
                        </div>
                        <div className="col-6">
                          <button
                            className="btn btn-danger w-100 shadow-sm"
                            onClick={handleNotPresent}
                          >
                            Not Present
                          </button>
                        </div>
                      </div>

                      <div className="row mt-4">
                        <div className="col-6 text-end">
                          <button
                            onClick={handlePrevious}
                            className="btn btn-outline-primary shadow-sm"
                          >
                            Previous
                          </button>
                        </div>
                        <div className="col-6 text-start">
                          <button
                            onClick={handleNext}
                            className="btn btn-outline-primary shadow-sm"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-muted">
                      Customer Record Not Found
                    </p>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>

          {/* Footer Section */}
          <div className="row mt-4 p-3 bg-light text-center rounded-3 shadow-sm">
            <div className="col-12">
              <p className="text-secondary mb-0">
                <Link
                  to="https://www.dddigitalsolution.com/"
                  className="text-decoration-none text-dark"
                >
                  <span className="d-block d-md-inline">Powered By</span>
                  <span className="d-block d-md-inline"> DARSHAND DIGITAL SOLUTION LLP</span>
                </Link>
              </p>
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-12">
              <img
                src={footer_img}
                alt="Footer"
                className="footer_img sticky-bottom w-100 rounded-3"
              />
            </div>
          </div>
        </div>
      </div>
      <ToastContainer /> {/* Add ToastContainer to display toasts */}
    </div>
  );
}

export default Delivery_Boy_Morning;
