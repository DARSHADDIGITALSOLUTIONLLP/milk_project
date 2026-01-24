import React, { useState, useEffect } from "react";
import axios from "axios";
import WindowHeader from "../../window_partial/window_header";
import {
  Container,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import DataTable from "react-data-table-component";
import "../../window_partial/window.css";
import useResponsiveHideableColumns from "../../hooks/useResponsiveHideableColumns";
import { encode } from "base64-arraybuffer";
import { toast, Bounce, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../SuperAdmin/Dairy_List.css";
import jsPDF from "jspdf";
import "jspdf-autotable";

function Farmer_Payment_History() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pureFat, setPureFat] = useState("");
  const [cowFat, setCowFat] = useState("");
  const [buffaloFat, setBuffaloFat] = useState("");
  const [selectedMilkTypes, setSelectedMilkTypes] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");

  const Farmer_List = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/farmer/pending-payment", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const flatRecords = [];

      // Check if response has farmers array
      if (response.data && response.data.farmers && Array.isArray(response.data.farmers)) {
        response.data.farmers.forEach((farmer) => {
          // Check if farmer has pending_payments array
          if (farmer.pending_payments && Array.isArray(farmer.pending_payments)) {
            farmer.pending_payments.forEach((payment) => {
              flatRecords.push({
                ...farmer,
                ...payment,
                farmer_id: farmer.farmer_id,
                status: payment.status ? "Paid" : "Pending",
              });
            });
          }
        });
      }

      setRecords(flatRecords);
      
      if (flatRecords.length === 0) {
        setError("No pending payments found for any farmers.");
      }
    } catch (error) {
      console.error("Error fetching farmers:", error);
      setError(
        error.response?.data?.message || 
        "Failed to fetch farmer payment data. Please try again."
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Farmer_List();
  }, []);

  const confirmStatusChange = async (status, paidAmountValue) => {
    const token = localStorage.getItem("token");
    try {
      // If payment has an ID, use it; otherwise use week dates
      const payload = selectedRecord.id 
        ? { status, paid_amount: paidAmountValue }
        : {
            status,
            paid_amount: paidAmountValue,
            farmer_id: selectedRecord.farmer_id,
            week_start_date: selectedRecord.week_start_date,
            week_end_date: selectedRecord.week_end_date,
          };
      
      const url = selectedRecord.id 
        ? `/api/admin/farmer/payment/${selectedRecord.id}`
        : `/api/admin/farmer/payment/null`; // Use null as placeholder when no ID

      await axios.put(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Payment status has been updated successfully.");
      closeConfirmModal();
      Farmer_List();
      setSelectedRecord(null);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update payment status.");
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmation(false);
  };

  const handleStatusToggle = (record) => {
    setSelectedRecord(record);
    // Set initial to 0 or pending amount (amount they need to pay)
    const initialPaid = record.pending_amount ?? 0;
    setPaidAmount(String(initialPaid));
    setShowConfirmation(true);
  };

  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleFilter = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);

    const filteredData = records.filter((row) => {
      return (
        row.full_name?.toLowerCase().includes(value) ||
        row.address?.toLowerCase().includes(value) ||
        row.status?.toLowerCase().includes(value)
      );
    });

    setFilteredRecords(filteredData);
  };
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [totalPayment, setTotalPayment] = useState({
    advance_payment: 0,
    received_payment: 0,
    total_pending_payment: 0,
  });
  const [columnPage, setColumnPage] = useState(0);
  const [columnsPerPage, setColumnsPerPage] = useState(() => {
    const w = window.innerWidth || 0;
    if (w <= 600) return 3;
    if (w <= 1024) return 4;
    return 100;
  });

  useEffect(() => {
    setFilteredRecords(records);
    
    // Calculate totals from records
    if (records.length > 0) {
      // Calculate advance_payment: Sum unique farmers' advance_payment (each farmer counted only once)
      const uniqueFarmers = new Map();
      records.forEach((r) => {
        const farmerId = r.farmer_id || r.id;
        if (farmerId && !uniqueFarmers.has(farmerId)) {
          uniqueFarmers.set(farmerId, parseFloat(r.advance_payment) || 0);
        }
      });
      const advancePayment = Array.from(uniqueFarmers.values()).reduce(
        (sum, amount) => sum + amount,
        0
      );

      // Calculate received_payment: Sum of paid_amount across all records
      const receivedPayment = records.reduce(
        (sum, r) => sum + (parseFloat(r.paid_amount) || 0),
        0
      );

      // Calculate total_pending_payment: Sum of pending_amount across all records
      const totalPendingPayment = records.reduce(
        (sum, r) => sum + (parseFloat(r.pending_amount) || 0),
        0
      );

      setTotalPayment({
        advance_payment: advancePayment,
        received_payment: receivedPayment,
        total_pending_payment: totalPendingPayment,
      });
    } else {
      setTotalPayment({
        advance_payment: 0,
        received_payment: 0,
        total_pending_payment: 0,
      });
    }
  }, [records]);

  const allColumns = [
    {
      id: "billNo",
      headerLabel: "Bill No.",
      selector: (row, index) => `000${index + 1}`,
      sortable: true,
    },
    {
      id: "startDate",
      headerLabel: "Start Date",
      selector: (row) => row.week_start_date || "N/A",
      sortable: true,
    },
    {
      id: "endDate",
      headerLabel: "End Date",
      selector: (row) => row.week_end_date || "N/A",
      sortable: true,
    },
    {
      id: "name",
      headerLabel: "Farmer Name",
      selector: (row) => row.full_name,
      sortable: true,
    },
    {
      id: "status",
      headerLabel: "Status",
      selector: (row) => (
        <Button
          variant={row.status === "Paid" ? "success" : "danger"}
          onClick={() => handleStatusToggle(row)}
        >
          {row.status}
        </Button>
      ),
      sortable: true,
    },
    {
      id: "pure",
      headerLabel: "Pure(ltr)",
      selector: (row) => row.total_pure_quantity,
      sortable: true,
    },
    {
      id: "cow",
      headerLabel: "Cow(ltr)",
      selector: (row) => row.total_cow_quantity,
      sortable: true,
    },
    {
      id: "buffalo",
      headerLabel: "Buffalo(ltr)",
      selector: (row) => row.total_buffalo_quantity,
      sortable: true,
    },
    {
      id: "totalPayment",
      headerLabel: "Total Payment",
      selector: (row) => {
        const total = row.total_amount ?? 0;
        return `Rs ${total}`;
      },
      sortable: true,
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
      <WindowHeader dashboardText="Farmer Payment History" />
      <div
        style={{
          marginTop: isSmallScreen ? "70px" : "0px",
        }}
      >
        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={true}
          rtl={false}
          pauseOnFocusLoss={true}
          draggable={true}
          pauseOnHover={true}
          theme="light"
        />
        <Container fluid className="main-content mt-5">
          <div className="row">
            <div className="col-md-6 col-sm-12 pt-4">
              <p>Today's Status: {dateTime.toLocaleString()} </p>
            </div>
            <div className="col-md-6 col-sm-12 pt-2">
              <div className="text-end mb-3 d-flex gap-2 justify-content-end">
                <Button
                  variant="primary"
                  onClick={() => {
                    try {
                      if (!filteredRecords || filteredRecords.length === 0) {
                        toast.error('No data available to export.');
                        return;
                      }
                      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                      const pageWidth = doc.internal.pageSize.getWidth();
                      const pageHeight = doc.internal.pageSize.getHeight();
                      let yPosition = 20;
                      doc.setFontSize(20);
                      doc.setFont(undefined, 'bold');
                      doc.text('Farmer Payment History', pageWidth / 2, yPosition, { align: 'center' });
                      yPosition += 10;
                      doc.setFontSize(12);
                      doc.setFont(undefined, 'normal');
                      doc.text(`Generated on: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth / 2, yPosition, { align: 'center' });
                      yPosition += 12;
                      doc.setFontSize(14);
                      doc.setFont(undefined, 'bold');
                      doc.text('Payment Summary', 14, yPosition);
                      yPosition += 8;
                      doc.autoTable({
                        startY: yPosition,
                        head: [['Metric', 'Value']],
                        body: [
                          ['Advanced Payment', `Rs ${totalPayment.advance_payment || 0}`],
                          ['Received Payment', `Rs ${totalPayment.received_payment || 0}`],
                          ['Total Pending Payment', `Rs ${totalPayment.total_pending_payment || 0}`],
                        ],
                        theme: 'striped',
                        headStyles: { fillColor: [255, 172, 48], textColor: [255, 255, 255], fontStyle: 'bold' },
                        styles: { fontSize: 10 },
                        margin: { left: 14, right: 14 },
                      });
                      yPosition = (doc.lastAutoTable?.finalY || yPosition) + 15;
                      doc.setFontSize(14);
                      doc.setFont(undefined, 'bold');
                      doc.text('Farmer Payment Records', 14, yPosition);
                      yPosition += 8;
                      const tableData = filteredRecords.map((row, index) => [
                        `000${index + 1}`,
                        row.week_start_date || 'N/A',
                        row.week_end_date || 'N/A',
                        row.full_name || 'N/A',
                        row.status === 'Paid' ? 'Paid' : 'Pending',
                        parseFloat(row.total_pure_quantity || 0).toFixed(2),
                        parseFloat(row.total_cow_quantity || 0).toFixed(2),
                        parseFloat(row.total_buffalo_quantity || 0).toFixed(2),
                        `Rs ${parseFloat(row.total_amount || 0).toFixed(2)}`,
                        `Rs ${parseFloat(row.paid_amount || 0).toFixed(2)}`,
                        `Rs ${parseFloat(row.pending_amount || 0).toFixed(2)}`,
                      ]);
                      doc.autoTable({
                        startY: yPosition,
                        head: [['Bill No.', 'Start Date', 'End Date', 'Farmer Name', 'Status', 'Pure (ltr)', 'Cow (ltr)', 'Buffalo (ltr)', 'Total Amount', 'Paid Amount', 'Pending Amount']],
                        body: tableData,
                        theme: 'striped',
                        headStyles: { fillColor: [255, 172, 48], textColor: [255, 255, 255], fontStyle: 'bold' },
                        styles: { fontSize: 8, cellPadding: 2 },
                        margin: { left: 14, right: 14 },
                        columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 20 }, 2: { cellWidth: 20 }, 3: { cellWidth: 30 }, 4: { cellWidth: 18 } },
                      });
                      const totalPages = doc.internal.getNumberOfPages();
                      for (let i = 1; i <= totalPages; i++) {
                        doc.setPage(i);
                        doc.setFontSize(8);
                        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                        doc.text(`Generated on: ${new Date().toLocaleString("en-US")}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
                      }
                      doc.save(`Farmer_Payment_History_${Date.now()}.pdf`);
                      toast.success('PDF exported successfully!');
                    } catch (error) {
                      console.error('Error exporting PDF:', error);
                      toast.error(`Failed to export PDF: ${error.message || 'Unknown error'}`);
                    }
                  }}
                  className="me-2"
                >
                  Export PDF
                </Button>
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

          {error && (
            <div className="alert alert-warning mt-3" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && filteredRecords.length === 0 && (
            <div className="alert alert-info mt-3" role="alert">
              No farmer payment records found. There are no pending payments to display.
            </div>
          )}

          {/* Payment Cards */}
          <div className="row mb-4 responsive-gap">
            <div className="col-md-4 col-sm-6 mb-3">
              <div
                className="card text-white text-center"
                style={{ backgroundColor: "#FFAC30" }}
              >
                <div className="card-body">
                  <h5 className="card-title" style={{ fontSize: "14px", marginBottom: "10px" }}>
                    Advanced Payment
                  </h5>
                  <p className="card-text fs-4 fw-bold" style={{ fontSize: "18px" }}>
                    Rs {totalPayment.advance_payment || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 col-sm-6 mb-3">
              <div
                className="card text-white text-center"
                style={{ backgroundColor: "#FFAC30" }}
              >
                <div className="card-body">
                  <h5 className="card-title" style={{ fontSize: "14px", marginBottom: "10px" }}>
                    Received Payment
                  </h5>
                  <p className="card-text fs-4 fw-bold" style={{ fontSize: "18px" }}>
                    Rs {totalPayment.received_payment || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 col-sm-6 mb-3">
              <div
                className="card text-white text-center"
                style={{ backgroundColor: "#FFAC30" }}
              >
                <div className="card-body">
                  <h5 className="card-title" style={{ fontSize: "14px", marginBottom: "10px" }}>
                    Total Pending Payment
                  </h5>
                  <p className="card-text fs-4 fw-bold" style={{ fontSize: "18px" }}>
                    Rs {totalPayment.total_pending_payment || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredRecords}
            customStyles={customStyles}
            pagination
            highlightOnHover
            progressPending={loading}
            responsive
            noDataComponent={
              <div style={{ padding: "20px", textAlign: "center" }}>
                {loading ? "Loading..." : "No payment records found"}
              </div>
            }
          />

          {/* Horizontal column navigation (based on screen size) */}
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

        <Modal show={showConfirmation} onHide={closeConfirmModal}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Status Change</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to change the payment status for{" "}
              <strong>{selectedRecord && selectedRecord.full_name}</strong>?
            </p>
            {selectedRecord && (
              <p>
                Week: {selectedRecord.week_start_date} to {selectedRecord.week_end_date}
                <br />
                Total Amount: Rs {selectedRecord.total_amount}
                <br />
                Pending Amount: Rs {selectedRecord.pending_amount || 0}
              </p>
            )}
            {selectedRecord && (
              <Form.Group className="mt-3" controlId="paymentAmount">
                <Form.Label>Paid Amount (Amount to Pay Now)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="Enter amount to pay now"
                />
                <Form.Text className="text-muted">
                  Current Pending: Rs {selectedRecord.pending_amount || 0}
                  <br />
                  After Payment Remaining: Rs{" "}
                  {Math.max(
                    (Number(selectedRecord.pending_amount) || 0) -
                      (Number(paidAmount) || 0),
                    0
                  ).toFixed(2)}
                </Form.Text>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeConfirmModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const pendingAmount = Number(selectedRecord?.pending_amount) || 0;
                let paidValue = Number(paidAmount) || 0;
                if (paidValue < 0) paidValue = 0;
                if (paidValue > pendingAmount) paidValue = pendingAmount;
                const newStatus = paidValue >= pendingAmount;
                confirmStatusChange(newStatus, paidValue);
              }}
            >
              Confirm
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default Farmer_Payment_History;
