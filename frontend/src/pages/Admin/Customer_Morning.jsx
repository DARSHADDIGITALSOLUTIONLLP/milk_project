import React, { useState, useEffect, useRef } from "react";
import WindowHeader from "../../window_partial/window_header";
import { Container, Button, Modal, Row, Col } from "react-bootstrap";
import DataTable from "react-data-table-component";
import axios from "axios";
import "../../window_partial/window.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../SuperAdmin/Dairy_List.css";
import useResponsiveHideableColumns from "../../hooks/useResponsiveHideableColumns";
import "../User/User_Dashboard.css";

function Customer_Morning() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDairyCardModal, setShowDairyCardModal] = useState(false);
  const [selectedCustomerForView, setSelectedCustomerForView] = useState(null);
  const [dairyCardData, setDairyCardData] = useState({
    dairyName: "",
    dairyLogo: null,
    adminName: "",
    quantity: 0,
    rate: 0,
    milkType: "",
    orders: [],
    vacations: [],
    paymentDetails: {},
    paymentHistory: [],
  });
  const [activeMonth, setActiveMonth] = useState(new Date());
  const [loadingDairyCard, setLoadingDairyCard] = useState(false);
  const [currentPaymentDetails, setCurrentPaymentDetails] = useState({});
  const deliveryTimeouts = useRef({});
  const [dateTime, setDateTime] = useState(new Date());
  const [quantity, setQuantity] = useState(0);
  const [after2pm, setAfter2pm] = useState(new Date().getHours() >= 14);
  const [columnPage, setColumnPage] = useState(0);
  const [columnsPerPage, setColumnsPerPage] = useState(() => {
    const width = window.innerWidth || 0;
    if (width <= 600) return 3; // mobile
    if (width <= 1024) return 4; // tablet
    return 100; // desktop - effectively all columns
  });

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const currentDate = new Date().toISOString().split("T")[0];
    try {
      const response = await axios.get("/api/admin/users/All-morning-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userIds = response.data.orders.map((order) => order.userid);

      const initialRecords = response.data.orders.map((record) => ({
        ...record,
        status: "Active",
        delivery_status: "Pending",
      }));

      setRecords(initialRecords);
      const responseStatus = await axios.get("/api/admin/deliveryStatus", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const todayDeliveries = responseStatus.data.orders.filter(
        (item) =>
          item.date.split("T")[0] === currentDate && item.shift === "morning"
      );

      const statusMap = new Map(
        todayDeliveries.map((item) => [
          Number(item.userid),
          item.status === true ? "Delivered" : "Not Delivered",
        ])
      );

      const updatedRecords = initialRecords.map((record) => ({
        ...record,
        delivery_status: statusMap.has(Number(record.id))
          ? statusMap.get(Number(record.id))
          : "Pending",
      }));

      setRecords(updatedRecords);
    } catch (error) {
      console.error("Error fetching user request:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.put(
        `/api/admin/update-quantity/${selectedRecord.id}`,
        {
          newQuantity: quantity,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Quantity updated successfully...");
      setShowDetailsModal(false);
    } catch (error) {
      console.log(error.message);
      toast.error("Failed to update the quantity");
    }
  };

  const handleFilter = (event) => {
    const value = event.target.value.toLowerCase();
    const filteredData = records.filter((row) => {
      return (
        row.name.toLowerCase().includes(value) ||
        row.address.toLowerCase().includes(value) ||
        row.status.toLowerCase().includes(value)
      );
    });
    setSearchTerm(value);
    setFilteredRecords(filteredData);
  };
  const [filteredRecords, setFilteredRecords] = useState([]);

  useEffect(() => {
    setFilteredRecords(records);
  }, [records]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleStatusToggle = (id) => {
    const selected = records.find((record) => record.id === id);
    setSelectedRecord(selected);
    setShowConfirmation(true);
  };

  const closeModal = () => {
    setShowConfirmation(false);
    setSelectedRecord(null);
    setShowDetailsModal(false);
  };

  const handleViewClick = (row) => {
    setSelectedRecord(row);
    setShowDetailsModal(true);
  };

  const handleDairyCardView = async (row) => {
    setSelectedCustomerForView(row);
    setShowDairyCardModal(true);
    setLoadingDairyCard(true);
    
    try {
      const token = localStorage.getItem("token");
      
      const [dairyInfoRes, ordersRes, paymentSummaryRes, ratesRes] = await Promise.allSettled([
        axios.get(`/api/admin/customer/${row.id}/dairy-info`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/admin/customer/${row.id}/delivered-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/admin/customer/${row.id}/payment-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/admin/customer/${row.id}/rates`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (dairyInfoRes.status === 'fulfilled') {
        const data = dairyInfoRes.value.data;
        setDairyCardData(prev => ({
          ...prev,
          dairyName: data.dairy_name || row.dairy_name || "Mauli Dairy",
          dairyLogo: data.dairy_logo ? `data:image/jpeg;base64,${data.dairy_logo}` : null,
          adminName: data.admin_name || row.name || "Customer",
        }));
      } else {
        setDairyCardData(prev => ({
          ...prev,
          dairyName: row.dairy_name || "Mauli Dairy",
          adminName: row.name || "Customer",
        }));
      }

      if (ordersRes.status === 'fulfilled') {
        const orders = ordersRes.value.data.orders || [];
        
        // 🔍 DEBUG: Log orders to check status values
        console.log('📦 Dairy Card Orders received:', orders.length);
        const notPresentOrders = orders.filter(o => o.status === false || o.status === 0 || o.status === "false");
        console.log('❌ Not Present orders found:', notPresentOrders.length);
        if (notPresentOrders.length > 0) {
          console.log('Not present details:', notPresentOrders.map(o => ({
            date: o.date,
            shift: o.shift,
            status: o.status,
            statusType: typeof o.status
          })));
        }
        
        setDairyCardData(prev => ({
          ...prev,
          orders: orders.map(order => ({
            cow_quantity: order.cow_quantity || 0,
            buffalo_quantity: order.buffalo_quantity || 0,
            pure_quantity: order.pure_quantity || 0,
            shift: order.shift,
            order_date: order.date || order.order_date,
            status: order.status,
          })),
        }));
      }

      if (paymentSummaryRes.status === 'fulfilled') {
        const data = paymentSummaryRes.value.data;
        setDairyCardData(prev => ({
          ...prev,
          paymentHistory: data.paymentHistory || [],
        }));
      }

      if (ratesRes.status === 'fulfilled') {
        const data = ratesRes.value.data;
        setDairyCardData(prev => ({
          ...prev,
          rate: data.rate || 0,
          quantity: data.quantity || 0,
          milkType: data.milk_type || row.milk_type || "",
        }));
      } else {
        setDairyCardData(prev => ({
          ...prev,
          milkType: row.milk_type || "",
        }));
      }

    } catch (error) {
      console.error("Error fetching dairy card data:", error);
      setDairyCardData(prev => ({
        ...prev,
        dairyName: row.dairy_name || "Mauli Dairy",
        adminName: row.name || "Customer",
        milkType: row.milk_type || "",
      }));
    } finally {
      setLoadingDairyCard(false);
    }
  };

  // Update payment details when month changes
  useEffect(() => {
    if (showDairyCardModal) {
      const selectedMonth = activeMonth.getMonth() + 1;
      const selectedYear = activeMonth.getFullYear();
      const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

      // Try to find entry for current month
      let entry = dairyCardData.paymentHistory.find((p) => p.month_year === monthStr);

      // If no entry for current month, use the most recent entry
      if (!entry && dairyCardData.paymentHistory.length > 0) {
        entry = dairyCardData.paymentHistory[0]; // Most recent (already sorted DESC)
      }

      if (entry) {
        const endDate = new Date(selectedYear, selectedMonth, 0);
        setCurrentPaymentDetails({
          start_date: entry.start_date || "",
          end_date: endDate.toISOString().split("T")[0],
          payment: entry.payment || 0,
          totalbalancepayment: entry.pending_payment || 0,
          delivery_charges: entry.delivery_charges || 0,
          advance_payment: entry.advancePayment || selectedCustomerForView?.advance_payment || 0,
          status: entry.pending_payment === 0 ? "true" : "false",
          received_payment: entry.received_payment || 0,
        });
      } else {
        // Initialize with default values if no payment history exists
        setCurrentPaymentDetails({
          start_date: "",
          end_date: "",
          payment: 0,
          totalbalancepayment: 0,
          delivery_charges: 0,
          advance_payment: selectedCustomerForView?.advance_payment || 0,
          status: "false",
          received_payment: 0,
        });
      }
    }
  }, [activeMonth, dairyCardData.paymentHistory, showDairyCardModal, selectedCustomerForView]);

  const confirmStatusChange = async (status) => {
    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `/api/admin/users/${selectedRecord.id}/request`,
        { request: status }, // Change made here
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("User has been successfully marked as inactive.");
      const updatedRecords = records.filter(
        (record) => record.id !== selectedRecord.id
      );
      setRecords(updatedRecords);
      setShowConfirmation(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // const handleDeliveryToggle = (id) => {
  //   const updatedRecords = records.map((record) => {
  //     if (record.id === id) {
  //       if (!record.delivery) {
  //         setTimeout(() => {
  //           setRecords((prevRecords) =>
  //             prevRecords.map((prevRecord) =>
  //               prevRecord.id === id
  //                 ? { ...prevRecord, delivery: false, lock: false }
  //                 : prevRecord
  //             )
  //           );
  //         }, 24 * 60 * 60 * 1000); // 24 hours
  //         return { ...record, delivery: true, lock: true };
  //       }
  //     }
  //     return record;
  //   });
  //   setRecords(updatedRecords);
  // };
  const handleDeliveryToggle = async (id, currentStatus) => {
    const token = localStorage.getItem("token");
    const newStatus =
      currentStatus === "Delivered" ? "Not Delivered" : "Delivered";

    try {
      const response = await axios.put(
        `/api/admin/update_delivery_status/${id}`,
        { status: newStatus === "Delivered", shift: "morning" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status !== 200) throw new Error("Failed to update");

      const updatedRecords = records.map((record) =>
        record.id === id
          ? {
              ...record,
              delivery_status: newStatus,
              delivered_status: newStatus === "Delivered",
            }
          : record
      );
      setRecords(updatedRecords);
    } catch (error) {
      console.error("Delivery update failed:", error);
    }
  };

  useEffect(() => {
    if (!after2pm) {
      const now = new Date();
      const target = new Date();
      target.setHours(14, 0, 0, 0); // 2:00:00 PM

      const timeUntil2PM = target.getTime() - now.getTime();

      if (timeUntil2PM > 0) {
        const timer = setTimeout(() => {
          setAfter2pm(true); // Enable checkbox
        }, timeUntil2PM);

        return () => clearTimeout(timer);
      }
    }
  }, [after2pm]);

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: "#FFAC30",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "15px",
        textAlign: "center",
      },
    },
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return; // Can't move first item up
    const newRecords = [...filteredRecords];
    [newRecords[index - 1], newRecords[index]] = [newRecords[index], newRecords[index - 1]];
    setFilteredRecords(newRecords);
    setRecords(newRecords);
    await saveSequence(newRecords);
  };

  const handleMoveDown = async (index) => {
    if (index === filteredRecords.length - 1) return; // Can't move last item down
    const newRecords = [...filteredRecords];
    [newRecords[index], newRecords[index + 1]] = [newRecords[index + 1], newRecords[index]];
    setFilteredRecords(newRecords);
    setRecords(newRecords);
    await saveSequence(newRecords);
  };

  const saveSequence = async (orderedRecords) => {
    const token = localStorage.getItem("token");
    try {
      const customerIds = orderedRecords.map((record) => record.id);
      await axios.put(
        "/api/admin/users/update-delivery-sequence",
        {
          customerIds: customerIds,
          shift: "morning",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Delivery sequence updated successfully");
    } catch (error) {
      console.error("Error updating sequence:", error);
      toast.error("Failed to update sequence");
      // Revert on error
      fetchData();
    }
  };

  const allColumns = [
    {
      id: "sequence",
      name: "Sequence",
      cell: (row) => {
        const index = filteredRecords.findIndex((r) => r.id === row.id);
        const sequenceValue = row.delivery_sequence_morning !== null && row.delivery_sequence_morning !== undefined 
          ? row.delivery_sequence_morning 
          : index + 1;
        return (
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => handleMoveUp(index)}
              disabled={index === 0}
              style={{ padding: "2px 8px" }}
            >
              ↑
            </Button>
            <span style={{ minWidth: "30px", textAlign: "center" }}>
              {sequenceValue}
            </span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => handleMoveDown(index)}
              disabled={index === filteredRecords.length - 1}
              style={{ padding: "2px 8px" }}
            >
              ↓
            </Button>
          </div>
        );
      },
      width: "120px",
    },
    {
      id: "srNo",
      name: "Sr No.",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      id: "name",
      name: "Customer Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      id: "address",
      name: "Address",
      selector: (row) => row.address,
      sortable: true,
      cell: (row) => (
        <div className="hover-container">
          <span className="address-preview">{row.address.slice(0, 15)}...</span>
          <div className="address-popup">{row.address}</div>
        </div>
      ),
    },
    {
      id: "status",
      name: "Status",
      selector: (row) => (
        <Button
          variant={row.status === "Active" ? "success" : "danger"}
          onClick={() => handleStatusToggle(row.id)}
        >
          {row.status}
        </Button>
      ),
      sortable: true,
    },
    {
      id: "startDate",
      name: "Start Date",
      selector: (row) => {
        const date = new Date(row.start_date);
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
      },
      sortable: true,
    },

    {
      id: "shift",
      name: "Shift",
      selector: () => "Morning",
      sortable: true,
    },
    {
      id: "vacationMode",
      name: "Vacation Mode",
      selector: (row) => (row.vacation_mode_morning ? "ON" : "OFF"),
      sortable: true,
    },
    {
      id: "delivery",
      name: "Delivery",
      selector: (row) => (
        <>
          <input
            key={row.userid}
            type="checkbox"
            checked={row.delivery_status === "Delivered"}
            disabled={row.delivery_status !== "Pending"}
            onChange={() => handleDeliveryToggle(row.id, row.delivery_status)}
          />
          <span>{row.delivery_status}</span>
        </>
      ),
      sortable: true,
    },
    {
      id: "actions",
      name: "Actions",
      cell: (row) => (
        <div style={{ display: "flex", gap: "5px" }}>
          <Button 
            variant="info" 
            size="sm" 
            onClick={() => handleDairyCardView(row)}
            style={{ fontSize: "11px", padding: "2px 8px", whiteSpace: "nowrap" }}
          >
            View
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleViewClick(row)}
            style={{ fontSize: "11px", padding: "2px 8px", whiteSpace: "nowrap" }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  const effectiveColumnsPerPage = Math.min(
    columnsPerPage,
    allColumns.length || columnsPerPage
  );
  const maxColumnPage = Math.max(
    0,
    Math.ceil(allColumns.length / effectiveColumnsPerPage) - 1
  );
  const safeColumnPage = Math.min(columnPage, maxColumnPage);
  const columnStart = safeColumnPage * effectiveColumnsPerPage;
  const columnEnd = columnStart + effectiveColumnsPerPage;
  const pagedColumnsRaw = allColumns.slice(columnStart, columnEnd);

  const columns = useResponsiveHideableColumns(pagedColumnsRaw, {
    resetKey: safeColumnPage,
  });

  useEffect(() => {
    return () => {
      Object.values(deliveryTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth || 0;
      setIsSmallScreen(width <= 600);

      if (width <= 600) {
        // Use 2 columns on very small screens to avoid content being cut
        setColumnsPerPage(2);
      } else if (width <= 1024) {
        setColumnsPerPage(4);
      } else {
        setColumnsPerPage(100);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <WindowHeader dashboardText="Customer List (Morning)" />
      <div
        style={{
          marginTop: isSmallScreen ? "70px" : "0px",
        }}
      >
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
        <Container fluid className="main-content mt-5">
          <div className="row">
            <div className="col-md-6 col-sm-12 pt-4">
              <p>Today's Status: {dateTime.toLocaleString()} </p>
            </div>
            <div className="col-md-6 col-sm-12 pt-2">
              <div className="text-end mb-3">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={handleFilter}
                  className="w-full lg:w-96 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition duration-300 ease-in-out"
                />
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredRecords}
            customStyles={customStyles}
            pagination
            highlightOnHover
            responsive
          />
          {maxColumnPage > 0 && (
            <div className="d-flex justify-content-start align-items-center mt-2 gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={safeColumnPage === 0}
                onClick={() =>
                  setColumnPage((prev) => (prev > 0 ? prev - 1 : prev))
                }
              >
                ◀
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={safeColumnPage >= maxColumnPage}
                onClick={() =>
                  setColumnPage((prev) =>
                    prev < maxColumnPage ? prev + 1 : prev
                  )
                }
              >
                ▶
              </button>
            </div>
          )}
        </Container>

        <Modal show={showConfirmation} onHide={closeModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Status Change</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to change the status of{" "}
            {selectedRecord?.dairy_name}?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => confirmStatusChange(false)}
            >
              Confirm
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showDetailsModal}
          onHide={closeModal}
          centered
          style={{ padding: "21px" }}
        >
          <Modal.Header closeButton>
            <Modal.Title>{selectedRecord?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col mb-1">Milk Quantity</div>
              <div className="row">
                <div className="col-12">
                  <input
                    type="text"
                    style={{ width: "100%" }}
                    placeholder="Enter Milk Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Modal.Body>

          <div className="row mt-4">
            <div className="col-3">
              <Button
                variant="secondary"
                onClick={closeModal}
                style={{ marginLeft: "14px" }}
              >
                Close
              </Button>
            </div>
            <div className="col-3">
              <Button variant="primary" onClick={handleEdit}>
                Submit
              </Button>
            </div>
          </div>
        </Modal>

        {/* Dairy Card Modal */}
        <Modal 
          show={showDairyCardModal} 
          onHide={() => {
            setShowDairyCardModal(false);
            setSelectedCustomerForView(null);
            setDairyCardData({
              dairyName: "",
              dairyLogo: null,
              adminName: "",
              quantity: 0,
              rate: 0,
              milkType: "",
              orders: [],
              vacations: [],
              paymentDetails: {},
              paymentHistory: [],
            });
          }}
          size="xl"
          fullscreen="lg-down"
        >
          <Modal.Header closeButton style={{ backgroundColor: "#FFAC30" }}>
            <Modal.Title style={{ fontSize: isSmallScreen ? "14px" : "18px" }}>
              Customer Dairy Card & Summary
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: "80vh", overflowY: "auto" }}>
            {loadingDairyCard ? (
              <div className="text-center p-4">
                <p>Loading customer data...</p>
              </div>
            ) : (
              <Row>
                <Col lg={6} md={12} className="mt-2">
                  {/* Dairy Card */}
                  <div className="milk-card-container">
                    <div className="card-header-section">
                      <div className="card-header-left" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        {dairyCardData.dairyLogo && (
                          <img
                            src={dairyCardData.dairyLogo}
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
                            {dairyCardData.dairyName || "Mauli Dairy"}
                          </h5>
                          <p style={{ margin: 0, fontSize: "14px" }}>
                            Customer Name: {dairyCardData.adminName || selectedCustomerForView?.name || "Customer"}
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
                              
                              const morningOrders = dairyCardData.orders.filter(
                                (q) => q.order_date === dateStr && q.shift === "morning"
                              );
                              const eveningOrders = dairyCardData.orders.filter(
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
                                
                                const selectedMilkType = dairyCardData.milkType?.toLowerCase();
                                if (selectedMilkType === "cow") return total.cow;
                                if (selectedMilkType === "buffalo") return total.buffalo;
                                if (selectedMilkType === "pure") return total.pure;
                                return total.cow + total.buffalo + total.pure;
                              };
                              
                              const getStatus = (orders) => {
                                if (!orders.length) return "none";
                                const hasNotPresent = orders.some(
                                  (order) =>
                                    order.status === false ||
                                    order.status === 0 ||
                                    order.status === "false"
                                );
                                // 🔍 DEBUG: Log status check for debugging
                                const today = new Date().toISOString().split('T')[0];
                                if (orders.length > 0 && dateStr === today) {
                                  console.log(`🔍 Status check for ${dateStr}:`, orders.map(o => ({ shift: o.shift, status: o.status, type: typeof o.status })), 'Result:', hasNotPresent ? 'not_present' : 'present');
                                }
                                return hasNotPresent ? "not_present" : "present";
                              };
                              
                              return {
                                morning: getMilkQty(morningOrders),
                                evening: getMilkQty(eveningOrders),
                                morningStatus: getStatus(morningOrders),
                                eveningStatus: getStatus(eveningOrders),
                              };
                            };

                            const data1 = getDateData(date1);
                            const data2 = date2 <= daysInMonth ? getDateData(date2) : null;

                            return (
                              <tr key={i}>
                                <td className="date-cell">{date1}</td>
                                <td className="qty-cell">
                                  {data1?.morningStatus === "not_present"
                                    ? <span style={{ color: "#dc3545", fontWeight: 700 }}>✖</span>
                                    : data1?.morning > 0
                                    ? data1.morning
                                    : ""}
                                </td>
                                <td className="qty-cell">
                                  {data1?.eveningStatus === "not_present"
                                    ? <span style={{ color: "#dc3545", fontWeight: 700 }}>✖</span>
                                    : data1?.evening > 0
                                    ? data1.evening
                                    : ""}
                                </td>
                                <td className="date-cell">{date2 <= daysInMonth ? date2 : ""}</td>
                                <td className="qty-cell">
                                  {data2?.morningStatus === "not_present"
                                    ? <span style={{ color: "#dc3545", fontWeight: 700 }}>✖</span>
                                    : data2?.morning > 0
                                    ? data2.morning
                                    : ""}
                                </td>
                                <td className="qty-cell">
                                  {data2?.eveningStatus === "not_present"
                                    ? <span style={{ color: "#dc3545", fontWeight: 700 }}>✖</span>
                                    : data2?.evening > 0
                                    ? data2.evening
                                    : ""}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Col>

                <Col lg={6} md={12} className="mt-2" style={{ paddingTop: "35px" }}>
                  {/* Summary Section */}
                  <div
                    className="col-container p-3"
                    style={{
                      borderRadius: "3px",
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
                      style={{ borderBottom: "1px solid #CDCDCD", display: "flex" }}
                    >
                      <div className="col-6">
                        <p>
                          {dairyCardData.milkType || "N/A"} milk: {dairyCardData.quantity || 0} ltr
                        </p>
                      </div>
                      <div className="col-6 text-end">
                        <p>Rs: {dairyCardData.rate || 0}/-</p>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-6">
                        <p className="mt-1">Payment:</p>
                      </div>
                      <div className="col-6 text-end">
                        <p className="mt-1">
                          Rs: {currentPaymentDetails.payment || 0}/-
                        </p>
                      </div>
                    </div>

                    <div
                      style={{ borderBottom: "1px solid #CDCDCD", display: "flex" }}
                    >
                      <div className="col-9">
                        <p className="mt-1">Delivery Charges:</p>
                      </div>
                      <div className="col-3 text-end">
                        <p className="mt-1">
                          Rs: {currentPaymentDetails.delivery_charges || 0}/-
                        </p>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-9">
                        <p className="mt-1">Advanced Payment:</p>
                      </div>
                      <div className="col-3 text-end">
                        <p className="mt-1">
                          Rs: {currentPaymentDetails.advance_payment || selectedCustomerForView?.advance_payment || 0}/-
                        </p>
                      </div>
                    </div>

                    <div
                      style={{ borderBottom: "1px solid #CDCDCD", display: "flex" }}
                    >
                      <div className="col-9">
                        <p className="mt-1">Received Payment:</p>
                      </div>
                      <div className="col-3 text-end">
                        <p className="mt-1">
                          Rs: {currentPaymentDetails.received_payment || 0}/-
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
                            Rs: {currentPaymentDetails.totalbalancepayment || 0}/-
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowDairyCardModal(false);
              setSelectedCustomerForView(null);
            }}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default Customer_Morning;
