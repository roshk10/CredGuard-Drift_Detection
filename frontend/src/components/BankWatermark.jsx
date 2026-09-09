import React from 'react';

export default function BankWatermark() {
  return (
    <div className="bank-security-seal-watermark">
      <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" stroke="rgba(37, 99, 235, 0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="38" stroke="rgba(37, 99, 235, 0.1)" strokeWidth="1" />
        <path d="M50 20 L75 32 V52 C75 68 50 80 50 80 C50 80 25 68 25 52 V32 L50 20 Z" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1.5" fill="rgba(37, 99, 235, 0.03)" />
        <text x="50" y="52" textAnchor="middle" fill="rgba(96, 165, 250, 0.25)" fontSize="8" fontWeight="bold" fontFamily="serif" letterSpacing="1">CREDGUARD</text>
        <text x="50" y="60" textAnchor="middle" fill="rgba(148, 163, 184, 0.2)" fontSize="5.5" fontFamily="monospace">RISK ENGINE</text>
      </svg>
    </div>
  );
}
