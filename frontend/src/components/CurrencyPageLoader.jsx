import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CURRENCIES = [
  { symbol: '$', code: 'USD' },
  { symbol: '₹', code: 'INR' },
  { symbol: '€', code: 'EUR' },
  { symbol: '£', code: 'GBP' },
  { symbol: '¥', code: 'JPY' }
];

export default function CurrencyPageLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [currIndex, setCurrIndex] = useState(0);

  useEffect(() => {
    setLoading(true);

    // Fast smooth currency flip
    const currInterval = setInterval(() => {
      setCurrIndex((prev) => (prev + 1) % CURRENCIES.length);
    }, 120);

    // Clean smooth page transition without countdown timer
    const timer = setTimeout(() => {
      setLoading(false);
      clearInterval(currInterval);
    }, 800);

    return () => {
      clearTimeout(timer);
      clearInterval(currInterval);
    };
  }, [location.pathname]);

  if (!loading) return null;

  const currentCurr = CURRENCIES[currIndex];

  return (
    <div className="currency-loader-overlay">
      <div className="currency-loader-minimal">
        
        {/* Minimal Bank Gold Coin */}
        <div className="bank-coin-minimal">
          <span className="coin-symbol-min">{currentCurr.symbol}</span>
        </div>

        {/* Clean Institutional Loading Title */}
        <div className="loader-text-min">
          <div className="loader-title-min">Authenticating Risk Ledger</div>
          <div className="loader-sub-min">Verifying Model Governance & Regulatory Standards</div>
        </div>

        {/* Currency ticker indicators */}
        <div className="currency-line-min">
          {CURRENCIES.map((c, i) => (
            <span 
              key={c.code} 
              className={`curr-dot ${i === currIndex ? 'active' : ''}`}
            >
              {c.symbol}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}
