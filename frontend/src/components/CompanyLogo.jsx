export default function CompanyLogo({ className = '' }) {
  return (
    <span className={`company-logo ${className}`}>
      <img
        src="/logos/logo.png"
        alt="CCL — Corporación Colombiana de Logística"
        width={177}
        height={138}
        decoding="async"
      />
    </span>
  );
}
