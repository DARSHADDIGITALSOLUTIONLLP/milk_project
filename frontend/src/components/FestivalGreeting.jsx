import React, { useState, useEffect } from "react";
import { Alert } from "react-bootstrap";
import axios from "axios";
import Cookies from "js-cookie";
import "./FestivalGreeting.css";

/**
 * Festival Greeting Component
 * Displays festival greetings banner on CUSTOMER dashboard ONLY
 * This component should ONLY be used in User_Dashboard.jsx (customer dashboard)
 * NOT for Admin, SuperAdmin, or DeliveryBoy dashboards
 * 
 * NOW FETCHES FROM DATABASE API - Dynamically updates when festivals are added via admin panel
 * CUSTOMIZES GREETING WITH USER'S DAIRY NAME
 */
function FestivalGreeting() {
  const [showGreeting, setShowGreeting] = useState(false);
  const [greeting, setGreeting] = useState(null);
  const [dairyName, setDairyName] = useState("");
  const API_URL = "http://localhost:5001/api";

  useEffect(() => {
    // Additional safety check: Verify this is customer dashboard
    // Check if token exists (customer should be logged in)
    const token = localStorage.getItem("token");
    if (!token) {
      // Not logged in, don't show greeting
      return;
    }

    // Get dairy name from cookies or API
    const getDairyName = async () => {
      try {
        // Try to get from cookies first
        const cookieValue = Cookies.get("Mauli-Dairy");
        if (cookieValue) {
          const userData = JSON.parse(cookieValue);
          if (userData.dairy_name) {
            setDairyName(userData.dairy_name);
            return userData.dairy_name;
          }
        }

        // If not in cookies, fetch from API
        const response = await axios.get(`${API_URL}/user/get-dairy-info`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.dairy_name) {
          setDairyName(response.data.dairy_name);
          return response.data.dairy_name;
        }
      } catch (error) {
        console.log("Error fetching dairy name:", error.message);
      }
      return "";
    };

    // Fetch today's festival from database API
    const fetchTodaysFestival = async () => {
      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayDate = `${year}-${month}-${day}`;
        const dateKey = `${month}-${day}`;

        // Get dairy name first
        const userDairyName = await getDairyName();

        // Fetch festival from database
        const response = await axios.get(`${API_URL}/festivals/date/${todayDate}`);
        
        if (response.data && response.data.festival) {
          const festival = response.data.festival;
          
          // Check if user already closed this greeting today
          const hideAfter = localStorage.getItem(`festival_greeting_${dateKey}_hidden`);
          if (!hideAfter) {
            // Customize greeting with dairy name
            let customizedGreeting = festival.greeting;
            if (userDairyName) {
              // Add "from [Dairy Name]" at the end of the greeting
              // Format: "Happy New Year! ... From [Dairy Name]"
              // Check if greeting already ends with punctuation
              const trimmedGreeting = festival.greeting.trim();
              const lastChar = trimmedGreeting[trimmedGreeting.length - 1];
              const punctuation = (lastChar === '.' || lastChar === '!' || lastChar === '?') ? '' : '!';
              customizedGreeting = `${trimmedGreeting}${punctuation} From ${userDairyName}`;
            }

            setGreeting({
              name: festival.name,
              greeting: customizedGreeting,
              icon: festival.icon,
              dairyName: userDairyName
            });
            setShowGreeting(true);
          }
        }
      } catch (error) {
        // No festival today or API error - silently fail
        console.log("No festival today or error fetching:", error.message);
      }
    };

    fetchTodaysFestival();
  }, []);

  const handleClose = () => {
    if (greeting) {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateKey = `${month}-${day}`;
      localStorage.setItem(`festival_greeting_${dateKey}_hidden`, "true");
      setShowGreeting(false);
    }
  };

  // Safety check: Only show for customers (must be logged in)
  // This component should ONLY be used in User_Dashboard.jsx (customer dashboard)
  const token = localStorage.getItem("token");
  if (!token || !showGreeting || !greeting) {
    return null;
  }

  return (
    <Alert 
      variant="info" 
      className="festival-greeting-alert"
      onClose={handleClose}
      dismissible
    >
      <div className="festival-greeting-content">
        <div className="festival-greeting-icon">
          {greeting.icon || greeting.greeting.split(' ')[0] || '🎉'} {/* Use icon from database, or extract from greeting, or default emoji */}
        </div>
        <div className="festival-greeting-text">
          <strong>{greeting.name} Greetings!</strong>
          <div>{greeting.greeting}</div>
          {greeting.dairyName && (
            <div style={{ 
              marginTop: '8px', 
              fontWeight: 'bold', 
              color: '#0d6efd',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              🏪 From {greeting.dairyName}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}

export default FestivalGreeting;
