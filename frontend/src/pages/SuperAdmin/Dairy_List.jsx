import React, { useState, useEffect } from "react";
import { Container, Button, Modal, Form } from "react-bootstrap";
import { Image, Row, Col } from "react-bootstrap";
import logo from "/mauli_logo.png";
import DataTable from "react-data-table-component";
import axios from "axios";
import Header from "../../components/Header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Dairy_List.css";

function Dairy_List() {
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [expireDate, setExpireDate] = useState();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [records, setRecords] = useState([]);
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const [formData, setFormData] = useState({
    payment_amount: "",
    subscription_valid: "",
  });

  const handleStatusUpdate = async () => {
    const token = localStorage.getItem("token");

    try {
      const { subscription_valid, payment_amount } = formData;
      const periods = subscription_valid;
      const adminId = selectedRecord.id;
      const response = await axios.put(
        `/api/admin/${adminId}/update-Payment`,
        {
          payment_amount,
          periods,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const responseStatus = await axios.put(
        `/api/admin/${adminId}/update`,
        { request: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        toast.success("Payment and period updated successfully!");
        await fetchRecords();
        closeModal();
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment. Please try again.");
    }
  };

  useEffect(() => {
    switch (formData.subscription_valid) {
      case "monthly":
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "299",
        }));
        break;
      case "quarterly":
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "499",
        }));
        break;
      case "half-yearly":
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "799",
        }));
        break;
      case "yearly":
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "1499",
        }));
        break;
      default:
        setFormData((prevState) => ({
          ...prevState,
          payment_amount: "",
        }));
        break;
    }
  }, [formData.subscription_valid]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFilter = (event) => {
    const value = event.target.value.toLowerCase();
    const filteredData = records.filter((row) => {
      return (
        row.dairy_name.toLowerCase().includes(value) ||
        row.address.toLowerCase().includes(value) ||
        row.status.toLowerCase().includes(value) ||
        row.periods.toLowerCase().includes(value)
      );
    });
    setSearchTerm(value);
    setFilteredRecords(filteredData);
  };
  const [filteredRecords, setFilteredRecords] = useState([]);

  useEffect(() => {
    setFilteredRecords(records);
  }, [records]);

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

  const statusUpdate = async (recordId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.put(
        `/api/admin/${recordId}/update`,
        { request: false },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // console.log("Status update response:", response);

      // Refresh records after status update
      fetchRecords();

      closeModal();
      toast.success("Admin Deactivated Successfully");
      await fetchRecords();
    } catch (error) {
      console.error("Error updating status:", error);
      // alert("Failed to update status. Please try again.");
    }
  };

  const fetchRecords = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get(`/api/admins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (Array.isArray(response.data.admins)) {
        // Use 'admins' instead of 'Admins'
        const transformedRecords = response.data.admins.map((record) => {
          const { res_date, periods } = record;
          if (!res_date || !periods) {
            console.error(
              "Error: Start Date of Subscription period is missing."
            );
            return null;
          }

          const adminCreatedDate = new Date(res_date);
          if (isNaN(adminCreatedDate.getTime())) {
            console.error("Invalid date format received:", res_date);
            return null;
          }

          const subscriptionEndDate = new Date(adminCreatedDate);
          switch (periods) {
            case "monthly":
              subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
              break;
            case "quarterly":
              subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 3);
              break;
            case "half-yearly":
              subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 6);
              break;
            case "yearly":
              subscriptionEndDate.setFullYear(
                subscriptionEndDate.getFullYear() + 1
              );
              break;
            default:
              console.error("Unknown subscription type:", periods);
              return null;
          }

          const today = new Date();
          const status = subscriptionEndDate >= today ? "Active" : "Inactive";

          setExpireDate(subscriptionEndDate);

          return {
            id: record.id,
            dairy_name: record.dairy_name,
            address: record.address,
            periods: record.periods,
            expire_date: subscriptionEndDate.toISOString().split("T")[0],
            res_date: record.res_date,
            status: status,
            request: record.request,
            payment_amount: record.payment_amount,
          };
        });

        setRecords(transformedRecords);
        transformedRecords.forEach((record) => {
          if (record.request === false) {
            record.status = "Inactive";
          }
        });
      } else {
        console.error("Expected an array but received:", response.data);
      }
    } catch (err) {
      console.error("Error fetching dairy records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleStatusToggle = (id) => {
    const selected = records.find((record) => record.id === id);
    setSelectedRecord(selected);
    // statusUpdate();
    setShowConfirmation(true);
  };

  const closeModal = () => {
    setShowConfirmation(false);
    setSelectedRecord(null);
    setShowDetailsModal(false);
  };

  const columns = [
    {
      name: "Sr No.",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      name: "Dairy's Name",
      selector: (row) => row.dairy_name,
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
      name: "Subscription Validity",
      selector: (row) => {
        switch (row.periods) {
          case "monthly":
            return "Basic";
          case "quarterly":
            return "Plus";
          case "half-yearly":
            return "Gold";
          case "yearly":
            return "Platinum";
          default:
            return row.periods; // fallback in case it's something unexpected
        }
      },
      sortable: true,
    },
    {
      name: "Start Date",
      selector: (row) => {
        const date = new Date(row.res_date);
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
      },
      sortable: true,
    },
    {
      name: "End Date",
      selector: (row) => row.expire_date,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => (
        <Button
          variant={row.status === "Active" ? "success" : "danger"}
          onClick={() => {
            handleStatusToggle(row.id);
          }}
        >
          {row.status ? row.status : "Active"}
        </Button>
      ),
      sortable: true,
    },
    {
      name: "Payment",
      selector: (row) => `${row.payment_amount}+GST`,
      sortable: true,
    },
  ];
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      {/* Header */}
      <Header dashboardText="Dairy List" />
      <div
        style={{
          marginTop: isSmallScreen ? "100px" : "0px",
        }}
      ></div>
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
            <h4>Superadmin</h4>
            {/* <h4>{username}</h4> */}
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

          {/* Displaying content based on active tab */}
          {activeTab === "edit" && (
            <div className="row">
              {/* Display edit profile data here */}

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
              {/* Display edit profile data here */}

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
              {/* Display edit profile data here */}

              <div
                className="col-12"
                style={{
                  border: "1px solid black",
                  borderRadius: "6px",
                  marginTop: "11px",
                  padding: "10px",
                }}
              >
                <p>other Data Here</p>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Main Content */}
      <Container fluid className="main-content mt-5">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
          <div>
            <p className="mb-0">Today's Status: {dateTime.toLocaleString()}</p>
          </div>
          <div className="w-full md:w-auto text-start text-md-end">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={handleFilter}
              className="w-full md:w-96 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition duration-300 ease-in-out"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredRecords}
          customStyles={customStyles}
          selectableRows
          fixedHeader
          pagination
        />
      </Container>

      {/* Modal to view record details */}
      <Modal show={showDetailsModal} onHide={closeModal}>
        <Modal.Header closeButton style={{ backgroundColor: "#FFAC30" }}>
          <Modal.Title>Dairy Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <div>
              <p>
                <strong>Dairy's Name:</strong> {selectedRecord.dairy_name}
              </p>
              <p>
                <strong>Address:</strong> {selectedRecord.address}
              </p>
              <p>
                <strong>Status:</strong> {selectedRecord.status}
              </p>
              <p>
                <strong>Subscription Validity:</strong> {selectedRecord.periods}
              </p>
              <p>
                <strong>Start Date:</strong>{" "}
                {new Date(selectedRecord.res_date).toISOString().split("T")[0]}
              </p>
              <p>
                <strong>Expire Date:</strong> {selectedRecord.expire_date}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal for Status Change */}
      <Modal show={showConfirmation} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Status Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row mt-4">
              <div className="col-12 col-md-6 mt-4 mt-md-0">
                <Form.Group controlId="subscription_valid">
                  <Form.Label>Subscription Validity</Form.Label>
                  <Form.Select
                    name="subscription_valid"
                    value={formData.subscription_valid}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select validity period</option>
                    <option value="monthly">Basic(30 days)</option>
                    <option value="quarterly">Plus(90 days)</option>
                    <option value="half-yearly">Gold(180 days)</option>
                    <option value="yearly">Platinum(365 days)</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-12 col-md-6 mt-4 mt-md-0">
                <Form.Group controlId="payment_amount">
                  <Form.Label>Payment Amount</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter payment amount"
                    name="payment_amount"
                    value={formData.payment_amount}
                    onChange={handleChange}
                    readOnly
                  />
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleStatusUpdate}>
            Confirm
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              statusUpdate(selectedRecord.id);
            }}
          >
            Inactive
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Dairy_List;
