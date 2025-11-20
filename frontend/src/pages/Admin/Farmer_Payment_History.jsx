import React, { useState, useEffect, useRef } from "react";
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
import { toast } from "react-toastify";
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
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/farmer/pending-payment", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const flatRecords = [];

      response.data.farmers.forEach((farmer) => {
        farmer.pending_payments.forEach((payment) => {
          flatRecords.push({
            ...farmer,
            ...payment,
            farmer_id: farmer.farmer_id,
            status: payment.status ? "Paid" : "Pending",
          });
        });
      });

      setRecords(flatRecords);
    } catch (error) {
      console.error("Error fetching farmers:", error);
    }
  };

  useState(() => {
    Farmer_List();
  }, []);

  const confirmStatusChange = async (status) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `/api/admin/farmer/payment/${selectedRecord.id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("User has been successfully marked as inactive.");
      closeConfirmModal();
      Farmer_List();
      setSelectedRecord(null);
    } catch (error) {
      console.error("Error updating status:", error);
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
      name: "Bill Date",
      selector: (row) => row.week_end_date,
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
          variant={row.status === "Active" ? "success" : "danger"}
          onClick={() => handleStatusToggle(row)}
        >
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
            responsive
          />
        </Container>

        <Modal show={showConfirmation} onHide={closeConfirmModal}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Status Change</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to change the status of{" "}
              {selectedRecord && selectedRecord.name}?
            </p>
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
