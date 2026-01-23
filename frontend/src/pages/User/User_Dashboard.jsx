import React, { useState, useEffect, useRef } from "react";
import Userheader from "../../partial/header/Userheader";
import { Container, Row, Col, Button, Modal, Form } from "react-bootstrap";
import "./User_Dashboard.css";
import "./PaymentModal.css";
import axios from "axios";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Link } from "react-router-dom";
import { generateToken, messaging } from "../../notifications/firebase";
import { onMessage } from "firebase/messaging";
import FestivalGreeting from "../../components/FestivalGreeting";
import CustomerNotificationPopup from "../../components/CustomerNotificationPopup";

function User_Dashboard() {
  const [payShow, setpayShow] = useState(false);
  const [qrimage, setQrimage] = useState(null);
  const [upiId, setUpiId] = useState("");
  const [rate, setRate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [milkType, setMilkType] = useState("");
  const [adminName, setAdminName] = useState("");
  const [dairyName, setDairyName] = useState("");
  const [dairyLogo, setDairyLogo] = useState(null);
  const [bank_name, setBankName] = useState("");
  const [branch_name, setBranchName] = useState("");
  const [account_number, setAccountNumber] = useState("");
  const [ifsc_code, setIfscCode] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [value, setValue] = useState(new Date());
  const [vacationDays, setVacationDays] = useState([]);
  const [openModelWindow, setOpenModelWindow] = useState(false);
  const [quantity1, setQuantity1] = useState([]);
  const [vacationChanged, setVacationChanged] = useState(false);
  const [ModelWindowData, setModelWindowData] = useState({
    startDate: "",
    endDate: "",
    shift: "",
  });

  const handleSubmit = async () => {
    if (
      !new Date(ModelWindowData.startDate) ||
      !new Date(ModelWindowData.endDate)
    ) {
      toast.error("Please select both start and end dates.");
      return;
    }

    if (new Date(ModelWindowData.startDate) < new Date()) {
      toast.error("Vacation start date must be greater than current date.");
      return;
    }

    if (
      new Date(ModelWindowData.endDate) < new Date(ModelWindowData.startDate)
    ) {
      toast.error("End date cannot be earlier than the start date.");
      return;
    }
    const token = localStorage.getItem("token");

    try {
      const vacation_start = ModelWindowData.startDate;
      const vacation_end = ModelWindowData.endDate;
      const shift = ModelWindowData.shift;

      await axios.post(
        "/api/user/vacation",
        {
          vacation_start,
          vacation_end,
          shift,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Vacation added successfully!");
      setVacationChanged(!vacationChanged);
      setOpenModelWindow(false);
    } catch (error) {
      if (error.response && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error adding vacation. Please try again.");
      }
      console.error("Error:", error.message);
    }
  };

  useEffect(() => {
    const fetchVacationData = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await axios.get("/api/user/getvacation", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 200) {
          const fetchedVacations = response.data.vacations || [];
          const formattedVacations = fetchedVacations.map((vacation) => ({
            start: vacation.vacation_start ? new Date(vacation.vacation_start) : null,
            end: vacation.vacation_end ? new Date(vacation.vacation_end) : (vacation.vacation_start ? new Date(vacation.vacation_start) : null),
            shift: vacation.shift,
          }));
          setVacationDays(formattedVacations);
        }
      } catch (error) {
        // Handle 404 gracefully - no vacations found is not an error
        if (error.response && error.response.status === 404) {
          setVacationDays([]); // Set empty array if no vacations found
        } else {
        console.error("Error fetching vacation data:", error);
        }
      }
    };

    fetchVacationData();
  }, [vacationChanged]);

  useEffect(() => {
    const fetchDeliveredOrders = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await axios.get("/api/user/deliveredOrders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 200) {
          const fetchedOrders = response.data.orders.map((order) => ({
            cow_quantity: order.cow_quantity || 0,
            buffalo_quantity: order.buffalo_quantity || 0,
            pure_quantity: order.pure_quantity || 0,
            shift: order.shift,
            order_date: order.date,
            status: order.status,
          }));
          setQuantity1(fetchedOrders);
        }
      } catch (error) {
        // Handle 404 gracefully - no delivered orders found is not an error
        if (error.response && error.response.status === 404) {
          setQuantity1([]); // Set empty array if no orders found
        } else {
        console.error("Error fetching delivered orders:", error);
        }
      }
    };

    fetchDeliveredOrders();
  }, []);

  const isVacant = (date, shift) => {
    return vacationDays.some((vacation) => {
      return (
        date >= new Date(vacation.start).setHours(0, 0, 0, 0) &&
        date <= new Date(vacation.end).setHours(23, 59, 59, 999) &&
        vacation.shift === shift
      );
    });
  };

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const morningVacant = isVacant(date, "morning");
      const eveningVacant = isVacant(date, "evening");
      const bothVacant = isVacant(date, "both");

      // Get quantities for morning shift
      const morningOrders = quantity1.filter(
        (order) =>
          new Date(order.order_date).toDateString() === date.toDateString() &&
          order.shift === "morning"
      );

      const eveningOrders = quantity1.filter(
        (order) =>
          new Date(order.order_date).toDateString() === date.toDateString() &&
          order.shift === "evening"
      );

      const getTotalQuantity = (orders) => {
        return orders.reduce(
          (total, order) => ({
            cow: total.cow + (order.cow_quantity || 0),
            buffalo: total.buffalo + (order.buffalo_quantity || 0),
            pure: total.pure + (order.pure_quantity || 0),
          }),
          { cow: 0, buffalo: 0, pure: 0 }
        );
      };

      const morningTotal = getTotalQuantity(morningOrders);
      const eveningTotal = getTotalQuantity(eveningOrders);

      const formatQuantity = ({ cow, buffalo, pure }) => {
        const getColorStyle = (value) => ({
          color: value > 0 ? "blue" : "inherit",
        });

        // Filter based on user's selected milk type - show only selected type
        const selectedMilkType = milkType?.toLowerCase();
        
        // If no milk type is selected, show all types (fallback)
        if (!selectedMilkType) {
        return (
          <div className="flex-quantity">
            <div style={getColorStyle(cow)}>
              <span>c:</span>
              {cow || 0}
            </div>
            <div style={getColorStyle(buffalo)}>
              <span>b:</span>
              {buffalo || 0}
            </div>
            <div style={getColorStyle(pure)}>
              <span>p:</span>
              {pure || 0}
            </div>
            </div>
          );
        }
        
        // Show only the selected milk type
        return (
          <div className="flex-quantity">
            {selectedMilkType === "cow" && (
              <div style={getColorStyle(cow)}>
                <span>c:</span>
                {cow || 0}
              </div>
            )}
            {selectedMilkType === "buffalo" && (
              <div style={getColorStyle(buffalo)}>
                <span>b:</span>
                {buffalo || 0}
              </div>
            )}
            {selectedMilkType === "pure" && (
              <div style={getColorStyle(pure)}>
                <span>p:</span>
                {pure || 0}
              </div>
            )}
          </div>
        );
      };

      if (bothVacant) {
        return (
          <>
            <div className="shift vacant-morning">Vacant</div>
            <div className="shift vacant-evening">Vacant</div>
          </>
        );
      }

      return (
        <>
          {/* Morning Shift */}
          <div
            className={`shift ${
              morningVacant ? "vacant-morning" : "no-quantity"
            }`}
          >
            {morningVacant ? (
              "Vacant"
            ) : (
              <>
                M
                <span style={{ color: "black", fontWeight: "bold" }}>
                  {formatQuantity(morningTotal)}
                </span>
              </>
            )}
          </div>

          {/* Evening Shift */}
          <div
            className={`shift ${
              eveningVacant ? "vacant-evening" : "no-quantity"
            }`}
          >
            {eveningVacant ? (
              "Vacant"
            ) : (
              <>
                E
                <span style={{ color: "black", fontWeight: "bold" }}>
                  {formatQuantity(eveningTotal)}
                </span>
              </>
            )}
          </div>
        </>
      );
    }
    return null;
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  useEffect(() => {
    const fetchRates = async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/user/getRates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRate(response.data.rate);
      setQuantity(response.data.quantity);
      setMilkType(response.data.milk_type);
    };

    const fetchDairyInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/user/get-dairy-info", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setDairyName(response.data.dairy_name);
        setAdminName(response.data.admin_name);
        if (response.data.dairy_logo) {
          setDairyLogo(`data:image/jpeg;base64,${response.data.dairy_logo}`);
        }
      } catch (error) {
        console.error("Error fetching dairy info:", error);
      }
    };

    fetchRates();
    fetchDairyInfo();
  }, []); // Added dependency array to prevent infinite loop
  const userHeaderRef = useRef(); // ✅ Proper ref object

  const handleUpload = async (event) => {
    // event.preventDefault();
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("qr_image", file);

    try {
      setUploading(true);
      const response = await axios.put(
        "/api/user/update-payment-details",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Ensure token is set
          },
        }
      );

      setMessage(response.data.message);
      userHeaderRef.current?.fetchPaymentProof();
    } catch (error) {
      setMessage("Error uploading file. Please try again.");
      console.error("Upload Error:", error);
    } finally {
      setUploading(false);
    }
  };

  const [payment_details, setPaymentDetails] = useState({
    start_date: "",
    end_date: "",
    payment: "",
    totalbalancepayment: "",
    advance_payment: "",
    status: "",
    delivery_charges: "",
    received_payment: "",
  });

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [activeMonth, setActiveMonth] = useState(new Date());

  useEffect(() => {
    const fetchPaymentSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/user/get-payment-summary", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPaymentHistory(response.data.paymentHistory || []);
        setAdvancePayment(response.data.advancePayment);
      } catch (error) {
        console.error("Error fetching payment summary:", error);
      }
    };

    fetchPaymentSummary();
  }, []);

  // Register FCM Token and Listen for Notifications
  useEffect(() => {
    const registerFCMToken = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Generate FCM token
        const fcm_token = await generateToken();
        if (!fcm_token) {
          console.log("FCM token not generated. User may have denied notification permission.");
          return;
        }

        // Register FCM token with backend
        try {
          await axios.put(
            "/api/user/update_fcm_token",
            { fcm_token: fcm_token },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log("FCM token registered successfully for customer");
        } catch (error) {
          console.error("Error updating FCM token:", error);
        }

        // Listen for incoming messages (foreground notifications)
        onMessage(messaging, (payload) => {
          console.log("Message received:", payload);
          
          // Show notification toast
          if (payload.notification) {
            toast.info(payload.notification.body, {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }

          // Handle festival greeting notifications
          if (payload.data && payload.data.type === "festival_greeting") {
            // The FestivalGreeting component will handle displaying the banner
            // Force a re-render by updating state if needed
            console.log("Festival greeting received:", payload.data.festival_name);
          }
        });
      } catch (error) {
        console.error("Error in FCM setup:", error);
      }
    };

    registerFCMToken();
  }, []);

  useEffect(() => {
    const selectedMonth = activeMonth.getMonth() + 1;
    const selectedYear = activeMonth.getFullYear();
    const monthStr = `${selectedYear}-${String(selectedMonth).padStart(
      2,
      "0"
    )}`;

    const entry = paymentHistory.find((p) => p.month_year === monthStr);

    if (entry) {
      const endDate = new Date(selectedYear, selectedMonth, 0);

      setPaymentDetails({
        start_date: entry.start_date || "",
        end_date: endDate.toISOString().split("T")[0],
        payment: entry.payment || 0,
        totalbalancepayment: entry.pending_payment || 0,
        delivery_charges: entry.delivery_charges || 0,
        advance_payment: entry.advancePayment || 0,
        status: entry.pending_payment === 0 ? "true" : "false",
        received_payment: entry.received_payment || 0,
      });
    } else {
      console.warn("No entry for selected month:", monthStr);
      setPaymentDetails({});
    }
  }, [activeMonth, paymentHistory]);

  const handlePayClose = () => setpayShow(false);
  const handlePayShow = () => {
    setpayShow(true);
  };

  const handleMakePayment = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get("/api/user/get-payment-details", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAdminName(response.data.payment_details.admin_name);
      setQrimage(response.data.payment_details.qr_image);
      setUpiId(response.data.payment_details.upi_address);
      setBankName(response.data.payment_details.bank_name);
      setBranchName(response.data.payment_details.branch_name);
      setAccountNumber(response.data.payment_details.account_number);
      setIfscCode(response.data.payment_details.ifsc_code);
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    handleMakePayment();
  }, []);

  const [daysRemaining, setDaysRemaining] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (payment_details.start_date && payment_details.end_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selectedMonth = activeMonth.getMonth();
        const selectedYear = activeMonth.getFullYear();

        const endDate = new Date(payment_details.end_date);
        endDate.setHours(0, 0, 0, 0);

        const timeDifference = endDate - today;
        const calculatedDaysRemaining = Math.ceil(
          timeDifference / (1000 * 60 * 60 * 24)
        );

        setDaysRemaining(calculatedDaysRemaining);

        // NOTE:
        // We intentionally do NOT show the
        // \"Your subscription is expiring soon\" warning anymore.
        // As per requirement, only pending payment and expired warnings
        // should be shown on the user dashboard.

        // ✅ Get current month-year string (e.g., "2025-04")
        const currentMonthYear = `${today.getFullYear()}-${String(
          today.getMonth() + 1
        ).padStart(2, "0")}`;

        // ✅ Find first pending entry from previous months only
        const firstPendingEntry = [...paymentHistory]
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
          .find(
            (entry) =>
              entry.pending_payment > 0 &&
              String(entry.status) === "false" &&
              entry.month_year < currentMonthYear
          );

        if (firstPendingEntry) {
          const formattedPrevStartDate = new Date(firstPendingEntry.start_date)
            .toISOString()
            .split("T")[0];

          setError(
            `Your payment from ${formattedPrevStartDate} is still pending! Please make the payment.`
          );
          return;
        }

        // ✅ Normal expiry check (if no payment made after expiry)
        if (
          calculatedDaysRemaining <= 0 &&
          today > endDate &&
          String(payment_details.status) === "false"
        ) {
          const formattedEndDate = new Date(payment_details.start_date)
            .toISOString()
            .split("T")[0];
          setError(
            `Your subscription is expired for the month (${formattedEndDate})!! Renew it to enjoy your services.`
          );
        }
      }
    };

    fetchData();
  }, [payment_details, activeMonth, paymentHistory]);

  return (
    <>
      <Userheader ref={userHeaderRef}></Userheader>
      {/* Customer Notification Popup - Shows admin's notification on login */}
      <CustomerNotificationPopup />
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
      <Container fluid>
        <Container>
          {/* Festival Greeting Banner */}
          <Row className="mt-3">
            <Col>
              <FestivalGreeting />
            </Col>
          </Row>
          <Row className="mt-3 mb-3">
            <Col lg={6} md={12} className="mt-2">
              <div className="milk-card-container">
                <div className="card-header-section">
                  <div className="card-header-left" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    {dairyLogo && (
                      <img
                        src={dairyLogo}
                        alt="Dairy Logo"
                        className="dairy-logo"
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "contain",
                          border: "1px solid #ddd",
                          borderRadius: "5px",
                          padding: "5px",
                        }}
                      />
                    )}
                    <div className="card-title">
                      <h5 style={{ margin: 0, fontWeight: "bold" }}>
                        {dairyName || "Mauli Dairy"}
                      </h5>
                      <p style={{ margin: 0, fontSize: "14px" }}>
                        Customer Name: {adminName || "Customer"}
                      </p>
                    </div>
                  </div>
                  <div className="card-header-right" style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                    <div className="card-month-info" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="month-nav-btn prev-btn"
                    onClick={() => {
                          const newMonth = new Date(activeMonth);
                          newMonth.setMonth(newMonth.getMonth() - 1);
                          setActiveMonth(newMonth);
                        }}
                        style={{ padding: "2px 8px", fontSize: "12px" }}
                      >
                        ← Prev
                      </Button>
                      <span className="month-year-text" style={{ fontWeight: "bold" }}>
                        {activeMonth.toLocaleString('default', { month: 'long' })} {activeMonth.getFullYear()}
                      </span>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="month-nav-btn next-btn"
                        onClick={() => {
                          const newMonth = new Date(activeMonth);
                          newMonth.setMonth(newMonth.getMonth() + 1);
                          setActiveMonth(newMonth);
                        }}
                        style={{ padding: "2px 8px", fontSize: "12px" }}
                      >
                        Next →
                      </Button>
                    </div>
                    <label
                      className="manage-vacation-link"
                      style={{ color: "#EF6E0B", cursor: "pointer", fontSize: "14px" }}
                      onClick={() => setOpenModelWindow(true)}
                  >
                    Manage Vacation
                  </label>
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
                          ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                          
                          const currentDate = new Date(
                            activeMonth.getFullYear(),
                            activeMonth.getMonth(),
                            day
                          );
                          currentDate.setHours(0, 0, 0, 0);
                          
                          const morningOrders = quantity1.filter(
                            (q) => q.order_date === dateStr && q.shift === "morning"
                          );
                          const eveningOrders = quantity1.filter(
                            (q) => q.order_date === dateStr && q.shift === "evening"
                          );
                          
                          const getMilkQty = (orders) => {
                            const total = orders.reduce(
                              (acc, order) => {
                                acc.cow += order.cow_quantity || 0;
                                acc.buffalo += order.buffalo_quantity || 0;
                                acc.pure += order.pure_quantity || 0;
                                return acc;
                              },
                              { cow: 0, buffalo: 0, pure: 0 }
                            );
                            
                            const selectedMilkType = milkType?.toLowerCase();
                            if (selectedMilkType === "cow") return total.cow;
                            if (selectedMilkType === "buffalo") return total.buffalo;
                            if (selectedMilkType === "pure") return total.pure;
                            return total.cow + total.buffalo + total.pure;
                          };
                          
                          // Check if date is vacant for morning shift
                          const morningVacant = vacationDays.some((vacation) => {
                            if (!vacation.start) return false;
                            
                            const startDate = new Date(vacation.start);
                            startDate.setHours(0, 0, 0, 0);
                            
                            // Handle null end date (one-day vacation)
                            const endDate = vacation.end 
                              ? new Date(vacation.end)
                              : new Date(vacation.start);
                            endDate.setHours(23, 59, 59, 999);
                            
                            return (
                              currentDate >= startDate &&
                              currentDate <= endDate &&
                              (vacation.shift === "morning" || vacation.shift === "both")
                            );
                          });
                          
                          // Check if date is vacant for evening shift
                          const eveningVacant = vacationDays.some((vacation) => {
                            if (!vacation.start) return false;
                            
                            const startDate = new Date(vacation.start);
                            startDate.setHours(0, 0, 0, 0);
                            
                            // Handle null end date (one-day vacation)
                            const endDate = vacation.end 
                              ? new Date(vacation.end)
                              : new Date(vacation.start);
                            endDate.setHours(23, 59, 59, 999);
                            
                            return (
                              currentDate >= startDate &&
                              currentDate <= endDate &&
                              (vacation.shift === "evening" || vacation.shift === "both")
                            );
                          });
                          
                          return {
                            morning: getMilkQty(morningOrders),
                            evening: getMilkQty(eveningOrders),
                            morningVacant,
                            eveningVacant
                          };
                        };

                        const data1 = getDateData(date1);
                        const data2 = date2 <= daysInMonth ? getDateData(date2) : null;

                        return (
                          <tr key={i}>
                            <td className="date-cell">{date1}</td>
                            <td className="qty-cell">
                              {data1?.morningVacant ? (
                                <span className="vacant-text">Vacation</span>
                              ) : data1?.morning > 0 ? (
                                data1.morning
                              ) : (
                                ""
                              )}
                            </td>
                            <td className="qty-cell">
                              {data1?.eveningVacant ? (
                                <span className="vacant-text">Vacation</span>
                              ) : data1?.evening > 0 ? (
                                data1.evening
                              ) : (
                                ""
                              )}
                            </td>
                            <td className="date-cell">{date2 <= daysInMonth ? date2 : ""}</td>
                            <td className="qty-cell">
                              {data2?.morningVacant ? (
                                <span className="vacant-text">Vacation</span>
                              ) : data2?.morning > 0 ? (
                                data2.morning
                              ) : (
                                ""
                              )}
                            </td>
                            <td className="qty-cell">
                              {data2?.eveningVacant ? (
                                <span className="vacant-text">Vacation</span>
                              ) : data2?.evening > 0 ? (
                                data2.evening
                              ) : (
                                ""
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
                <Modal
                  show={openModelWindow}
                  onHide={() => setOpenModelWindow(false)}
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Add Vacancy</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Start Date <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={ModelWindowData.startDate}
                          onChange={(e) =>
                            setModelWindowData({
                              ...ModelWindowData,
                              startDate: e.target.value,
                            })
                          }
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>
                          End Date <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={ModelWindowData.endDate}
                          onChange={(e) =>
                            setModelWindowData({
                              ...ModelWindowData,
                              endDate: e.target.value,
                            })
                          }
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formShift">
                        <Form.Label>
                          Select Shift <span style={{ color: "red" }}>*</span>
                        </Form.Label>
                        <div
                          style={{
                            padding: "10px",
                            borderRadius: "5px",
                            display:"flex",
                            gap:"5px",
                          }}
                        >
                          <Form.Check
                            type="checkbox"
                            label="Morning"
                            value="morning"
                            checked={
                              ModelWindowData.shift === "morning" ||
                              ModelWindowData.shift === "both"
                            }
                            onChange={(e) => {
                              const { checked } = e.target;
                              let shiftValue;

                              if (
                                checked &&
                                ModelWindowData.shift === "evening"
                              ) {
                                shiftValue = "both";
                              } else if (checked) {
                                shiftValue = "morning";
                              } else if (ModelWindowData.shift === "both") {
                                shiftValue = "evening";
                              } else {
                                shiftValue = "";
                              }

                              setModelWindowData({
                                ...ModelWindowData,
                                shift: shiftValue,
                              });
                            }}
                          />
                          <Form.Check
                            type="checkbox"
                            label="Evening"
                            value="evening"
                            checked={
                              ModelWindowData.shift === "evening" ||
                              ModelWindowData.shift === "both"
                            }
                            onChange={(e) => {
                              const { checked } = e.target;
                              let shiftValue;

                              if (
                                checked &&
                                ModelWindowData.shift === "morning"
                              ) {
                                shiftValue = "both";
                              } else if (checked) {
                                shiftValue = "evening";
                              } else if (ModelWindowData.shift === "both") {
                                shiftValue = "morning";
                              } else {
                                shiftValue = "";
                              }

                              setModelWindowData({
                                ...ModelWindowData,
                                shift: shiftValue,
                              });
                            }}
                          />
                        </div>
                      </Form.Group>
                    </Form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button
                      variant="secondary"
                      onClick={() => setOpenModelWindow(false)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => {
                        handleSubmit();
                      }}
                    >
                      Add Vacancy
                    </Button>
                  </Modal.Footer>
                </Modal>
            </Col>

            <Col lg={6} md={12} className="mt-2" style={{ paddingTop: "35px" }}>
              {/* Additional Order Section - Commented Out */}
              {/* 
              <div
                style={{
                  padding: "15px",
                  borderRadius: "3px",
                  fontFamily: "poppins",
                  marginBottom: "5px",
                  border: "1px solid #ddd",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <p style={{ margin: 0 }}></p>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      color: "orange",
                      cursor: "pointer",
                    }}
                  >
                    <Link
                      to={"/user/add-item"}
                      style={{ textDecoration: "none", color: "orange" }}
                    >
                      + Add item
                    </Link>
                  </button>
                </div>
                <p style={{ margin: 0, color: "#333" }} className="text-muted">
                  If you would like to place an additional order, please use the
                  'Add Item' option.
                </p>
              </div>
              */}

              {error ? (
                <div className="pending-payment-warning">
                  <p>
                    {error}
                  </p>
                </div>
              ) : null}
              <div
                className="col-container p-3"
                style={{
                  // backgroundColor: "#F9F9F9",
                  borderRadius: "3px",
                  // boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  // border: "none",
                  border: "1px solid #ddd",
                }}
              >
                <p
                  style={{
                    color: "black",
                    fontSize: "16px",
                    fontWeight: "bold",
                    borderBottom: "2px solid #CDCDCD",
                    paddingBottom: "5px",
                  }}
                >
                  Summary
                </p>

                <div
                  // className="row"
                  style={{ borderBottom: "1px solid #CDCDCD", display: "flex" }}
                >
                  <div className="col-6">
                    <p>
                      {milkType} milk: {quantity} ltr
                    </p>
                  </div>
                  <div className="col-6 text-end">
                    <p>Rs: {rate}/-</p>
                  </div>
                </div>
                {/* <div>
                  <div
                    style={{
                      display: "flex",
                    }}
                  >
                    <div className="col-6">
                      <p>
                        Cow : 35 ltr
                      </p>
                    </div>
                    <div className="col-6 text-end">
                      <p>Rs: {rate}/-</p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                    }}
                  >
                    <div className="col-6">
                      <p>
                        Buffalo : 25 ltr
                      </p>
                    </div>
                    <div className="col-6 text-end">
                      <p>Rs: 30/-</p>
                    </div>
                  </div>

                  <div
                    style={{
                      borderBottom: "1px solid #CDCDCD",
                      display: "flex",
                    }}
                  >
                    <div className="col-6">
                      <p>
                        Pure : 00 ltr
                      </p>
                    </div>
                    <div className="col-6 text-end">
                      <p>Rs: 00/-</p>
                    </div>
                  </div>
                </div> */}

                <div className="row">
                  <div className="col-6">
                    <p className="mt-1">Payment:</p>
                  </div>
                  <div className="col-6 text-end">
                    <p className="mt-1">
                      Rs:{" "}
                      {payment_details.payment ? payment_details.payment : 0}
                      /-
                    </p>
                  </div>
                </div>

                <div
                  // className="row"
                  style={{ borderBottom: "1px solid #CDCDCD",display:"flex" }}
                >
                  <div className="col-9">
                    <p className="mt-1">Delivery Charges:</p>
                  </div>
                  <div className="col-3 text-end">
                    <p className="mt-1">
                      Rs:{" "}
                      {payment_details.delivery_charges
                        ? payment_details.delivery_charges
                        : 0}
                      /-
                    </p>
                  </div>
                </div>

                <div
                  className="row"
                  // style={{ borderBottom: "1px solid #CDCDCD" }}
                >
                  <div className="col-9">
                    <p className="mt-1">Advanced Payment:</p>
                  </div>
                  <div className="col-3 text-end">
                    <p className="mt-1">
                      Rs:{" "}
                      {payment_details.advance_payment
                        ? payment_details.advance_payment
                        : 0}
                      /-
                    </p>
                  </div>
                </div>

                <div
                  // className="row"
                  style={{ borderBottom: "1px solid #CDCDCD",display:"flex" }}
                >
                  <div className="col-9">
                    <p className="mt-1">Received Payment:</p>
                  </div>
                  <div className="col-3 text-end">
                    <p className="mt-1">
                      Rs:{" "}
                      {payment_details.received_payment
                        ? payment_details.received_payment
                        : 0}
                      /-
                    </p>
                  </div>
                </div>

                <div className="row">
                  <div className="col-6">
                    <p className="mt-2">Total Pending Payment:</p>
                  </div>
                  <div className="col-6 text-end">
                    <p className="mt-2">
                      <strong>
                        Rs:{" "}
                        {payment_details.totalbalancepayment
                          ? payment_details.totalbalancepayment
                          : 0}
                        /-
                      </strong>
                    </p>
                  </div>
                  <div className="col-12">
                    <Button
                      variant="outline-danger"
                      className="mb-2"
                      style={{
                        width: "100%",
                        color: "#EF6E0B",
                        border: "2px solid #EF6E0B",
                        borderRadius: "50px",
                      }}
                      onClick={handlePayShow}
                    >
                      Make Payment
                    </Button>
                  </div>
                </div>
              </div>

              <div
                className="mt-4 p-3"
                style={{
                  borderRadius: "3px",
                  border: "1px solid #ddd",
                }}
              >
                <label htmlFor="formFile" className="form-label">
                  Upload your payment screenshot
                </label>
                <form
                  className="d-flex align-items-center justify-content-start flex-wrap gap-3"
                  onSubmit={() => {
                    handleUpload();
                  }}
                >
                  <input
                    className="form-control"
                    type="file"
                    id="formFile"
                    onChange={handleFileChange}
                  />
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </form>
                {message && <p className="mt-2 text-success">{message}</p>}
              </div>
            </Col>
          </Row>
        </Container>
      </Container>

      <Modal show={payShow} onHide={handlePayClose} centered>
        <Modal.Header style={{ backgroundColor: "#FFAC30", border: "none" }}>
          <Modal.Title style={{ fontWeight: "bold" }}>
            Make a Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <h6
            style={{
              color: "#EF6E0B",
              fontWeight: "bold",
              borderBottom: "1px solid #CDCDCD",
              paddingBottom: "8px",
            }}
          >
            Dairy Name: {adminName}
          </h6>
          <div className="d-flex justify-content-center my-3">
            {qrimage ? (
              <img
                src={`data:image/png;base64,${qrimage}`}
                alt="Scanner"
                style={{
                  maxWidth: "60%",
                  borderRadius: "10px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
                name="qr_image"
                className="img-fluid"
              />
            ) : (
              <p>Scanner Not Uploaded</p>
            )}
          </div>
          <div style={{ fontSize: "14px", color: "#555" }}>
            <p>
              <strong>UPI ID:</strong> {upiId ? upiId : "UPI Id Not uploaded"}
            </p>
          </div>
          <div style={{ fontSize: "14px", color: "#555" }}>
            <p>
              <strong>Bank Name:</strong>{" "}
              {bank_name ? bank_name : "Bank Name Not uploaded"}
            </p>
          </div>
          <div style={{ fontSize: "14px", color: "#555" }}>
            <p>
              <strong>Branch Name:</strong>{" "}
              {branch_name ? branch_name : "Branch Name Not uploaded"}
            </p>
          </div>
          <div style={{ fontSize: "14px", color: "#555" }}>
            <p>
              <strong>Account Number:</strong>{" "}
              {account_number ? account_number : "Account Number Not uploaded"}
            </p>
          </div>
          <div style={{ fontSize: "14px", color: "#555" }}>
            <p>
              <strong>IFSC code:</strong>{" "}
              {ifsc_code ? ifsc_code : "IFSC code Not uploaded"}
            </p>
          </div>
          <div>
            <button
              onClick={handlePayClose}
              style={{
                backgroundColor: "gray",
                color: "black",
                border: "none",
                padding: "14px 20px",
                borderRadius: "5px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                boxShadow: "2px 4px 10px rgba(0, 0, 0, 0.2)",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "darkgray")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "gray")}
            >
              Close
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default User_Dashboard;
