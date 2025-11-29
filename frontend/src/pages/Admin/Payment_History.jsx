import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import WindowHeader from "../../window_partial/window_header";
import { Container, Button, Modal, ToastContainer } from "react-bootstrap";
import "./Payment_History.css";
import DataTable from "react-data-table-component";
import "../../window_partial/window.css";
import { encode } from "base64-arraybuffer";
import { toast } from "react-toastify";
import { Bounce } from "react-toastify";
import "../SuperAdmin/Dairy_List.css";

function Payment_History() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalPayment, setTotalPayment] = useState({
    advance_payment: 0,
    outstanding_payment: 0,
    received_payment: 0,
    balance_payment: 0,
  });

  const [receivedPayment, setReceivedPayment] = useState(0);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const fetchTotalAmount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/total-lastmonth-payment", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTotalPayment({
        advance_payment: response.data.totalAdvancePayment,
        outstanding_payment: response.data.totalOutstandingPayment,
        received_payment: response.data.totalReceivedPayment,
        balance_payment: response.data.totalPayment,
      });
    } catch (error) {
      console.error("Error fetching payment details:", error);
    }
  };

  useEffect(() => {
    fetchTotalAmount();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
  
    try {
      const response = await axios.get(
        "/api/admin/users-lastmonth-payment-details",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const { users } = response.data;
  
      if (Array.isArray(users)) {
        const transformedRecords = users.map((user) => {
          return {
            id: user.id,
            qr_image: user.qr_image,
            name: user.name,
            status: user.status === true ? "Paid" : "Pending",
            address: user.address || "N/A",
            startDate: user.start_date ? formatDate(user.start_date) : "N/A",
            shift: user.shift || "N/A",
            dairyName: user.dairy_name,
            amount: user.received_payment
              ? `₹ ${user.received_payment}/-`
              : "₹ 0/-",
            cumulativeBalanceAmount: user.pending_payment
              ? `₹ ${user.pending_payment}/-`
              : "₹ 0/-",
            advance_payment: user.advance_payment
              ? `₹ ${user.advance_payment}/-`
              : "₹ 0/-",
          };
        });
  
        setRecords(transformedRecords);
      } else {
        console.error("Expected 'users' to be an array but received:", response.data.users);
        setError("Unexpected data format.");
      }
    } catch (err) {
      console.error("Error fetching payment history:", err);
      setError("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRecords();
  }, []);

  const handleReceivedPayment = () => {
    const token = localStorage.getItem("token");
    axios
      .put(
        `/api/admin/${selectedRecord.id}/add-received-payment`,
        {
          received_payment: Number(receivedPayment),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        if (response.status === 200) {
          toast.success("Received payment updated successfully!");
          fetchRecords();
          fetchTotalAmount();
          setReceivedPayment(0);
          setShowDetailsModal(false);
          closePaymentModal();
        } else {
          toast.error("Failed to update received payment.");
        }
      })
      .catch((error) => {
        console.error("Error updating received payment:", error);
        toast.error(error.response?.data?.message || "Error updating payment.");
      });
  };

  const getQRImageSrc = (qrImage) => {
    if (!qrImage || typeof qrImage !== "object" || !qrImage.data) {
      return null;
    }
    const base64String = encode(new Uint8Array(qrImage.data));
    return `data:image/png;base64,${base64String}`;
  };

  const qrImageSrc = selectedRecord?.qr_image
    ? getQRImageSrc(selectedRecord.qr_image)
    : null;

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

  const closePaymentModal = () => {
    setShowPaymentDetailsModal(false);
  };

  const handleViewClick = (row) => {
    setSelectedRecord(row);
    setShowDetailsModal(true);
  };

  const handlePaymentViewClick = (row) => {
    setSelectedRecord(row);
    setShowPaymentDetailsModal(true);
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

  const columns = [
    {
      name: "Sr No.",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      name: "Customer Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
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
      name: "Status",
      selector: (row) => (
        <Button
          variant={row.status === "Paid" ? "success" : "danger"}
          // onClick={() => handleStatusToggle(row.id)}
        >
          {row.status}
        </Button>
      ),
      sortable: true,
    },
    {
      name: "Start Date",
      selector: (row) => row.startDate,
      sortable: true,
    },
    // {
    //   name: "End Date",
    //   selector: (row) => row.endDate,
    //   sortable: true,
    // },
    {
      name: "Shift",
      selector: (row) => row.shift,
      sortable: true,
    },
    {
      name: "Advance Payment",
      selector: (row) => row.advance_payment,
      sortable: true,
    },
    {
      name: "Received Amount",
      selector: (row) => row.amount,
      sortable: true,
    },
    {
      name: "Total Pending Amount",
      selector: (row) => row.cumulativeBalanceAmount,
      sortable: true,
    },
    // {
    //   name: "Actions",
    //   cell: (row) => (
    //     <Button variant="info" onClick={() => handleViewClick(row)}>
    //       View
    //     </Button>
    //   ),
    // },
    {
      name: "Received Payment",
      cell: (row) => (
        <Button variant="info" onClick={() => handlePaymentViewClick(row)}>
          View
        </Button>
      ),
    },
  ];
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
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <WindowHeader dashboardText="Payment dashboard" />
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
          transition={Bounce}
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

          <div>
            <div className="row mb-4 responsive-gap">
              <div className="col-md-3">
                <div
                  className="card text-white text-center"
                  style={{ backgroundColor: "#FFAC30" }}
                >
                  <div className="card-body">
                    <h5 className="card-title">Advance payment</h5>
                    <p className="card-text fs-4 fw-bold">
                      Rs {totalPayment.advance_payment}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div
                  className="card text-white text-center"
                  style={{ backgroundColor: "#FFAC30" }}
                >
                  <div className="card-body">
                    <h5 className="card-title">Received payment</h5>
                    <p className="card-text fs-4 fw-bold">
                      Rs {totalPayment.received_payment}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div
                  className="card text-white text-center"
                  style={{ backgroundColor: "#FFAC30" }}
                >
                  <div className="card-body">
                    <h5 className="card-title">Outstanding payment</h5>
                    <p className="card-text fs-4 fw-bold">
                      Rs {totalPayment.outstanding_payment}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div
                  className="card text-white text-center"
                  style={{ backgroundColor: "#FFAC30" }}
                >
                  <div className="card-body">
                    <h5 className="card-title">Balance payment</h5>
                    <p className="card-text fs-4 fw-bold">
                      Rs {totalPayment.balance_payment}
                    </p>
                  </div>
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
          />
        </Container>

        <Modal show={showConfirmation} onHide={closeModal} centered>
          <Modal.Title
            style={{ backgroundColor: "#ffc107" }}
            className="modal-title-custom m-0 text-center w-100"
          >
            Confirm Status Change
          </Modal.Title>
          <Modal.Body>
            Are you sure you want to change the status of{" "}
            {selectedRecord?.dairy_name}?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary">Confirm</Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showDetailsModal}
          onHide={closeModal}
          centered
          style={{ padding: "21px" }}
        >
          <Modal.Header closeButton></Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col mb-1">Payment details</div>
              <div className="row">
                <div className="col-12">
                  {selectedRecord && (
                    <div>
                      <div>
                        <p>
                          <strong>Dairy's Name:</strong>{" "}
                          {selectedRecord.dairyName}
                        </p>
                        <p>
                          <strong>Address:</strong> {selectedRecord.address}
                        </p>
                        <p>
                          <strong>Start Date:</strong>
                          {selectedRecord.startDate}
                        </p>
                        {/* <p>
                          <strong>End Date:</strong>
                          {selectedRecord.endDate}
                        </p> */}
                        <p>
                          <strong>Status:</strong> {selectedRecord.status}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>

        <Modal
          show={showPaymentDetailsModal}
          onHide={closePaymentModal}
          centered
          style={{ padding: "21px" }}
        >
          <Modal.Header closeButton></Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col mb-1">
                <h5>Payment Details</h5>
              </div>
              <div className="row">
                <div className="col-12">
                  {selectedRecord ? (
                    <div>
                      <p>
                        <strong>User Name:</strong> {selectedRecord.name}
                      </p>
                      <div>
                        <strong>Payment Screenshot:</strong>
                        {qrImageSrc ? (
                          <img
                            src={qrImageSrc}
                            alt="QR Payment Screenshot"
                            style={{
                              width: "100%",
                              maxHeight: "300px",
                              objectFit: "contain",
                              marginTop: "10px",
                              border: "1px solid #ccc",
                              borderRadius: "8px",
                            }}
                          />
                        ) : (
                          <p style={{ color: "red" }}>
                            No screenshot available.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: "red" }}>No record selected.</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 bg-white shadow-md rounded-lg max-w-sm mx-auto">
                  <div className="form-group">
                    <strong
                      htmlFor="receivedPayment"
                      className="font-semibold text-gray-700"
                    >
                      Enter Received Payment
                    </strong>
                    <div className="mb-3 mt-2">
                      <input
                        type="text"
                        className="form-control p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        id="receivedPayment"
                        value={receivedPayment}
                        onChange={(e) => setReceivedPayment(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition-all w-full"
                      onClick={handleReceivedPayment}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
}

export default Payment_History;