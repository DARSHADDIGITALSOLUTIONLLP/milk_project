import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Container,
  Button,
  Modal,
  ToastContainer,
  Form,
} from "react-bootstrap";
import DataTable from "react-data-table-component";
import "../SuperAdmin/Dairy_List.css";
import FarmerHeader from "../../partial/header/FarmerHeader";

function Farmer_Payment_History() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const closeModal = () => {
    setShowDetailsModal(false);
  };

  const handleAdvance = (row) => {
    setSelectedRecord(row);
    setShowDetailsModal(true);
  };

  const handleFilter = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);

    const filteredData = records.filter((row) => {
      return (
        row.dairy_name?.toLowerCase().includes(value) ||
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

  const fetchPayment = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/farmer/payment_history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const farmer = response.data.farmer;

      const updatedRecords = response.data.payments.flatMap((payment) =>
        payment.week_wise_summary.map((week) => ({
          ...week,
          dairy_name: payment.dairy_name,
          full_name: farmer.full_name,
          start_date: week.start_date,
          end_date: week.end_date,
          total_amount: week.total_amount,
          advance_payment: farmer.advance_payment,
          advance_payment_date: farmer.advance_payment_date,
          status: week.status === false ? "Pending" : "Paid",
        }))
      );

      setRecords(updatedRecords);
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
  };

  useState(() => {
    fetchPayment();
  }, []);

  const columns = [
    {
      name: "Bill No.",
      selector: (row, index) => `000${index + 1}`,
      sortable: true,
    },
    {
      name: "Bill Date",
      selector: (row) => row.end_date,
      sortable: true,
    },
    {
      name: "Dairy Name",
      selector: (row) => row.dairy_name,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => (
        <Button variant={row.status === "Paid" ? "success" : "danger"}>
          {row.status}
        </Button>
      ),
      sortable: true,
    },
    {
      name: "Pure(Ltr)",
      selector: (row) => row.total_pure_quantity,
      sortable: true,
    },
    {
      name: "Cow(Ltr)",
      selector: (row) => row.total_cow_quantity,
      sortable: true,
    },
    {
      name: "Buffalo(Ltr)",
      selector: (row) => row.total_buffalo_quantity,
      sortable: true,
    },
    {
      name: "Total Amount",
      selector: (row) => `Rs ${row.total_amount}`,
      sortable: true,
    },
    // {
    //   name: "Advance Payment",
    //   selector: (row) => `Rs ${row.advance_payment}`,
    //   sortable: true,
    // },
    // {
    //   name: "Advance Payment Date",
    //   selector: (row) => row.advance_payment_date,
    //   sortable: true,
    // },
    {
      name: "Action",
      cell: (row) => (
        <Button
          variant="info"
          style={{ wordBreak: "keep-all", whiteSpace: "nowrap" }}
          onClick={() => handleAdvance(row)}
        >
          Advance
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
      <FarmerHeader dashboardText="Payment History" />
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
            progressPending={loading}
          />
        </Container>
        <Modal show={showDetailsModal} onHide={closeModal}>
          <Modal.Header closeButton style={{ backgroundColor: "#FFAC30" }}>
            <Modal.Title>Advance Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="advance_payment">
                <div className="d-flex flex-wrap flex-column">
                <Form.Label>
                  Advance Payment: {selectedRecord?.advance_payment || 0}
                </Form.Label>
                <Form.Label>
                  Date: {selectedRecord?.advance_payment_date || "N/A"}
                </Form.Label>
                </div>
              </Form.Group>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
}

export default Farmer_Payment_History;
