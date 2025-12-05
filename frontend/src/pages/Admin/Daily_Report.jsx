import React, { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import WindowHeader from "../../window_partial/window_header";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Daily_Report.css";

function Daily_Report() {
  const [reportData, setReportData] = useState({
    overall_total_milk: 0,
    total_milk_given_to_delivery_boy: 0,
    total_milk_delivered: 0,
    remaining_milk: 0,
  });
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchDailyReport();
  }, []);

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/daily-report", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.success) {
        setReportData(response.data.data);
        setDate(response.data.date);
      }
    } catch (error) {
      console.error("Error fetching daily report:", error);
      toast.error("Failed to fetch daily report data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <WindowHeader dashboardText="Daily Report" />
        <div
          style={{
            marginTop: isSmallScreen ? "70px" : "0px",
          }}
        >
          <Container fluid className="main-content mt-5">
            <div className="text-center" style={{ padding: "50px" }}>
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3">Loading daily report...</p>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div>
      <WindowHeader dashboardText="Daily Report" />
      <div
        style={{
          marginTop: isSmallScreen ? "70px" : "0px",
        }}
      >
        <Container fluid className="main-content mt-5">
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        <div className="daily-report-header">
          <h2 className="page-title">Daily Report</h2>
          <p className="report-date">
            Date: {date ? new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }) : "Today"}
          </p>
        </div>

        <div className="row mb-4 responsive-gap">
          {/* Card 1: Overall Total Milk */}
          <div className="col-md-3">
            <div
              className="card text-white text-center"
              style={{ backgroundColor: "#FFAC30" }}
            >
              <div className="card-body">
                <h5 className="card-title">Total Milk</h5>
                <p className="card-text fs-4 fw-bold">
                  {reportData.overall_total_milk.toFixed(2)} L
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Total Milk Given to Delivery Boy */}
          <div className="col-md-3">
            <div
              className="card text-white text-center"
              style={{ backgroundColor: "#FFAC30" }}
            >
              <div className="card-body">
                <h5 className="card-title">Given to Delivery</h5>
                <p className="card-text fs-4 fw-bold">
                  {reportData.total_milk_given_to_delivery_boy.toFixed(2)} L
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Total Milk Delivered */}
          <div className="col-md-3">
            <div
              className="card text-white text-center"
              style={{ backgroundColor: "#FFAC30" }}
            >
              <div className="card-body">
                <h5 className="card-title">Milk Delivered</h5>
                <p className="card-text fs-4 fw-bold">
                  {reportData.total_milk_delivered.toFixed(2)} L
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Remaining Milk */}
          <div className="col-md-3">
            <div
              className="card text-white text-center"
              style={{ backgroundColor: "#FFAC30" }}
            >
              <div className="card-body">
                <h5 className="card-title">Remaining Milk</h5>
                <p className="card-text fs-4 fw-bold">
                  {reportData.remaining_milk.toFixed(2)} L
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
      </div>
    </div>
  );
}

export default Daily_Report;

