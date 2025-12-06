import React, { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import DataTable from "react-data-table-component";
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
  
  // Delivery boy monthly report states
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyReportData, setMonthlyReportData] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [deliveryBoyInfo, setDeliveryBoyInfo] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchDailyReport();
    fetchDeliveryBoys();
  }, []);

  useEffect(() => {
    // Auto-select first delivery boy on load
    if (deliveryBoys.length > 0 && !selectedDeliveryBoy) {
      setSelectedDeliveryBoy(deliveryBoys[0].id.toString());
    }
  }, [deliveryBoys]);

  useEffect(() => {
    if (selectedDeliveryBoy && selectedMonth && selectedYear) {
      fetchDeliveryBoyMonthlyReport();
      fetchDailyReport(); // Refresh cards when month/year changes
    }
  }, [selectedDeliveryBoy, selectedMonth, selectedYear]);

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/daily-report", {
        params: {
          year: selectedYear,
          month: selectedMonth,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.success) {
        setReportData(response.data.data);
        setDate(response.data.period || response.data.date);
      }
    } catch (error) {
      console.error("Error fetching daily report:", error);
      toast.error("Failed to fetch daily report data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryBoys = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/milk-distribution", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.success) {
        // Extract unique delivery boys from the distribution data
        const uniqueDeliveryBoys = [];
        const seenIds = new Set();
        
        response.data.data.forEach((dist) => {
          if (!seenIds.has(dist.delivery_boy_id)) {
            seenIds.add(dist.delivery_boy_id);
            uniqueDeliveryBoys.push({
              id: dist.delivery_boy_id,
              name: dist.delivery_boy_name,
              email: dist.delivery_boy_email,
            });
          }
        });
        
        setDeliveryBoys(uniqueDeliveryBoys);
      }
    } catch (error) {
      console.error("Error fetching delivery boys:", error);
      toast.error("Failed to fetch delivery boys list");
    }
  };

  const fetchDeliveryBoyMonthlyReport = async () => {
    if (!selectedDeliveryBoy) return;
    
    try {
      setMonthlyLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/delivery-boy-monthly-report", {
        params: {
          delivery_boy_id: selectedDeliveryBoy,
          year: selectedYear,
          month: selectedMonth,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.success) {
        setMonthlyReportData(response.data.data);
        setDeliveryBoyInfo(response.data.delivery_boy);
      }
    } catch (error) {
      console.error("Error fetching delivery boy monthly report:", error);
      toast.error("Failed to fetch monthly report data");
      setMonthlyReportData([]);
    } finally {
      setMonthlyLoading(false);
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
                  {(reportData.overall_total_milk || 0).toFixed(2)} ltr
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
                  {(reportData.total_milk_given_to_delivery_boy || 0).toFixed(2)} ltr
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
                  {(reportData.total_milk_delivered || 0).toFixed(2)} ltr
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
                  {(reportData.remaining_milk || 0).toFixed(2)} ltr
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Boy Monthly Report Section */}
        <div className="mt-5">
          <h3 className="mb-4">Delivery Boy Monthly Report</h3>
          
          {/* Filters */}
          <div className="row mb-4 daily-report-filters">
            <div className="col-md-4 mb-3">
              <label className="form-label fw-bold" style={{ display: "block", marginBottom: "8px" }}>
                Select Delivery Boy:
              </label>
              <select
                className="form-control"
                value={selectedDeliveryBoy}
                onChange={(e) => setSelectedDeliveryBoy(e.target.value)}
                style={{ width: "100%", marginTop: "0" }}
              >
                <option value="">Select Delivery Boy</option>
                {deliveryBoys.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.name} ({db.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label fw-bold" style={{ display: "block", marginBottom: "8px" }}>
                Select Month:
              </label>
              <select
                className="form-control"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                style={{ width: "100%", marginTop: "0" }}
              >
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label fw-bold" style={{ display: "block", marginBottom: "8px" }}>
                Select Year:
              </label>
              <select
                className="form-control"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{ width: "100%", marginTop: "0" }}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Report Table */}
          {monthlyLoading ? (
            <div className="text-center" style={{ padding: "50px" }}>
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3">Loading monthly report...</p>
            </div>
          ) : monthlyReportData.length > 0 ? (
            <>
              {deliveryBoyInfo && (
                <div className="mb-3">
                  <h5>
                    Report for: <strong>{deliveryBoyInfo.name}</strong> ({deliveryBoyInfo.email}) -{" "}
                    {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h5>
                </div>
              )}
              <div className="table-responsive">
                <DataTable
                  columns={[
                    {
                      name: "Sr No.",
                      selector: (row, index) => index + 1,
                      sortable: true,
                      width: "70px",
                    },
                    {
                      name: "Date",
                      selector: (row) =>
                        new Date(row.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }),
                      sortable: true,
                      width: "120px",
                    },
                    {
                      name: "Pure Given (ltr)",
                      selector: (row) => (row.pure_given || 0).toFixed(2),
                      sortable: true,
                    },
                    {
                      name: "Cow Given (ltr)",
                      selector: (row) => (row.cow_given || 0).toFixed(2),
                      sortable: true,
                    },
                    {
                      name: "Buffalo Given (ltr)",
                      selector: (row) => (row.buffalo_given || 0).toFixed(2),
                      sortable: true,
                    },
                    {
                      name: "Total Given (ltr)",
                      selector: (row) => (row.milk_given || 0).toFixed(2),
                      sortable: true,
                    },
                    {
                      name: "Pure Delivered (ltr)",
                      selector: (row) => (row.pure_delivered || 0).toFixed(2),
                      sortable: true,
                    },
                    {
                      name: "Cow Delivered (ltr)",
                      selector: (row) => (row.cow_delivered || 0).toFixed(2),
                      sortable: true,
                    },
                    {
                      name: "Buffalo Delivered (ltr)",
                      selector: (row) => (row.buffalo_delivered || 0).toFixed(2),
                      sortable: true,
                    },
                    {
                      name: "Total Delivered (ltr)",
                      selector: (row) => (row.milk_delivered || 0).toFixed(2),
                      sortable: true,
                    },
                    {
                      name: "Pure Remaining (ltr)",
                      selector: (row) => (row.pure_remaining || 0).toFixed(2),
                      sortable: true,
                      cell: (row) => {
                        const remaining = row.pure_remaining || 0;
                        return (
                          <span
                            style={{
                              color: remaining < 0 ? "red" : "inherit",
                              fontWeight: remaining < 0 ? "bold" : "normal",
                            }}
                          >
                            {remaining.toFixed(2)}
                          </span>
                        );
                      },
                    },
                    {
                      name: "Cow Remaining (ltr)",
                      selector: (row) => (row.cow_remaining || 0).toFixed(2),
                      sortable: true,
                      cell: (row) => {
                        const remaining = row.cow_remaining || 0;
                        return (
                          <span
                            style={{
                              color: remaining < 0 ? "red" : "inherit",
                              fontWeight: remaining < 0 ? "bold" : "normal",
                            }}
                          >
                            {remaining.toFixed(2)}
                          </span>
                        );
                      },
                    },
                    {
                      name: "Buffalo Remaining (ltr)",
                      selector: (row) => (row.buffalo_remaining || 0).toFixed(2),
                      sortable: true,
                      cell: (row) => {
                        const remaining = row.buffalo_remaining || 0;
                        return (
                          <span
                            style={{
                              color: remaining < 0 ? "red" : "inherit",
                              fontWeight: remaining < 0 ? "bold" : "normal",
                            }}
                          >
                            {remaining.toFixed(2)}
                          </span>
                        );
                      },
                    },
                    {
                      name: "Total Remaining (ltr)",
                      selector: (row) => (row.remaining_milk || 0).toFixed(2),
                      sortable: true,
                      cell: (row) => {
                        const remaining = row.remaining_milk || 0;
                        return (
                          <span
                            style={{
                              color: remaining < 0 ? "red" : "inherit",
                              fontWeight: remaining < 0 ? "bold" : "normal",
                            }}
                          >
                            {remaining.toFixed(2)}
                          </span>
                        );
                      },
                    },
                  ]}
                  data={monthlyReportData}
                  customStyles={{
                    headCells: {
                      style: {
                        backgroundColor: "#FFAC30",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "15px",
                        textAlign: "center",
                      },
                    },
                  }}
                  pagination
                  highlightOnHover
                  responsive
                />
              </div>
            </>
          ) : selectedDeliveryBoy ? (
            <div className="alert alert-info mt-3">
              No data available for the selected month and delivery boy.
            </div>
          ) : (
            <div className="alert alert-secondary mt-3">
              Loading delivery boys...
            </div>
          )}
        </div>
      </Container>
      </div>
    </div>
  );
}

export default Daily_Report;

