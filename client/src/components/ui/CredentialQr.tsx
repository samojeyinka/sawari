export function CredentialQr({ value, size = 56 }: { value: string; size?: number }) {
  // Deterministic SVG QR representation with standard finder patterns
  // Finder patterns at top-left, top-right, bottom-left
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-label={`QR Code for ${value}`}
    >
      <rect width="25" height="25" fill="white" />
      
      {/* Top Left Finder */}
      <rect x="2" y="2" width="7" height="7" stroke="black" strokeWidth="1" fill="none" />
      <rect x="4" y="4" width="3" height="3" fill="black" />
      
      {/* Top Right Finder */}
      <rect x="16" y="2" width="7" height="7" stroke="black" strokeWidth="1" fill="none" />
      <rect x="18" y="4" width="3" height="3" fill="black" />
      
      {/* Bottom Left Finder */}
      <rect x="2" y="16" width="7" height="7" stroke="black" strokeWidth="1" fill="none" />
      <rect x="4" y="18" width="3" height="3" fill="black" />
      
      {/* Timing lines & data pattern */}
      <rect x="10" y="4" width="1" height="1" fill="black" />
      <rect x="12" y="4" width="1" height="1" fill="black" />
      <rect x="14" y="4" width="1" height="1" fill="black" />
      <rect x="4" y="10" width="1" height="1" fill="black" />
      <rect x="4" y="12" width="1" height="1" fill="black" />
      <rect x="4" y="14" width="1" height="1" fill="black" />

      {/* Internal modules */}
      <rect x="10" y="8" width="1" height="1" fill="black" />
      <rect x="12" y="10" width="2" height="1" fill="black" />
      <rect x="11" y="12" width="1" height="2" fill="black" />
      <rect x="14" y="14" width="2" height="1" fill="black" />
      <rect x="10" y="16" width="1" height="2" fill="black" />
      <rect x="13" y="18" width="2" height="1" fill="black" />
      <rect x="16" y="11" width="1" height="2" fill="black" />
      <rect x="18" y="13" width="2" height="1" fill="black" />
      <rect x="21" y="10" width="1" height="3" fill="black" />
      <rect x="16" y="17" width="2" height="2" fill="black" />
      <rect x="20" y="18" width="2" height="1" fill="black" />
      <rect x="19" y="21" width="3" height="1" fill="black" />
      <rect x="10" y="21" width="2" height="1" fill="black" />
      <rect x="14" y="21" width="1" height="2" fill="black" />
      <rect x="7" y="10" width="1" height="1" fill="black" />
      <rect x="10" y="10" width="1" height="1" fill="black" />
      <rect x="8" y="14" width="1" height="1" fill="black" />
    </svg>
  )
}
