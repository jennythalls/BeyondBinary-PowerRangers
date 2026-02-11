const NTULogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <svg width="160" height="90" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left circle */}
        <circle cx="40" cy="40" r="32" stroke="black" strokeWidth="2.5" fill="none" />
        <circle cx="40" cy="40" r="29" stroke="black" strokeWidth="1.5" fill="none" />
        {/* Middle circle */}
        <circle cx="80" cy="40" r="32" stroke="black" strokeWidth="2.5" fill="none" />
        <circle cx="80" cy="40" r="29" stroke="black" strokeWidth="1.5" fill="none" />
        {/* Right circle */}
        <circle cx="120" cy="40" r="32" stroke="black" strokeWidth="2.5" fill="none" />
        <circle cx="120" cy="40" r="29" stroke="black" strokeWidth="1.5" fill="none" />
        {/* Letters */}
        <text x="40" y="46" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight="700" fontSize="22" fill="hsl(142, 71%, 35%)">N</text>
        <text x="80" y="46" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight="700" fontSize="22" fill="hsl(142, 71%, 35%)">T</text>
        <text x="120" y="46" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight="700" fontSize="22" fill="hsl(142, 71%, 35%)">U</text>
      </svg>
      <span className="font-display text-xl font-bold tracking-wider" style={{ color: "hsl(142, 71%, 35%)" }}>
        CIRCLES
      </span>
    </div>
  );
};

export default NTULogo;
