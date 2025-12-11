import React, { useEffect, useState, useCallback } from "react";
import WindowHeader from "../../window_partial/window_header";
import {
  Container,
  Button,
  Row,
  Col,
  Modal,
  Card,
} from "react-bootstrap";
import Swal from "sweetalert2";
import "../../window_partial/window.css";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import { onMessage } from "firebase/messaging";
import { generateToken, messaging } from "../../notifications/firebase";

function Admin_Dashboard() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
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
  const [fcm_token,setFCMToken]=useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const fcm_token = await generateToken();
      if (!fcm_token) {
        console.error("FCM token not generated.");
        return;
      }
      setFCMToken(fcm_token);
      onMessage(messaging, (payload) => {
        // console.log(payload);
      });

      try {
        const response = await axios.put(
          "/api/admin/update_fcm_token",
          { fcm_token: fcm_token },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // console.log("Response from backend:", response.data);
      } catch (error) {
        console.error("Error updating FCM token:", error);
      }
    };

    fetchData(); 
  }, []); // Empty dependency array - run once on mount 


  const [formData, setFormData] = useState({
    payment_amount: "",
    subscription_valid: "",
  });

  const getUsernameFromCookie = () => {
    const cookieValue = Cookies.get("Mauli-Dairy");
    if (cookieValue) {
      const userData = JSON.parse(cookieValue);
      return {
        username: userData.name,
        userEmail: userData.email,
        userContact: userData.mobile,
      };
    }
    return null;
  };

  const userDetails = getUsernameFromCookie();
  const username = userDetails.username;
  const userEmail = userDetails.userEmail;
  const userContact = userDetails.userContact;

  useEffect(() => {
    switch (formData.subscription_valid) {
      case "monthly":
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "1000",
        }));
        break;
      case "quarterly":
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "2700",
        }));
        break;
      case "half-yearly":
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "4800",
        }));
        break;
      case "yearly":
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "8400",
        }));
        break;
      default:
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "",
        }));
        break;
    }
  }, [formData.subscription_valid]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };


  const [daysRemaining, setDaysRemaining] = useState(null);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [paymentJustCompleted, setPaymentJustCompleted] = useState(false);
  const [popupShown, setPopupShown] = useState(false);

  // Check localStorage for recent payment (persists across navigation)
  const checkRecentPayment = () => {
    const recentPayment = localStorage.getItem('subscription_payment_timestamp');
    if (recentPayment) {
      const paymentTime = parseInt(recentPayment);
      const now = Date.now();
      const timeSincePayment = now - paymentTime;
      // If payment was within last 5 minutes, consider it recent
      return timeSincePayment < 5 * 60 * 1000; // 5 minutes
    }
    return false;
  };

  // Function to fetch subscription data
  const fetchSubscriptionData = useCallback(async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get("/api/admin/res-periods", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { res_date, end_date, periods } = response.data;

      // Use end_date directly from database (more accurate than calculating)
      if (!end_date) {
        console.error(
          "Error: Subscription end_date is missing in the response."
        );
        // Fallback: calculate from res_date if end_date is not available
        if (!res_date || !periods) {
          console.error(
            "Error: Subscription details are missing in the response."
          );
          return;
        }
        
        // Fallback calculation (should not happen if database is correct)
        const adminCreatedDate = new Date(res_date);
        if (isNaN(adminCreatedDate.getTime())) {
          console.error("Invalid date format received:", res_date);
          return;
        }

        let subscriptionEndDate = new Date(adminCreatedDate);
        switch (periods) {
          case "monthly":
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
            break;
          case "quarterly":
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 3);
            break;
          case "half-yearly":
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 6);
            break;
          case "yearly":
            subscriptionEndDate.setFullYear(
              subscriptionEndDate.getFullYear() + 1
            );
            break;
          default:
            console.error("Unknown subscription type:", periods);
            return;
        }
        
        // Use calculated date as fallback
        const formatDate = (date) =>
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(date.getDate()).padStart(2, "0")}`;

        const today = new Date();
        const todayStr = formatDate(today);
        const endDateStr = formatDate(subscriptionEndDate);

        const timeDifference =
          new Date(endDateStr).getTime() - new Date(todayStr).getTime();
        const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
        setDaysRemaining(daysRemaining);
        setSubscriptionChecked(true);

        if (daysRemaining > 0 && daysRemaining <= 7) {
          toast.warning(
            `Your subscription is expiring in ${daysRemaining} day. Renew now to avoid any interruptions in service.`
          );
        }
        return;
      }

      // Primary path: Use end_date directly from database
      const subscriptionEndDate = new Date(end_date);
      if (isNaN(subscriptionEndDate.getTime())) {
        console.error("Invalid end_date format received:", end_date);
        return;
      }

      // Convert dates to YYYY-MM-DD format for accurate comparison
      const formatDate = (date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(date.getDate()).padStart(2, "0")}`;

      const today = new Date();
      const todayStr = formatDate(today);
      const endDateStr = formatDate(subscriptionEndDate);

      // Calculate the days remaining using database end_date
      const timeDifference =
        new Date(endDateStr).getTime() - new Date(todayStr).getTime();
      const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
      
      console.log("📅 Subscription check:", {
        end_date: endDateStr,
        today: todayStr,
        daysRemaining: daysRemaining,
        paymentJustCompleted: paymentJustCompleted
      });
      
      setDaysRemaining(daysRemaining);
      setSubscriptionChecked(true);
      
      // Note: We can't check paymentJustCompleted here as it's not in the closure
      // The check happens in the popup useEffect

      if (daysRemaining > 0 && daysRemaining <= 7) {
        toast.warning(
          `Your subscription is expiring in ${daysRemaining} day. Renew now to avoid any interruptions in service.`
        );
      }
    } catch (error) {
      console.error(
        "Error fetching admin register date:",
        error.response?.data || error.message
      );
      setSubscriptionChecked(true); // Mark as checked even on error to prevent infinite popup
    }
  }, []);

  // Fetch subscription data on mount and when location changes (after payment redirect)
  useEffect(() => {
    // Check if coming from successful payment
    const urlParams = new URLSearchParams(location.search);
    const isPaymentSuccess = urlParams.get('payment') === 'success';
    
    if (isPaymentSuccess) {
      // Set flag to prevent showing expired popup immediately
      setPaymentJustCompleted(true);
      setSubscriptionChecked(false); // Reset to prevent popup during data fetch
      setPopupShown(false); // Reset popup flag since subscription is renewed
      
      // Store payment timestamp in localStorage (persists across navigation)
      localStorage.setItem('subscription_payment_timestamp', Date.now().toString());
      console.log("💾 Payment timestamp saved to localStorage");
      
      // Close payment modal if it's open
      setShowPaymentModal(false);
      
      // Clear the URL parameter immediately
      navigate('/admin-dashboard', { replace: true });
      
      // Show success message
      toast.success("Payment successful! Your subscription has been renewed.");
      
      // Wait for database to update, then fetch fresh data multiple times to ensure we get updated data
      const fetchWithRetry = async (retries = 5, delay = 2000) => {
        let subscriptionValid = false;
        
        for (let i = 0; i < retries; i++) {
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`🔄 Fetching subscription data (attempt ${i + 1}/${retries})...`);
          
          // Fetch data and check if subscription is now valid
          const token = localStorage.getItem("token");
          try {
            const response = await axios.get("/api/admin/res-periods", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const { res_date, end_date, periods } = response.data;
            
            if (end_date) {
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              const endDateStr = end_date.split("T")[0] || end_date;
              
              const timeDifference = new Date(endDateStr).getTime() - new Date(todayStr).getTime();
              const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
              
              console.log(`   📅 Days remaining: ${daysRemaining}`);
              
              if (daysRemaining > 0) {
                subscriptionValid = true;
                console.log("✅ Subscription is now valid! Stopping retries.");
                // Update state with valid data
                setDaysRemaining(daysRemaining);
                setSubscriptionChecked(true);
                setPopupShown(false); // Reset popup flag since subscription is valid
                break;
              }
            }
          } catch (error) {
            console.error(`   ❌ Error on attempt ${i + 1}:`, error.message);
          }
        }
        
        if (!subscriptionValid) {
          console.warn("⚠️ Subscription data may not have updated yet. Keeping payment flag active longer.");
        }
        
        // Keep flag active for additional time to ensure popup doesn't show
        setTimeout(() => {
          console.log("✅ Payment completion flag reset - subscription should be valid now");
          setPaymentJustCompleted(false);
        }, subscriptionValid ? 3000 : 8000); // Longer delay if subscription not validated
      };
      
      fetchWithRetry();
    } else {
      // Normal fetch (not after payment)
      setSubscriptionChecked(false);
      fetchSubscriptionData();
    }
  }, [location.pathname, location.search, navigate, fetchSubscriptionData]); // Refetch when route or query params change

  useEffect(() => {
    // Only show popup if:
    // 1. Subscription has been checked
    // 2. Days remaining is <= 0 (expired) - THIS IS THE REAL CHECK
    // 3. Payment was NOT just completed (to prevent during payment flow)
    // 4. No recent payment in localStorage (persists across navigation)
    // 5. Popup hasn't been shown yet (to prevent duplicate popups)
    
    const hasRecentPayment = checkRecentPayment();
    
    if (
      subscriptionChecked && 
      daysRemaining !== null && 
      daysRemaining <= 0 && 
      !paymentJustCompleted &&
      !hasRecentPayment &&
      !popupShown
    ) {
      console.log("⚠️ Showing subscription expired popup", {
        daysRemaining,
        subscriptionChecked,
        paymentJustCompleted,
        hasRecentPayment,
        popupShown
      });
      
      setPopupShown(true); // Mark popup as shown
      
      Swal.fire({
        title: "Subscription Expired",
        text: "Your Subscription is expired. Pay now to renew the subscription.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Pay Now",
        allowOutsideClick: false,
      }).then((result) => {
        // Only open payment modal if user clicked "Pay Now"
        if (result.isConfirmed) {
          setShowPaymentModal(true);
        }
      });
    } else if (subscriptionChecked && daysRemaining !== null && daysRemaining > 0) {
      // If subscription is valid, reset popup shown flag and clear payment timestamp
      if (popupShown) {
        console.log("✅ Subscription is now valid. Resetting popup flag.");
        setPopupShown(false);
      }
      // Clear payment timestamp if subscription is valid (payment was successful)
      localStorage.removeItem('subscription_payment_timestamp');
      console.log("✅ Subscription is valid. Days remaining:", daysRemaining);
    } else if (hasRecentPayment && daysRemaining !== null && daysRemaining <= 0) {
      // If there's a recent payment but subscription still shows expired,
      // it might be a timing issue - wait a bit and refetch
      console.log("⏳ Recent payment detected but subscription still expired. Waiting for database update...");
      setTimeout(() => {
        fetchSubscriptionData();
      }, 3000);
    }
  }, [daysRemaining, subscriptionChecked, paymentJustCompleted, popupShown, fetchSubscriptionData]);


  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function checkout(totalAmount, periods) {
    try {
      // Check if Razorpay key is configured
      if (!VITE_ENCRYPTION_RAZORPAY_KEY) {
        toast.error("Razorpay key not configured. Please check your .env file.");
        console.error("VITE_ENCRYPTION_RAZORPAY_KEY is not set in frontend .env file");
        return;
      }

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
      } = await axios.post("api/admin/usermakepaymentsubscription", {
        amount: totalAmount, // Send total amount (subtotal + GST) to backend
      });

      if (!order || !order.id) {
        toast.error("Failed to create payment order");
        return;
      }

      const options = {
        key: VITE_ENCRYPTION_RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "Mauli Dairy",
        description: "Subscription Payment",
        image: "/mauli_logo.png",
        order_id: order.id,
        callback_url: "/api/admin/paymentVerificationSubscription",
        prefill: {
          name: username,
          email: userEmail,
          contact: userContact,
        },
        notes: {
          dairy_name: username,
          contact: userContact,
          email: userEmail,
          periods: periods,
          amount: totalAmount, // Total amount (subtotal + GST)
          subtotal: subtotal, // Subtotal for reference
          gst: gst, // GST amount for reference
        },
        theme: {
          color: "#000000",
        },
        handler: function (response) {
          // Payment successful - callback_url will handle the rest
          console.log("Payment successful:", response);
          // Store payment timestamp in localStorage (persists across navigation)
          localStorage.setItem('subscription_payment_timestamp', Date.now().toString());
          console.log("💾 Payment timestamp saved to localStorage (from handler)");
          // Close the payment modal immediately after payment
          setShowPaymentModal(false);
          // Set flag to prevent expired popup from showing
          setPaymentJustCompleted(true);
          // The backend will redirect to /admin-dashboard?payment=success
          // The redirect handler will take care of the rest
        },
        modal: {
          ondismiss: function() {
            console.log("Payment modal closed");
            // Don't close the subscription plan modal if payment was dismissed
            // Only close if payment was successful (handled in handler)
          }
        }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.error("Error in checkout:", error);
      const errorMessage = error.response?.data?.message || error.message || "Payment initialization failed";
      toast.error(errorMessage);
    }
  }

  return (
    <div>
      <WindowHeader dashboardText="Admin Dashboard" />
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
          <div className="mt-4">
            <h3 className="heading">Admin Dashboard</h3>
            <p className="mt-3" style={{ fontSize: "16px", color: "#666" }}>
              Welcome to the Admin Dashboard. Use the sidebar menu to navigate to different sections.
            </p>
            <p style={{ fontSize: "16px", color: "#666" }}>
              To register new users, go to <strong>Registration</strong> in the sidebar menu.
            </p>
          </div>

          <Modal
            show={showPaymentModal}
            onHide={() => {
              // Only close modal, don't show popup again if payment was just completed
              if (!paymentJustCompleted) {
                setShowPaymentModal(false);
              } else {
                // If payment was completed, just close the modal silently
                setShowPaymentModal(false);
              }
            }}
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
                        <Card.Text style={{ textAlign: "center" }}>
                          (30 days)
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
                        <Card.Text style={{ textAlign: "center" }}>
                          (90 days)
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
                        <Card.Text style={{ textAlign: "center" }}>
                          (180 days)
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
                          <Card.Title className="card_title">
                            Platinum
                          </Card.Title>
                        </center>
                        <center>
                          <h5 className="price mb-2">{formatPriceBreakdown(1499).display}</h5>
                        </center>
                        <Card.Text style={{ textAlign: "center" }}>
                          (365 days)
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
        </Container>
      </div>
    </div>
  );
}

export default Admin_Dashboard;
