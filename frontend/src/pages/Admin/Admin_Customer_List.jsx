import { useState, useEffect, useRef } from "react";
import WindowHeader from "../../window_partial/window_header";
import { Container, Button, Modal, Image, Row, Col } from "react-bootstrap";
import { Form } from "react-bootstrap";

import Card from "react-bootstrap/Card";
import DataTable from "react-data-table-component";
import logo from "/mauli_logo.png";
import "../../window_partial/window.css";
import "./Payment_History.css";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../SuperAdmin/Dairy_List.css";
import useResponsiveHideableColumns from "../../hooks/useResponsiveHideableColumns";

function Admin_Customer_List() {
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const datar = [];
  const [records, setRecords] = useState(datar);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDetailsModals, setShowDetailsModals] = useState(false);
  const deliveryTimeouts = useRef({});
  const [totalQuantity, setTotalQuantity] = useState(null);
  const [totalbuffalomilkQuantity, setTotalbuffalomilkQuantity] =
    useState(null);
  const [totalcowmilkQuantity, setTotalcowmilkQuantity] = useState(null);

  const [formData, setFormData] = useState({
    advance_payment: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAdvancePayment = async (status) => {
    const token = localStorage.getItem("token");

    try {
      const data = {
        advance_payment: parseFloat(formData.advance_payment),
        status: status,
      };

      const response = await axios.put(
        `/api/admin/${selectedRecord.id}/advance-payment`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.advance_payment !== undefined && status==true) {
        toast.success(`Advance Payment updated`);
      } 
      else if(response.data.advance_payment !== undefined && status==false){
        toast.success(`Advance Payment Deducted`);
      }else {
        toast.success(response.data.message); // Default message
      }

      closeModal();
      fetchData();
      
    } catch (error) {
      console.error("Error adding advance payment:", error);
      toast.error(
        error.response?.data?.message || "Error adding advance payment. Please try again later."
      );
    }
  };

  const fetchData = async (type) => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get(`/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedRecords = response.data.users.map((record) => ({
        ...record,
        status: "Active",
      }));
      setRecords(updatedRecords);
    } catch (error) {
      console.error("Error fetching user requests:", error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchTotalMilk = async () => {
      try {
        const response = await axios.get("/api/admin/last-month-milk-quantity", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setTotalcowmilkQuantity(response.data.totalCowMilk);
        setTotalbuffalomilkQuantity(response.data.totalBuffaloMilk);
        setTotalQuantity(response.data.totalPureMilk);
      } catch (error) {
        console.error("Error fetching cow milk quantity:", error);
      }
    };

    fetchTotalMilk();
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
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);
  const [customerColumnPage, setCustomerColumnPage] = useState(0);
  const [customerColumnsPerPage, setCustomerColumnsPerPage] = useState(() => {
    const w = window.innerWidth || 0;
    if (w <= 600) return 3;      // mobile
    if (w <= 1024) return 4;     // tablet
    return 100;                  // all on desktop
  });

  useEffect(() => {
    setFilteredRecords(records);
  }, [records]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [shift, setShift] = useState("");
  const [milkTypes, setMilkTypes] = useState({
    pure: false,
    cow: false,
    buffalo: false,
  });
  const [quantity, setQuantity] = useState(500);

  const closeModal = () => {
    setShowConfirmation(false);
    setSelectedRecord(null);
    setShowDetailsModal(false);
    setStartDate("");
    setEndDate("");
    setShift("");
    setMilkTypes({
      pure: false,
      cow: false,
      buffalo: false,
    });
    setQuantity(500);
  };

  const saveChanges = () => {
    console.log("Saving changes:", {
      startDate,
      endDate,
      shift,
      milkTypes,
      quantity,
    });
    closeModal();
  };

  const handleStatusToggle = (id) => {
    const selected = records.find((record) => record.id === id);
    setSelectedRecord(selected);
    setShowConfirmation(true);
  };

  const handleViewClick = (row) => {
    setSelectedRecord(row);
    setShowDetailsModal(true);
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

  const allColumns = [
    {
      id: "srNo",
      headerLabel: "Sr No.",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      id: "name",
      headerLabel: "Customer Name",
      selector: (row) => row.name,
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
      id: "status",
      headerLabel: "Status",
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
      id: "quantity",
      headerLabel: "Quantity",
      selector: (row) => `${row.quantity} ltr`,
      sortable: true,
    },
    {
      id: "startDate",
      headerLabel: "Start Date",
      selector: (row) => {
        const date = new Date(row.start_date);
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
      },
      sortable: true,
    },
    {
      id: "milkType",
      headerLabel: "Milk Type",
      selector: (row) => row.milk_type,
      sortable: true,
    },
    {
      id: "shift",
      headerLabel: "Shift",
      selector: (row) => row.shift,
      sortable: true,
    },
    {
      id: "advancePayment",
      headerLabel: "Advance Payment",
      selector: (row) => row.advance_payment,
      sortable: true,
    },
    {
      id: "actions",
      headerLabel: "Actions",
      cell: (row) => (
        <Button variant="primary" onClick={() => handleViewClick(row)}>
          Advance
        </Button>
      ),
      ignoreRowClick: true,
    },
  ];

  const effectiveColumnsPerPage = Math.min(
    customerColumnsPerPage,
    allColumns.length || customerColumnsPerPage
  );
  const maxCustomerColumnPage = Math.max(
    0,
    Math.ceil(allColumns.length / effectiveColumnsPerPage) - 1
  );
  const safeCustomerColumnPage = Math.min(
    customerColumnPage,
    maxCustomerColumnPage
  );
  const columnStart = safeCustomerColumnPage * effectiveColumnsPerPage;
  const columnEnd = columnStart + effectiveColumnsPerPage;
  const pagedColumnsRaw = allColumns.slice(columnStart, columnEnd);

  const columns = useResponsiveHideableColumns(pagedColumnsRaw, {
    // Reset visible columns whenever the column group (page) changes
    resetKey: safeCustomerColumnPage,
  });
  useEffect(() => {
    return () => {
      Object.values(deliveryTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  const closeModal1 = () => {
    // Function to close the modal
    setShowDetailsModals(false);
    setModalDatas({
      customer: "",
      farmer: "",
      buy: "",
      sell: "",
      profit: "",
    });
  };

  const [modalDatas, setModalDatas] = useState({
    customer: "",
    farmer: "",
    buy: "",
    sell: "",
    profit: "",
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth || 0;
      setIsSmallScreen(width <= 600);

      if (width <= 600) {
        // Use 2 columns on very small screens to avoid content being cut
        setCustomerColumnsPerPage(2);
      } else if (width <= 1024) {
        setCustomerColumnsPerPage(4);
      } else {
        setCustomerColumnsPerPage(100);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <WindowHeader dashboardText="Customer List" />
      <div
        style={{
          marginTop: isSmallScreen ? "85px" : "0px",
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

        <Modal show={showProfile} onHide={() => setShowProfile(false)} centered>
          <Modal.Header closeButton></Modal.Header>
          <Modal.Body>
            <div className="text-center mt-4">
              <Image
                src={logo}
                roundedCircle
                width={100}
                height={100}
                style={{ border: "1px solid black" }}
              />
              <h4>Ketan Undale</h4>
              <h5 className="light_text">Last connect 1 day ago</h5>
            </div>
            <Row className="mt-3 row">
              <Col className="col-6">
                <p
                  style={{
                    backgroundColor: "black",
                    color: "white",
                    padding: "16px",
                    borderRadius: "6px",
                    textAlign: "center",
                    fontWeight: "normal",
                  }}
                >
                  +91 1234567890
                </p>
              </Col>
              <Col className="col-6">
                <p
                  style={{
                    backgroundColor: "black",
                    color: "white",
                    padding: "16px",
                    borderRadius: "6px",
                    marginLeft: "-13px",
                    fontWeight: "normal",
                  }}
                >
                  user@example.com
                </p>
              </Col>
            </Row>
            <div className="mt-3 row">
              <div className="col-4">
                <Button
                  variant="outline-primary"
                  onClick={() => setActiveTab("edit")}
                  className="click_btn"
                >
                  Edit Profile
                </Button>
              </div>
              <div className="col-4">
                <Button
                  variant="outline-primary"
                  onClick={() => setActiveTab("account")}
                  className="click_btn"
                >
                  Account Info
                </Button>
              </div>
              <div className="col-4">
                <Button
                  variant="outline-primary"
                  onClick={() => setActiveTab("other")}
                  className="click_btn"
                >
                  Other Info
                </Button>
              </div>
            </div>

            {activeTab === "edit" && (
              <div className="row">
                <div
                  className="col-12"
                  style={{
                    border: "1px solid black",
                    borderRadius: "6px",
                    marginTop: "11px",
                    padding: "10px",
                  }}
                >
                  <p>Edit Profile Data Here</p>
                </div>
              </div>
            )}
            {activeTab === "account" && (
              <div className="row">
                <div
                  className="col-12"
                  style={{
                    border: "1px solid black",
                    borderRadius: "6px",
                    marginTop: "11px",
                    padding: "10px",
                  }}
                >
                  <div className="row light_text">
                    <div className="col-8">Mobile No : </div>
                    <div className="col-4">+91 1234567890</div>
                  </div>
                  <div className="row mt-3 light_text">
                    <div className="col-8">Address : </div>
                    <div className="col-4"></div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "other" && (
              <div className="row">
                <div
                  className="col-12"
                  style={{
                    border: "1px solid black",
                    borderRadius: "6px",
                    marginTop: "11px",
                    padding: "10px",
                  }}
                >
                  <p>Other Data Here</p>
                </div>
              </div>
            )}
          </Modal.Body>
        </Modal>

        <Container fluid className="main-content mt-5 responsive-gap">
          {/* Search box - shown at top on mobile, before cards */}
          <div className={`${isSmallScreen ? "d-block" : "d-none"} mb-3`} style={{ paddingLeft: "15px", paddingRight: "15px" }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleFilter}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition duration-300 ease-in-out"
              style={{ width: "100%", maxWidth: "100%", paddingLeft: "12px", paddingRight: "12px" }}
            />
          </div>
          
          <div className="container">
            <div className="row mt-2 mb-4 responsive-gap">
              <div className="col-sm-12 col-md-4">
                <Card
                  className="main-card"
                  style={{ backgroundColor: "#FFAC30" }}
                >
                  <Card.Body>
                    <center>
                      <Card.Title
                        className="title_card"
                        style={{ color: "white" }}
                      >
                        Pure
                      </Card.Title>
                    </center>
                    <hr />
                    <Card.Text as="div" className="text-center">
                      <button type="button" className="btn_submit">
                        {totalQuantity ? totalQuantity : 0} ltr
                      </button>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </div>

              <div className="col-sm-12 col-md-4">
                <Card
                  className="main-card"
                  style={{ backgroundColor: "#FFAC30" }}
                >
                  <Card.Body>
                    <center>
                      <Card.Title
                        className="title_card"
                        style={{ color: "white" }}
                      >
                        Cows
                      </Card.Title>
                    </center>
                    <hr />
                    <Card.Text as="div" className="text-center">
                      <button type="button" className="btn_submit">
                        {totalcowmilkQuantity ? totalcowmilkQuantity : 0} ltr
                      </button>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </div>

              <div className="col-sm-12 col-md-4">
                <Card
                  className="main-card"
                  style={{ backgroundColor: "#FFAC30" }}
                >
                  <Card.Body>
                    <center>
                      <Card.Title
                        className="title_card"
                        style={{ color: "white" }}
                      >
                        Buffalo
                      </Card.Title>
                    </center>
                    <hr />
                    <Card.Text as="div" className="text-center">
                      <button type="button" className="btn_submit">
                        {totalbuffalomilkQuantity ? totalbuffalomilkQuantity : 0}{" "}
                        ltr
                      </button>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </div>


          <Modal show={showDetailsModals} onHide={closeModal1}>
            <Modal.Header closeButton>
              <Modal.Title>Pure Milk</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: "0px" }} className="mt-3">
              <div className="row">
                <div className="col">Customer</div>
                <div className="col">farmer</div>
                <div className="col">Buy</div>
                <div className="col">Sell</div>
                <div className="col">Profit</div>
              </div>
            </Modal.Body>
            <hr />
            <div className="row" style={{ backgroundColor: "#ececec" }}>
              <div className="col">0.5 ltr</div>
              <div className="col">0 ltr</div>
              <div className="col">Rs 0/-</div>
              <div className="col">Rs 0/-</div>
              <div className="col">Rs 0/-</div>
            </div>

            <Button className="mt-4" variant="secondary" onClick={closeModal1}>
              Close
            </Button>
          </Modal>

          {/* Search box - shown above table on desktop, hidden on mobile */}
          <div className={`${isSmallScreen ? "d-none" : "d-block"} text-end mt-4 mb-4`}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleFilter}
              className="w-full lg:w-96 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition duration-300 ease-in-out"
            />
          </div>
          <DataTable
            columns={columns}
            data={filteredRecords}
            customStyles={customStyles}
            selectableRows
            fixedHeader
            pagination
            responsive
          />

          {/* Horizontal column navigation (based on screen size) */}
          {maxCustomerColumnPage > 0 && (
            <div className="d-flex justify-content-end align-items-center mt-2 gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={safeCustomerColumnPage === 0}
                onClick={() =>
                  setCustomerColumnPage((prev) =>
                    prev > 0 ? prev - 1 : prev
                  )
                }
              >
                ◀ Columns
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={safeCustomerColumnPage >= maxCustomerColumnPage}
                onClick={() =>
                  setCustomerColumnPage((prev) =>
                    prev < maxCustomerColumnPage ? prev + 1 : prev
                  )
                }
              >
                Columns ▶
              </button>
              <span style={{ fontSize: "12px" }}>
                Group {safeCustomerColumnPage + 1} of{" "}
                {maxCustomerColumnPage + 1}
              </span>
            </div>
          )}
        </Container>
        
        <Modal show={showDetailsModal} onHide={closeModal}>
          <Modal.Header closeButton style={{ backgroundColor: "#FFAC30" }}>
            <Modal.Title>Add Advance Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              {/* Input for Advance Payment */}
              <Form.Group controlId="advance_payment">
                <Form.Label>Enter Advance Payment Amount</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter amount"
                  name="advance_payment"
                  value={formData.advance_payment}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="">
            {/* Button for Add Advance Payment only */}
            <Button
              onClick={() => handleAdvancePayment(true)} // ✅ Skip balance deduction
              style={{ backgroundColor: "black", border: "black" }}
            >
              Add
            </Button>
            {/* Button for Deduct Balance Payment */}
            <Button
              onClick={() => handleAdvancePayment(false)} // ❗ Deduct balance payment
              style={{ backgroundColor: "grey", border: "black" }}
            >
              Deduct
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showConfirmation} onHide={closeModal}>
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
      </div>
    </div>
  );
}

export default Admin_Customer_List;

