import React, { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { FaGlobe, FaCheck } from "react-icons/fa";
import "./GoogleTranslate.css";
import "./GoogleTranslate-EnhancedStyles.css";

const GoogleTranslateV2 = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "hi", name: "हिंदी (Hindi)", flag: "🇮🇳" },
    { code: "mr", name: "मराठी (Marathi)", flag: "🇮🇳" },
  ];

  // Helper function to set Google Translate cookie (optionally with domain)
  const setCookie = (name, value, days, domain) => {
    const expires = days
      ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}`
      : "";
    const domainPart = domain ? `; domain=${domain}` : "";
    const cookieString = `${name}=${value}${expires}; path=/${domainPart}`;
    document.cookie = cookieString;
    console.log(`🍪 Cookie set: ${cookieString}`);
  };

  // Helper function to get cookie value (handles domain cookies)
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop().split(';').shift();
      // Clean the value (remove any extra characters)
      return cookieValue ? cookieValue.trim() : null;
    }
    return null;
  };

  // Get all googtrans cookies (might be set with different domains)
  const getAllGoogTransCookies = () => {
    const cookies = [];
    const allCookies = document.cookie.split(';');
    allCookies.forEach(cookie => {
      const trimmed = cookie.trim();
      if (trimmed.startsWith('googtrans=')) {
        const value = trimmed.split('=')[1];
        if (value) cookies.push(value);
      }
    });
    return cookies;
  };

  const setGoogTransCookie = (value, days = 1) => {
    // First, clear all existing googtrans cookies
    clearAllGoogTransCookies();
    
    // Set cookie without domain (works everywhere)
    setCookie("googtrans", value, days);

    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);

    // On live server, also set with domain
    if (!isLocalhost && !isIp && hostname) {
      // Try with domain
      setCookie("googtrans", value, days, `.${hostname}`);
      // Also try without leading dot (some servers need this)
      const domainWithoutDot = hostname.split('.').slice(-2).join('.');
      if (domainWithoutDot !== hostname) {
        setCookie("googtrans", value, days, `.${domainWithoutDot}`);
      }
    }
  };

  const clearAllGoogTransCookies = () => {
    // Clear cookie without domain
    setCookie("googtrans", "", -1);
    
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);

    // Clear with domain on live server
    if (!isLocalhost && !isIp && hostname) {
      setCookie("googtrans", "", -1, `.${hostname}`);
      const domainWithoutDot = hostname.split('.').slice(-2).join('.');
      if (domainWithoutDot !== hostname) {
        setCookie("googtrans", "", -1, `.${domainWithoutDot}`);
      }
    }
  };

  const clearGoogTransCookie = () => {
    clearAllGoogTransCookies();
  };

  useEffect(() => {
    // Initialize Google Translate
    window.googleTranslateElementInit = function () {
      try {
        console.log("🔄 Initializing Google Translate...");
        
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: languages.map((lang) => lang.code).join(","),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );

        console.log("✅ Google Translate widget initialized");
        
        // Wait a bit for the widget to render
        setTimeout(() => {
          const gadget = document.querySelector(".goog-te-gadget");
          if (gadget) {
            console.log("✅ Google Translate gadget found");
            setIsReady(true);
            
            // Restore saved language cookie (WITHOUT reloading - page is already loading)
            const savedLanguage = localStorage.getItem("selectedLanguage") || "en";
            console.log(`📖 Restoring saved language cookie: ${savedLanguage}`);
            
            // Check if cookie is already set correctly
            const allCookies = getAllGoogTransCookies();
            const expectedCookie = savedLanguage === "en" ? "/en/en" : `/en/${savedLanguage}`;
            const hasCorrectCookie = allCookies.some(cookie => 
              cookie && (cookie === expectedCookie || cookie.includes(expectedCookie))
            );
            
            if (!hasCorrectCookie) {
              // Only set cookie if it's not already correct
              const cookieValue = savedLanguage === "en" ? "/en/en" : `/en/${savedLanguage}`;
              setGoogTransCookie(cookieValue, 1);
              console.log(`✅ Restored cookie: ${cookieValue}`);
            } else {
              console.log(`ℹ️ Cookie already set correctly: ${expectedCookie}`);
            }
            // DON'T reload - we're already on a fresh page load!
          } else {
            console.warn("⚠️ Gadget not found, but marking as ready");
            setIsReady(true);
          }
        }, 1000);
      } catch (error) {
        console.error("❌ Error initializing Google Translate:", error);
        setIsReady(true);
      }
    };

    // Load the script
    if (!document.getElementById("google-translate-script")) {
      console.log("📥 Loading Google Translate script...");
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.onload = () => {
        console.log("✅ Google Translate script loaded");
      };
      script.onerror = () => {
        console.error("❌ Failed to load Google Translate script");
        setIsReady(true);
      };
      document.body.appendChild(script);
    } else if (window.google && window.google.translate) {
      console.log("♻️ Google Translate script already loaded");
      window.googleTranslateElementInit();
    }

    // Get saved language
    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  const triggerTranslation = (langCode) => {
    console.log(`🌐 Triggering translation to: ${langCode}`);

    // Save to localStorage first (before any reload)
    localStorage.setItem("selectedLanguage", langCode);

    // Try to trigger Google Translate widget directly if available
    try {
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        // Try to programmatically change language
        const selectElement = document.querySelector('.goog-te-combo');
        if (selectElement) {
          const targetValue = langCode === "en" ? "" : langCode;
          selectElement.value = targetValue;
          selectElement.dispatchEvent(new Event('change'));
          console.log(`✅ Triggered widget change to: ${langCode}`);
        }
      }
    } catch (error) {
      console.log("⚠️ Could not trigger widget directly, using cookie method");
    }

    // Always clear all cookies first to avoid conflicts
    clearAllGoogTransCookies();
    
    // Small delay to ensure cookies are cleared
    setTimeout(() => {
      // Set Google Translate cookie
      const targetCookie = langCode === "en" ? "/en/en" : `/en/${langCode}`;
      setGoogTransCookie(targetCookie, 1);
      console.log(`✅ Set cookie: googtrans=${targetCookie}`);

      // Always reload to apply translation (ensures widget updates on live server)
      console.log("🔄 Reloading page to apply translation...");
      setTimeout(() => {
        window.location.reload();
      }, 200);
    }, 100);

    return true;
  };

  const changeLanguage = (langCode) => {
    console.log(`👤 User selected language: ${langCode}`);
    setSelectedLanguage(langCode);
    localStorage.setItem("selectedLanguage", langCode);
    setIsOpen(false);

    if (!isReady) {
      console.warn("⚠️ Google Translate not ready yet");
      return;
    }

    // Trigger translation
    triggerTranslation(langCode);
  };

  const getCurrentLanguageName = () => {
    const lang = languages.find((l) => l.code === selectedLanguage);
    return lang ? `${lang.flag} ${lang.name.split(" ")[0]}` : "🇬🇧 English";
  };

  return (
    <div className="google-translate-wrapper">
      {/* Google Translate Element (hidden) - Required for initialization */}
      <div 
        id="google_translate_element" 
        style={{ 
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          visibility: "hidden",
          opacity: 0,
        }}
      />

      {/* Custom Dropdown UI */}
      <Dropdown
        show={isOpen}
        onToggle={(isOpen) => setIsOpen(isOpen)}
        className="translate-dropdown"
      >
        <Dropdown.Toggle
          variant="light"
          id="translate-dropdown"
          className="translate-toggle"
          disabled={!isReady}
          title={!isReady ? "Loading translator..." : "Select language"}
        >
          <FaGlobe className="globe-icon" />
          <span className="language-text">
            {!isReady ? "Loading..." : getCurrentLanguageName()}
          </span>
        </Dropdown.Toggle>

        <Dropdown.Menu className="translate-menu">
          <div className="translate-menu-header">
            <FaGlobe className="menu-globe-icon" />
            <span>Select Language</span>
          </div>
          <Dropdown.Divider />
          <div className="translate-menu-scroll">
            {languages.map((lang) => (
              <Dropdown.Item
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`translate-item ${
                  selectedLanguage === lang.code ? "active" : ""
                }`}
              >
                <span className="lang-flag">{lang.flag}</span>
                <span className="lang-name">{lang.name}</span>
                {selectedLanguage === lang.code && (
                  <FaCheck className="check-icon" />
                )}
              </Dropdown.Item>
            ))}
          </div>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default GoogleTranslateV2;
