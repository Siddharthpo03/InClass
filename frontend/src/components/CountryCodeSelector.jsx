import React, { useState, useRef, useEffect } from "react";
import styles from "./CountryCodeSelector.module.css";

// Popular country codes with flags (emoji flags)
const countries = [
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+86", name: "China", flag: "🇨🇳" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "+7", name: "Russia", flag: "🇷🇺" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "+82", name: "South Korea", flag: "🇰🇷" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+52", name: "Mexico", flag: "🇲🇽" },
  { code: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "+31", name: "Netherlands", flag: "🇳🇱" },
];

const CountryCodeSelector = ({ value, onChange, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const selectedCountry =
    countries.find((c) => c.code === value) || countries[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code.includes(searchTerm)
  );

  const handleSelect = (countryCode) => {
    onChange(countryCode);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div
      className={`${styles.countryCodeWrapper} ${isOpen ? styles.open : ""}`}
      ref={dropdownRef}
    >
      <div
        className={`${styles.countryCodeSelector} ${
          isOpen ? styles.open : ""
        } ${error ? styles.error : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.flag}>{selectedCountry.flag}</span>
        <span className={styles.code}>{selectedCountry.code}</span>
        <i
          className={`bx bx-chevron-down ${styles.chevron} ${
            isOpen ? styles.rotate : ""
          }`}
        ></i>
      </div>
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchBox}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Search country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className={styles.countryList}>
            {filteredCountries.map((country) => (
              <div
                key={country.code}
                className={`${styles.countryItem} ${
                  value === country.code ? styles.selected : ""
                }`}
                onClick={() => handleSelect(country.code)}
              >
                <span className={styles.flag}>{country.flag}</span>
                <span className={styles.countryName}>{country.name}</span>
                <span className={styles.countryCode}>{country.code}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelector;
