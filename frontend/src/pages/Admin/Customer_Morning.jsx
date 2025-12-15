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

function Customer_Morning() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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

    if (after2pm) {
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
    } else {
      // Before 2 PM logic
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
            disabled={!after2pm || row.delivery_status === "Pending"}
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
        <Button variant="info" onClick={() => handleViewClick(row)}>
          Edit
        </Button>
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
            <div className="d-flex justify-content-end align-items-center mt-2 gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={safeColumnPage === 0}
                onClick={() =>
                  setColumnPage((prev) => (prev > 0 ? prev - 1 : prev))
                }
              >
                ◀ Columns
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
                Columns ▶
              </button>
              <span style={{ fontSize: "12px" }}>
                Group {safeColumnPage + 1} of {maxColumnPage + 1}
              </span>
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
      </div>
    </div>
  );
}

export default Customer_Morning;
