import React, { useState, useEffect } from "react";
import axios from "axios";
import WindowHeader from "../../window_partial/window_header";
import {
  Container,
  Button,
  Modal,
  ToastContainer,
  Form,
} from "react-bootstrap";
import DataTable from "react-data-table-component";
import "../../window_partial/window.css";
import { encode } from "base64-arraybuffer";
import { toast, Bounce } from "react-toastify";
import "../SuperAdmin/Dairy_List.css";

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

  const confirmStatusChange = async (status) => {
    const token = localStorage.getItem("token");
    try {
      // If payment has an ID, use it; otherwise use week dates
      const payload = selectedRecord.id 
        ? { status }
        : {
            status,
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

  useEffect(() => {
    setFilteredRecords(records);
  }, [records]);

  const columns = [
    {
      name: "Bill No.",
      selector: (row, index) => `000${index + 1}`,
      sortable: true,
    },
    {
      name: "Start Date",
      selector: (row) => row.week_start_date || "N/A",
      sortable: true,
    },
    {
      name: "End Date",
      selector: (row) => row.week_end_date || "N/A",
      sortable: true,
    },
    {
      name: "Farmer Name",
      selector: (row) => row.full_name,
      sortable: true,
    },
    {
      name: "Status",
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
      name: "Pure(ltr)",
      selector: (row) => row.total_pure_quantity,
      sortable: true,
    },
    {
      name: "Cow(ltr)",
      selector: (row) => row.total_cow_quantity,
      sortable: true,
    },
    {
      name: "Buffalo(ltr)",
      selector: (row) => row.total_buffalo_quantity,
      sortable: true,
    },
    {
      name: "Total Payment",
      selector: (row) => `Rs ${row.total_amount}`,
      sortable: true,
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
      <WindowHeader dashboardText="Farmer Payment History" />
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
                Amount: Rs {selectedRecord.total_amount}
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeConfirmModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const newStatus =
                  selectedRecord.status === "Paid" ? false : true;
                confirmStatusChange(newStatus);
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
