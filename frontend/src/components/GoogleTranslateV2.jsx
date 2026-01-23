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

  // Helper function to set Google Translate cookie
  const setCookie = (name, value, days) => {
    const expires = days ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}` : "";
    document.cookie = `${name}=${value}${expires}; path=/`;
    console.log(`🍪 Cookie set: ${name}=${value}`);
  };

  // Helper function to get cookie value
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
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
            const savedLanguage = localStorage.getItem("selectedLanguage");
            if (savedLanguage && savedLanguage !== "en") {
              console.log(`📖 Restoring saved language cookie: ${savedLanguage}`);
              // Just set the cookie - Google Translate will pick it up automatically
              if (savedLanguage === "en") {
                setCookie("googtrans", "/en/en", 1);
              } else {
                setCookie("googtrans", `/en/${savedLanguage}`, 1);
              }
              // DON'T reload - we're already on a fresh page load!
            }
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

    // Check if cookie is already set to avoid unnecessary reload
    const currentCookie = getCookie("googtrans");
    const targetCookie = langCode === "en" ? "/en/en" : `/en/${langCode}`;
    
    if (currentCookie === targetCookie) {
      console.log(`ℹ️ Already translated to ${langCode}, no reload needed`);
      return true;
    }

    // Set Google Translate cookie
    if (langCode === "en") {
      // Clear translation
      setCookie("googtrans", "", -1); // Delete cookie
      setCookie("googtrans", "/en/en", 1);
      console.log("🔄 Cleared translation (back to English)");
    } else {
      setCookie("googtrans", `/en/${langCode}`, 1);
      console.log(`✅ Set cookie: googtrans=/en/${langCode}`);
    }

    // Reload the page to apply translation
    console.log("🔄 Reloading page to apply translation...");
    setTimeout(() => {
      window.location.reload();
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
