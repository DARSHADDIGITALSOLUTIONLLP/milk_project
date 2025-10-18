import React, { useState, useEffect, useRef } from "react";
import WindowHeader from "../../window_partial/window_header";
import { Container, Button, Modal, Row, Col } from "react-bootstrap";
import DataTable from "react-data-table-component";
import axios from "axios";
import "../../window_partial/window.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../SuperAdmin/Dairy_List.css";

function Customer_Evening() {
  const [showProfile, setShowProfile] = useState(false); // State for profile popup
  const [activeTab, setActiveTab] = useState("edit");
  const [requestType, setRequestType] = useState();
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false); 
  const [showDetailsModal, setShowDetailsModal] = useState(false); 
  const deliveryTimeouts = useRef({});
  const [dateTime, setDateTime] = useState(new Date());
  const [quantity, setQuantity] = useState(0);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const currentDate = new Date().toISOString().split("T")[0];
    try {
      const response = await axios.get("/api/admin/users/All-evening-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userIds = response.data.users.map((order) => order.userid);

      const initialRecords = response.data.users.map((record) => ({
        ...record,
        status: "Active",
        delivery_status: "Pending",
      }));

      setRecords(initialRecords);
      const responseStatus = await axios.get("/api/admin/deliveryStatusEvening", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const todayDeliveries = responseStatus.data.orders.filter(
        (item) =>
          item.date.split("T")[0] === currentDate && item.shift === "evening"
      );

      const statusMap = new Map(
        todayDeliveries.map((item) => [
          Number(item.userid),
          item.status === true ? "Delivered" : "Not Present",
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

  // const handleDeliveryToggle = (id) => {
  //   const updatedRecords = records.map((record) => {
  //     if (record.id === id && record.delivery_status === "Pending") {
  //       // Set a timeout to revert lock after 24 hours
  //       setTimeout(() => {
  //         setRecords((prevRecords) =>
  //           prevRecords.map((prevRecord) =>
  //             prevRecord.id === id
  //               ? { ...prevRecord, delivery: false, lock: false }
  //               : prevRecord
  //           )
  //         );
  //       }, 24 * 60 * 60 * 1000); // 24 hours

  //       return {
  //         ...record,
  //         delivery_status: "Delivered",
  //         delivery: true,
  //         lock: true,
  //         delivered_status: true, // optional based on your logic
  //       };
  //     }
  //     return record;
  //   });

  //   setRecords(updatedRecords);
  // };

  const handleDeliveryToggle = (id) => {
    const updatedRecords = records.map((record) => {
      if (record.id === id) {
        if (!record.delivery) {
          setTimeout(() => {
            setRecords((prevRecords) =>
              prevRecords.map((prevRecord) =>
                prevRecord.id === id
                  ? { ...prevRecord, delivery: false, lock: false }
                  : prevRecord
              )
            );
          }, 24 * 60 * 60 * 1000); // 24 hours
          return { ...record, delivery: true, lock: true };
        }
      }
      return record;
    });
    setRecords(updatedRecords);
  };

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
          <div className="address-popup">
            {row.address}
          </div>
        </div>
      ),
    },
    {
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
      name: "Start Date",
      selector: (row) => {
        const date = new Date(row.start_date);
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
      },
      sortable: true,
    },
    {
      name: "Shift",
      selector: () => "Evening",
      sortable: true,
    },
    {
      name:"Vacation Mode",
      selector: (row) => row.vacation_mode_evening?"ON":"OFF",
      sortable: true,
    },
    {
      name: "Delivery",
      selector: (row) => (
        <>
          <input
            key={row.userid}
            type="checkbox"
            checked={row.delivery_status === "Delivered"}
            disabled={row.delivery_status === "Pending" || row.delivered_status}
            onChange={() => handleDeliveryToggle(row.id)}
          />
          <span>
            {row.delivery_status}
          </span>
        </>
      ),
      sortable: true,
    },
    // {
    //   name: "Delivery",
    //   selector: (row) => (
    //     <>
    //       <input
    //         key={row.userid}
    //         type="checkbox"
    //         checked={row.delivery_status === "Delivered"}
    //         disabled={row.delivery_status !== "Pending" || row.delivered_status}
    //         onChange={() => handleDeliveryToggle(row.id)}
    //       />

    //       <span>{row.delivery_status}</span>
    //     </>
    //   ),
    //   sortable: true,
    // },
    {
      name: "Actions",
      cell: (row) => (
        <Button variant="info" onClick={() => handleViewClick(row)}>
          Edit
        </Button>
      ),
    },
  ];

  useEffect(() => {
    return () => {
      Object.values(deliveryTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <WindowHeader dashboardText="Customer List (Evening)" />
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
          />
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
      </div>
    </div>
  );
}

export default Customer_Evening;
