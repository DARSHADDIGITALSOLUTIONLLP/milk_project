import React, { useState, useEffect } from "react";
import axios from "axios";
import WindowHeader from "../../window_partial/window_header";
import { Container } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import { Bounce } from "react-toastify";
import "./Payment_History.css";
import DataTable from "react-data-table-component";
import "../../window_partial/window.css";
import "../SuperAdmin/Dairy_List.css";
import "react-toastify/dist/ReactToastify.css";

function Additional_Orders() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAfter2PM, setIsAfter2PM] = useState(new Date().getHours() >= 14);
  const [deliveryStatusChangeTrigger, setDeliveryStatusChangeTrigger] =
    useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = new Date();
      setIsAfter2PM(currentTime.getHours() >= 14);
    }, 1000);
    return () => clearInterval(timer); 
  }, []);

  const Additional_Orders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      console.log("Fetching additional orders...");
      const response = await axios.get("/api/admin/users/additional-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("API Response:", response.data);

      // Handle empty array response
      if (!response.data.additional_orders || response.data.additional_orders.length === 0) {
        console.log("No additional orders found");
        setRecords([]);
        setLoading(false);
        return;
      }

      const initialRecords = response.data.additional_orders.map((record) => ({
        id: record.id,
        userId: record.user.id,
        name: record.user?.name || "Unknown",
        cow: record.cowQuantity || 0,
        buffalo: record.buffaloQuantity || 0,
        pure: record.pureQuantity || 0,
        date: record.date,
        shift: record.shift,
        delivered_status: false,
        status: "Pending",
      }));

      console.log("Initial records:", initialRecords);
      setRecords(initialRecords);

      // Only fetch delivery status if we have orders
      if (initialRecords.length > 0) {
        try {
          const statusResponse = await axios.get(
            "/api/admin/additional_deliveryStatus",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const statusMap = new Map();
          statusResponse?.data?.orders?.forEach((order) => {
            const orderId = order.additinalOrder_id;
            const deliveryEntry = order.deliveryStatus?.[0];
            if (deliveryEntry) {
              statusMap.set(orderId, deliveryEntry.status);
            }
          });

          const updatedRecords = initialRecords.map((record) => {
            const status = statusMap.get(record.id);
            return {
              ...record,
              delivery_status:
                status === true
                  ? "Delivered"
                  : status === false
                  ? "Not Delivered"
                  : "Pending",
            };
          });

          console.log("Updated records with delivery status:", updatedRecords);
          setRecords(updatedRecords);
        } catch (statusError) {
          // If status fetch fails, just use the initial records
          console.error("Error fetching delivery status:", statusError);
          setRecords(initialRecords);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching additional orders:", error);
      console.error("Error response:", error.response?.data);
      setRecords([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    Additional_Orders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDeliveryToggle = async (id, currentStatus) => {
    const token = localStorage.getItem("token");

    if (isAfter2PM) {
      const newStatus =
        currentStatus === "Delivered" ? "Not Delivered" : "Delivered";

      try {
        const response = await axios.put(
          `/api/admin/update_delivery_status/${id}`,
          { status: newStatus === "Delivered" }, // body data
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status !== 200) throw new Error("Failed to update");

        const updatedRecords = records.map((record) =>
          record.userId === id
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
    } else {
      // Before 2 PM logic
      const updatedRecords = records.map((record) => {
        if (record.userId === id) {
          if (!record.delivery) {
            setTimeout(() => {
              setRecords((prevRecords) =>
                prevRecords.map((prevRecord) =>
                  prevRecord.userId === id
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
      name: "Cow",
      selector: (row) => row.cow,
      sortable: true,
    },
    {
      name: "Buffalo",
      selector: (row) => row.buffalo,
      sortable: true,
    },
    {
      name: "Pure",
      selector: (row) => row.pure,
      sortable: true,
    },
    {
      name: "Date",
      selector: (row) => row.date,
      sortable: true,
    },
    {
      name: "Delivery",
      selector: (row) => {
        const currentDate = new Date().toISOString().split("T")[0]; 
        const isCurrentDate = row.date === currentDate; 
        const isAfter2PM = dateTime.getHours() >= 14; 

        return (
          <>
            <input
              key={row.userId}
              type="checkbox"
              checked={row.delivery_status === "Delivered"}
              disabled={!isAfter2PM || !isCurrentDate}
              onChange={(e) =>
                handleDeliveryToggle(row.userId,row.delivery_status)
              } 
            />
            <span>{row.delivery_status}</span>
          </>
        );
      },
      sortable: true,
    },
    {
      name: "Shift",
      selector: (row) => row.shift,
      sortable: true,
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: "#fcd02a",
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
      <WindowHeader dashboardText="Additional Orders" />
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
      </div>
    </div>
  );
}

export default Additional_Orders;
