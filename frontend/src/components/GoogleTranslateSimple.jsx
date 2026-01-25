import React, { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { FaGlobe, FaCheck } from "react-icons/fa";
import "./GoogleTranslate.css";

/**
 * Simplified Google Translate Widget - Visible Approach
 * Google Translate needs the element to be visible in DOM to initialize properly
 */
const GoogleTranslateSimple = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "hi", name: "हिंदी (Hindi)", flag: "🇮🇳" },
    { code: "mr", name: "मराठी (Marathi)", flag: "🇮🇳" },
    { code: "gu", name: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
    { code: "ta", name: "தமிழ் (Tamil)", flag: "🇮🇳" },
    { code: "te", name: "తెలుగు (Telugu)", flag: "🇮🇳" },
    { code: "kn", name: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
    { code: "bn", name: "বাংলা (Bengali)", flag: "🇮🇳" },
    { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)", flag: "🇮🇳" },
    { code: "ml", name: "മലയാളം (Malayalam)", flag: "🇮🇳" },
    { code: "or", name: "ଓଡ଼ିଆ (Odia)", flag: "🇮🇳" },
    { code: "ur", name: "اردو (Urdu)", flag: "🇵🇰" },
  ];

  useEffect(() => {
    // Initialize Google Translate
    window.googleTranslateElementInit = function () {
      console.log("✅ Initializing Google Translate (Simple Version)");
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: languages.map((lang) => lang.code).join(","),
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element_simple"
      );
      
      console.log("✅ Widget created - check page for Google Translate widget");
    };

    // Load script if not already loaded
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    } else if (window.google && window.google.translate) {
      window.googleTranslateElementInit();
    }

    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (langCode) => {
    setSelectedLanguage(langCode);
    localStorage.setItem("selectedLanguage", langCode);
    setIsOpen(false);

    setTimeout(() => {
      const selectElement = document.querySelector(".goog-te-combo");
      if (selectElement) {
        console.log(`🌐 Changing language to: ${langCode}`);
        selectElement.value = langCode;
        selectElement.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        console.log("⚠️ Google Translate not ready yet");
      }
    }, 100);
  };

  const getCurrentLanguageName = () => {
    const lang = languages.find((l) => l.code === selectedLanguage);
    return lang ? `${lang.flag} ${lang.name.split(" ")[0]}` : "🇬🇧 English";
  };

  return (
    <div className="google-translate-wrapper">
      {/* Visible Google Translate Element - will be styled by Google */}
      <div 
        id="google_translate_element_simple"
        style={{
          position: "fixed",
          bottom: "10px",
          right: "10px",
          padding: "10px",
          background: "white",
          border: "2px solid #fcd02a",
          borderRadius: "5px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          zIndex: 9999
        }}
      >
        <div style={{ fontSize: "12px", marginBottom: "5px", color: "#666" }}>
          Google Translate Widget:
        </div>
      </div>

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
        >
          <FaGlobe className="globe-icon" />
          <span className="language-text">{getCurrentLanguageName()}</span>
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

export default GoogleTranslateSimple;
