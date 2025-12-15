import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Container, Button, Modal, ToastContainer } from "react-bootstrap";
import DataTable from "react-data-table-component";
import { encode } from "base64-arraybuffer";
import { toast } from "react-toastify";
import "../SuperAdmin/Dairy_List.css";
import FarmerHeader from "../../partial/header/FarmerHeader";
import useResponsiveHideableColumns from "../../hooks/useResponsiveHideableColumns";

function Todays_Order() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  const [farmerRates, setFarmerRates] = useState({
    farmer_cow_rate: 0,
    farmer_buffalo_rate: 0,
    farmer_pure_rate: 0,
  });
  
  const fetchFarmerRates = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("/api/admin/get_farmer_Milkrate", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFarmerRates({
        farmer_cow_rate: response.data.farmer_cow_rate,
        farmer_buffalo_rate: response.data.farmer_buffalo_rate,
        farmer_pure_rate: response.data.farmer_pure_rate,
      });
    } catch (error) {
      console.error("Error fetching farmer rates:", error);
      toast.error(error.response?.data?.message);
    }
  };

  useEffect(() => {
    fetchFarmerRates();
  }, []);

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
        row.dairy_name?.toLowerCase().includes(value) ||
        row.address?.toLowerCase().includes(value)
      );
    });

    setFilteredRecords(filteredData);
  };

  const [filteredRecords, setFilteredRecords] = useState([]);

  useEffect(() => {
    setFilteredRecords(records);
  }, [records]);

  const fetchList = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/farmer/todays_order", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const farmer = response.data.farmer;
      const orders = response.data.orders;

      // Add dairy name and address to each order
      const enrichedOrders = orders.map((order) => ({
        ...order,
        dairy_name: farmer.dairy_name,
        address: farmer.address,
        // advance_payment: farmer.advance_payment,
      }));

      setRecords(enrichedOrders);
    } catch (error) {
      console.error("Failed to fetch list:", error);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const allColumns = [
    {
      id: "srNo",
      headerLabel: "Sir No.",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      id: "dairyName",
      headerLabel: "Dairy Name",
      selector: (row) => row.dairy_name,
      sortable: true,
    },
    {
      id: "address",
      headerLabel: "Address",
      selector: (row) => row.address,
      sortable: true,
      cell: (row) => (
        <div className="hover-container">
          <span className="address-preview">
            {(row.address || "").slice(0, 15)}...
          </span>
          <div className="address-popup">{row.address || ""}</div>
        </div>
      ),
    },
    {
      id: "time",
      headerLabel: "Time",
      selector: (row) => row.time || "-",
      sortable: true,
    },
    {
      id: "pure",
      headerLabel: "Pure (ltr)",
      selector: (row) =>
        row.pure_quantity
          ? `${row.pure_quantity || 0} (F${row.pure_fat ?? "-"})*Rs${
              farmerRates.farmer_pure_rate
            }`
          : "-",
      sortable: true,
    },
    {
      id: "cow",
      headerLabel: "Cow (ltr)",
      selector: (row) =>
        row.cow_quantity
          ? `${row.cow_quantity || 0} (F${row.cow_fat ?? "-"})*Rs${
              farmerRates.farmer_cow_rate
            }`
          : "-",
      sortable: true,
    },
    {
      id: "buffalo",
      headerLabel: "Buffalo (ltr)",
      selector: (row) =>
        row.buffalo_quantity
          ? `${row.buffalo_quantity || 0} (F${row.buffalo_fat ?? "-"})*Rs${
              farmerRates.farmer_buffalo_rate
            }`
          : "-",
      sortable: true,
    },
  ];

  const [columnPage, setColumnPage] = useState(0);
  const [columnsPerPage, setColumnsPerPage] = useState(() => {
    const w = window.innerWidth || 0;
    if (w <= 600) return 3;
    if (w <= 1024) return 4;
    return 100;
  });

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
      <FarmerHeader dashboardText="Todays Orders" />
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

          {/* Horizontal column navigation (based on screen size) */}
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
      </div>
    </div>
  );
}

export default Todays_Order;
