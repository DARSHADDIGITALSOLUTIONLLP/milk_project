import React, { useEffect, useState, useRef } from "react";
import { Dropdown } from "react-bootstrap";
import { FaGlobe, FaCheck } from "react-icons/fa";
import "./GoogleTranslate.css";
import "./GoogleTranslate-EnhancedStyles.css";

const GoogleTranslate = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isOpen, setIsOpen] = useState(false);
  const googleTranslateRef = useRef(null);

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
    // Load Google Translate script
    const addScript = () => {
      if (!window.google || !window.google.translate) {
        const script = document.createElement("script");
        script.src =
          "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);
      } else {
        // Script already loaded, initialize
        if (window.googleTranslateElementInit) {
          window.googleTranslateElementInit();
        }
      }
    };

    // Initialize Google Translate
    window.googleTranslateElementInit = () => {
      if (googleTranslateRef.current && !googleTranslateRef.current.hasChildNodes()) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: languages.map((lang) => lang.code).join(","),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );

        // Wait for the element to be initialized
        setTimeout(() => {
          const savedLanguage = localStorage.getItem("selectedLanguage");
          if (savedLanguage && savedLanguage !== "en") {
            changeLanguage(savedLanguage);
          }
        }, 1000);
      }
    };

    addScript();

    // Get current language from localStorage
    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (langCode) => {
    setSelectedLanguage(langCode);
    localStorage.setItem("selectedLanguage", langCode);
    setIsOpen(false);

    // Wait a bit for Google Translate to be ready
    setTimeout(() => {
      // Trigger Google Translate
      const selectElement = document.querySelector(".goog-te-combo");
      if (selectElement) {
        selectElement.value = langCode;
        selectElement.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        console.log("Google Translate not ready yet, retrying...");
        // Retry after a delay
        setTimeout(() => {
          const retryElement = document.querySelector(".goog-te-combo");
          if (retryElement) {
            retryElement.value = langCode;
            retryElement.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }, 500);
      }
    }, 100);
  };

  const getCurrentLanguageName = () => {
    const lang = languages.find((l) => l.code === selectedLanguage);
    return lang ? `${lang.flag} ${lang.name.split(" ")[0]}` : "🇬🇧 English";
  };

  return (
    <div className="google-translate-wrapper">
      {/* Hidden Google Translate Element */}
      <div
        id="google_translate_element"
        ref={googleTranslateRef}
        style={{ display: "none" }}
      ></div>

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

export default GoogleTranslate;
