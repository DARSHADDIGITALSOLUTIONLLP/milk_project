import React, { useState, useEffect } from "react";
import { Alert } from "react-bootstrap";
import "./FestivalGreeting.css";

/**
 * Festival Greeting Component
 * Displays festival greetings banner on CUSTOMER dashboard ONLY
 * This component should ONLY be used in User_Dashboard.jsx (customer dashboard)
 * NOT for Admin, SuperAdmin, or DeliveryBoy dashboards
 */
function FestivalGreeting() {
  const [showGreeting, setShowGreeting] = useState(false);
  const [greeting, setGreeting] = useState(null);

  useEffect(() => {
    // Additional safety check: Verify this is customer dashboard
    // Check if token exists (customer should be logged in)
    const token = localStorage.getItem("token");
    if (!token) {
      // Not logged in, don't show greeting
      return;
    }

    // Optional: You can add role verification here if needed
    // For now, since this component is only imported in User_Dashboard.jsx,
    // it's already restricted to customers only
    // Check if today is a festival
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateKey = `${month}-${day}`;

    // Festival list (matches backend festivals.js)
    const festivals = {
      "01-01": { name: "New Year", greeting: "🎉 Happy New Year! Wishing you a year filled with happiness, prosperity, and fresh milk every day!" },
      "01-14": { name: "Makar Sankranti", greeting: "🪁 Happy Makar Sankranti! May this festival bring you joy, prosperity, and sweet moments with your family!" },
      "01-23": { name: "Test Festival", greeting: "🪁 Test Festival Greetings! This is a demo festival for testing the notification system. Wishing you a wonderful day!" },
      "01-26": { name: "Republic Day", greeting: "🇮🇳 Happy Republic Day! Celebrating the spirit of unity and freedom. Jai Hind!" },
      "02-14": { name: "Vasant Panchami", greeting: "🌸 Happy Vasant Panchami! May Goddess Saraswati bless you with wisdom and knowledge!" },
      "03-25": { name: "Holi", greeting: "🎨 Happy Holi! May your life be filled with vibrant colors, joy, and sweet moments. Have a safe and colorful celebration!" },
      "03-30": { name: "Ram Navami", greeting: "🕉️ Happy Ram Navami! May Lord Rama's blessings bring peace and prosperity to your home!" },
      "04-14": { name: "Ambedkar Jayanti", greeting: "🙏 On Ambedkar Jayanti, let's remember the great leader who fought for equality and justice." },
      "04-18": { name: "Good Friday", greeting: "✝️ Wishing you peace and reflection on this Good Friday." },
      "04-20": { name: "Easter", greeting: "🐰 Happy Easter! May this day bring you joy, hope, and new beginnings!" },
      "05-10": { name: "Akshaya Tritiya", greeting: "✨ Happy Akshaya Tritiya! May this auspicious day bring you endless prosperity and good fortune!" },
      "05-23": { name: "Buddha Purnima", greeting: "🪷 Happy Buddha Purnima! May peace and enlightenment be with you always!" },
      "06-16": { name: "Eid al-Adha", greeting: "🕌 Eid al-Adha Mubarak! May this blessed festival bring you and your family peace, happiness, and prosperity!" },
      "07-21": { name: "Guru Purnima", greeting: "🙏 Happy Guru Purnima! Let's express gratitude to our teachers and mentors who guide us in life!" },
      "08-15": { name: "Independence Day", greeting: "🇮🇳 Happy Independence Day! Let's celebrate the freedom and unity of our great nation. Jai Hind!" },
      "08-19": { name: "Raksha Bandhan", greeting: "🪢 Happy Raksha Bandhan! Celebrating the beautiful bond between siblings. May your bond grow stronger!" },
      "08-20": { name: "Onam", greeting: "🎊 Happy Onam! Wishing you a harvest festival filled with joy, prosperity, and delicious feasts!" },
      "08-26": { name: "Janmashtami", greeting: "🕉️ Happy Janmashtami! May Lord Krishna's blessings fill your life with love, joy, and prosperity!" },
      "09-07": { name: "Ganesh Chaturthi", greeting: "🐘 Happy Ganesh Chaturthi! May Lord Ganesha remove all obstacles and bring you success and happiness!" },
      "10-02": { name: "Gandhi Jayanti", greeting: "🙏 On Gandhi Jayanti, let's remember the Father of the Nation and his teachings of truth and non-violence." },
      "10-12": { name: "Dussehra", greeting: "⚔️ Happy Dussehra! May the victory of good over evil inspire you to overcome all challenges in life!" },
      "10-20": { name: "Karva Chauth", greeting: "💑 Happy Karva Chauth! Wishing all couples a lifetime of love, togetherness, and happiness!" },
      "11-01": { name: "Diwali", greeting: "🪔 Happy Diwali! May the festival of lights illuminate your life with happiness, prosperity, and success. Wishing you a bright and joyful celebration!" },
      "11-03": { name: "Bhai Dooj", greeting: "💝 Happy Bhai Dooj! Celebrating the special bond between brothers and sisters. May your relationship grow stronger!" },
      "11-07": { name: "Chhath Puja", greeting: "🌅 Happy Chhath Puja! May this sacred festival bring you health, prosperity, and divine blessings!" },
      "11-15": { name: "Guru Nanak Jayanti", greeting: "🕉️ Happy Guru Nanak Jayanti! May Guru Nanak's teachings guide you towards peace and enlightenment!" },
      "12-25": { name: "Christmas", greeting: "🎄 Merry Christmas! May this festive season bring you joy, peace, and happiness. Wishing you a wonderful celebration with your loved ones!" },
      "12-31": { name: "New Year's Eve", greeting: "🎊 Happy New Year's Eve! As we bid farewell to this year, may the coming year bring you endless joy and success!" },
    };

    const todayFestival = festivals[dateKey];
    
    if (todayFestival) {
      setGreeting(todayFestival);
      setShowGreeting(true);
      
      // Hide greeting after 24 hours (or user can close it)
      const hideAfter = localStorage.getItem(`festival_greeting_${dateKey}_hidden`);
      if (hideAfter) {
        setShowGreeting(false);
      }
    }
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
          {greeting.greeting.split(' ')[0]} {/* Get emoji from greeting */}
        </div>
        <div className="festival-greeting-text">
          <strong>{greeting.name} Greetings!</strong>
          <div>{greeting.greeting}</div>
        </div>
      </div>
    </Alert>
  );
}

export default FestivalGreeting;
