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

function Farmer_List() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOrderModel, setShowOrderModel] = useState(false);
  const [selectedMilkTypes, setSelectedMilkTypes] = useState([]);
  const [checkedMilkTypes, setCheckedMilkTypes] = useState([]);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [farmerRates, setFarmerRates] = useState({
    farmer_cow_rate: 0,
    farmer_buffalo_rate: 0,
    farmer_pure_rate: 0,
  });
  const [formData, setFormData] = useState({
    advance_payment: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMilkSelection = (type) => {
    setSelectedMilkTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    );
  };

  const [pure_milk, setPureMilk] = useState({
    milk_type: "",
    quantity: "",
    fat: "",
    rate: "",
  });

  const [cow_milk, setCowMilk] = useState({
    milk_type: "",
    quantity: "",
    fat: "",
    rate: "",
  });

  const [buffalo_milk, setBuffaloMilk] = useState({
    milk_type: "",
    quantity: "",
    fat: "",
    rate: "",
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

  function calculateRate(fat, quantity, ratePerUnit) {
    const cleanedFat = fat.replace(/[^0-9.]/g, "");
    const f = parseFloat(cleanedFat);
    const q = parseFloat(quantity);
    if (!isNaN(f) && !isNaN(q)) {
      return (f * q * ratePerUnit).toFixed(2);
    }
    return "";
  }

  // For Pure Milk
  useEffect(() => {
    const rate = calculateRate(
      pure_milk.fat,
      pure_milk.quantity,
      farmerRates.farmer_pure_rate
    );
    setPureMilk((prev) => ({ ...prev, rate }));
  }, [pure_milk.fat, pure_milk.quantity, farmerRates.farmer_pure_rate]);

  // For Cow Milk
  useEffect(() => {
    const rate = calculateRate(
      cow_milk.fat,
      cow_milk.quantity,
      farmerRates.farmer_cow_rate
    );
    setCowMilk((prev) => ({ ...prev, rate }));
  }, [cow_milk.fat, cow_milk.quantity, farmerRates.farmer_cow_rate]);

  // For Buffalo Milk
  useEffect(() => {
    const rate = calculateRate(
      buffalo_milk.fat,
      buffalo_milk.quantity,
      farmerRates.farmer_buffalo_rate
    );
    setBuffaloMilk((prev) => ({ ...prev, rate }));
  }, [
    buffalo_milk.fat,
    buffalo_milk.quantity,
    farmerRates.farmer_buffalo_rate,
  ]);

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    // Extract and clean numeric fat values
    const cleanCowFat = cow_milk.fat.replace(/[^0-9.]/g, "");
    const cleanBuffaloFat = buffalo_milk.fat.replace(/[^0-9.]/g, "");
    const cleanPureFat = pure_milk.fat.replace(/[^0-9.]/g, "");

    const payload = {
      cow_quantity: cow_milk.milk_type ? cow_milk.quantity : undefined,
      cow_fat: cow_milk.milk_type ? cleanCowFat : undefined,
      cow_rate: cow_milk.milk_type ? cow_milk.rate : undefined,

      buffalo_quantity: buffalo_milk.milk_type
        ? buffalo_milk.quantity
        : undefined,
      buffalo_fat: buffalo_milk.milk_type ? cleanBuffaloFat : undefined,
      buffalo_rate: buffalo_milk.milk_type ? buffalo_milk.rate : undefined,

      pure_quantity: pure_milk.milk_type ? pure_milk.quantity : undefined,
      pure_fat: pure_milk.milk_type ? cleanPureFat : undefined,
      pure_rate: pure_milk.milk_type ? pure_milk.rate : undefined,
    };

    try {
      const response = await axios.post(
        `/api/admin/farmer/${selectedRecord.id}/add_product`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        toast.success("Order Successful");

        // Reset all states
        setShowOrderModel(false);
        setBuffaloMilk({ milk_type: "", quantity: "", fat: "", rate: "" });
        setCowMilk({ milk_type: "", quantity: "", fat: "", rate: "" });
        setPureMilk({ milk_type: "", quantity: "", fat: "", rate: "" });
      }
    } catch (error) {
      console.error("Error while submitting milk data:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const Farmer_List = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/Farmer_list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedRecords = response.data.farmers.map((record) => ({
        ...record,
        status: record.status ? "Active" : "Inactive",
      }));
      setRecords(updatedRecords);
    } catch (error) {
      console.error("Error fetching farmers:", error);
    }
  };

  useEffect(() => {
    Farmer_List();
  }, []);

  const confirmStatusChange = async (status) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `/api/admin/farmer/${selectedRecord.id}/update_status`,
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

  const closeModal = () => {
    setShowOrderModel(false);
    setShowDetailsModal(false);
  };

  const handleAdvancePayment = async (status) => {
    const token = localStorage.getItem("token");

    try {
      const data = {
        advance_payment: Number(formData.advance_payment),
        status: status,
      };

      const response = await axios.put(
        `/api/admin/farmer/advance_payment/${selectedRecord.id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.updated_balance !== undefined && status === true) {
        toast.success("Advance Payment Updated");
        Farmer_List();
      } else if (
        response.data.updated_balance !== undefined &&
        status === false
      ) {
        toast.success("Advance Payment Deducted");
        Farmer_List();
      } else {
        toast.success(response.data.message);
      }

      // wrap these in their own try-catch to debug
      try {
        setFormData({ advance_payment: "" });
        closeModal();
        fetchData();
      } catch (innerErr) {
        console.error("Post-success logic failed:", innerErr);
      }
    } catch (error) {
      console.error("Error adding advance payment:", error);
      toast.error(
        error.response?.data?.message ||
          "Error adding advance payment. Please try again later."
      );
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmation(false);
  };

  const handleStatusToggle = (record) => {
    setSelectedRecord(record);
    console.log("Opening modal for:", record);
    setShowConfirmation(true);
  };

  const renderMilkSection = (type) => {
    switch (type) {
      case "pure":
        return (
          <div key="pure" className="border-top pt-3 mb-4">
            <h5>Pure Milk</h5>
            <Form.Group className="mt-4">
              <Form.Label>Enter pure milk quantity</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter quantity in litres"
                value={pure_milk.quantity}
                onChange={(e) =>
                  setPureMilk({
                    ...pure_milk,
                    quantity: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mt-2">
              <Form.Label>Enter Fat</Form.Label>
              <Form.Control
                type="text"
                value={pure_milk.fat}
                onFocus={() => {
                  if (!pure_milk.fat)
                    setPureMilk({ ...pure_milk, fat: "Fat " });
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setPureMilk((prev) => ({
                    ...prev,
                    fat: value,
                  }));
                }}
              />
            </Form.Group>

            <Form.Group className="mt-2">
              <Form.Label>Total Rate Per Liter</Form.Label>
              <Form.Control
                type="text"
                value={pure_milk.rate}
                placeholder="₹ 65"
                readOnly
              />
            </Form.Group>
          </div>
        );

      case "cow":
        return (
          <div key="cow" className="border-top pt-3 mb-4">
            <h5>Cow Milk</h5>
            <Form.Group className="mt-4">
              <Form.Label>Enter cow milk quantity</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter quantity in litres"
                value={cow_milk.quantity}
                onChange={(e) =>
                  setCowMilk({
                    ...cow_milk,
                    quantity: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mt-2">
              <Form.Label>Enter Fat</Form.Label>
              <Form.Control
                type="text"
                value={cow_milk.fat}
                onFocus={() => {
                  if (!cow_milk.fat) setCowMilk({ ...cow_milk, fat: "Fat " });
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setCowMilk((prev) => ({
                    ...prev,
                    fat: value,
                  }));
                }}
              />
            </Form.Group>

            <Form.Group className="mt-2">
              <Form.Label>Total Rate Per Liter</Form.Label>
              <Form.Control
                type="text"
                value={cow_milk.rate}
                placeholder="₹ 65"
                readOnly
              />
            </Form.Group>
          </div>
        );

      case "buffalo":
        return (
          <div key="buffalo" className="border-top pt-3 mb-4">
            <h5>Buffalo Milk</h5>

            <Form.Group className="mt-4">
              <Form.Label>Enter buffalo milk quantity</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter quantity in litres"
                value={buffalo_milk.quantity}
                onChange={(e) =>
                  setBuffaloMilk({
                    ...buffalo_milk,
                    quantity: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mt-2">
              <Form.Label>Enter Fat</Form.Label>
              <Form.Control
                type="text"
                value={buffalo_milk.fat}
                onFocus={() => {
                  if (!buffalo_milk.fat)
                    setBuffaloMilk({ ...buffalo_milk, fat: "Fat " });
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setBuffaloMilk((prev) => ({
                    ...prev,
                    fat: value,
                  }));
                }}
              />
            </Form.Group>

            <Form.Group className="mt-2">
              <Form.Label>Total Rate Per Liter</Form.Label>
              <Form.Control
                type="text"
                value={buffalo_milk.rate}
                placeholder="₹ 65"
                readOnly
              />
            </Form.Group>
          </div>
        );

      default:
        return null;
    }
  };

  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOrderNow = (row) => {
    setSelectedRecord(row);
    setSelectedMilkTypes(row.milk_types || []);
    setCheckedMilkTypes([]);
    setShowOrderModel(true);
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
      name: "Sr No.",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      name: "Farmer Name",
      selector: (row) => row.full_name,
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
          variant={row.status === "Active" ? "success" : "danger"}
          onClick={() => handleStatusToggle(row)}
        >
          {row.status}
        </Button>
      ),
      sortable: true,
    },
    {
      name: "Start Date",
      selector: (row) => {
        const date = new Date(row.created_at);
        return date.toLocaleDateString("en-GB");
      },
      sortable: true,
    },
    {
      name: "Order",
      cell: (row) => (
        <Button
          variant="info"
          style={{
            wordBreak: "keep-all",
            whiteSpace: "nowrap",
            backgroundColor: "black",
            color: "white",
          }}
          onClick={() => handleOrderNow(row)}
        >
          Order Now
        </Button>
      ),
    },
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
      <WindowHeader dashboardText="Farmer List" />
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

        <Modal show={showOrderModel} onHide={closeModal} centered>
          <Modal.Header closeButton style={{ backgroundColor: "#ffa726" }}>
            <Modal.Title className="text-white">Order Now</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex flex-wrap">
              <Form.Label>First Select the type of milk</Form.Label>
              <div>
                {selectedMilkTypes.map((milkType) => (
                  <Form.Check
                    inline
                    key={milkType}
                    label={milkType.charAt(0).toUpperCase() + milkType.slice(1)}
                    type="checkbox"
                    value={milkType}
                    checked={checkedMilkTypes.includes(milkType)}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      if (isChecked) {
                        setCheckedMilkTypes((prev) => [...prev, milkType]);

                        // Set milk_type when selected
                        if (milkType === "cow")
                          setCowMilk((prev) => ({ ...prev, milk_type: "cow" }));
                        if (milkType === "buffalo")
                          setBuffaloMilk((prev) => ({
                            ...prev,
                            milk_type: "buffalo",
                          }));
                        if (milkType === "pure")
                          setPureMilk((prev) => ({
                            ...prev,
                            milk_type: "pure",
                          }));
                      } else {
                        setCheckedMilkTypes((prev) =>
                          prev.filter((type) => type !== milkType)
                        );

                        // Clear milk_type when deselected
                        if (milkType === "cow")
                          setCowMilk((prev) => ({ ...prev, milk_type: "" }));
                        if (milkType === "buffalo")
                          setBuffaloMilk((prev) => ({
                            ...prev,
                            milk_type: "",
                          }));
                        if (milkType === "pure")
                          setPureMilk((prev) => ({ ...prev, milk_type: "" }));
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {checkedMilkTypes.map((type) => renderMilkSection(type))}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="dark" onClick={() => handleSubmit()}>
              Submit
            </Button>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

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
                  selectedRecord.status === "Active" ? false : true;
                confirmStatusChange(newStatus);
                confirmStatusChange(newStatus);
              }}
            >
              Confirm
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showDetailsModal} onHide={closeModal}>
          <Modal.Header closeButton style={{ backgroundColor: "#FFAC30" }}>
            <Modal.Title>Add Advance Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="advance_payment">
                <Form.Label>
                  Advance Payment: {selectedRecord?.advance_payment || 0}
                </Form.Label>
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
            <Button
              onClick={() => handleAdvancePayment(true)}
              style={{ backgroundColor: "black", border: "black" }}
            >
              Add
            </Button>
            <Button
              onClick={() => handleAdvancePayment(false)}
              style={{ backgroundColor: "grey", border: "black" }}
            >
              Deduct
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default Farmer_List;
