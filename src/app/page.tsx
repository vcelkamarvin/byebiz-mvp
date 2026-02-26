import Link from "next/link";

export default function Home() {
  return (
    <div className="auth-wrapper">
      <div className="box">
        <h1>Byebiz</h1>
        <h2>Digital M&A Marketplace</h2>
        <p>
          Welcome to Byebiz. We provide a transparent, data-driven valuation
          methodology to help you understand the true value of your SME.
        </p>

        <h3>Our 3-Step Valuation</h3>
        <ol style={{ marginLeft: "var(--spacing-md)", marginBottom: "var(--spacing-md)" }}>
          <li><strong>Data Collection:</strong> We gather basic business details and assess your risk profile.</li>
          <li><strong>OSINT Verification:</strong> Our AI cross-references public data to verify your market position.</li>
          <li><strong>Financial Extraction:</strong> We calculate your true Seller's Discretionary Earnings (SDE) from uploaded documents.</li>
        </ol>

        <div style={{ padding: "var(--spacing-sm)", border: "1px solid var(--border)", marginBottom: "var(--spacing-md)", fontSize: "0.875rem" }}>
          <strong>Legal Agreement & Data Processing</strong><br />
          By proceeding, you consent to our terms of service and allow us to process your company data, including performing automated public background checks (OSINT). Your data will be strictly used for valuation purposes and anonymized before being presented to potential investors.
        </div>

        <Link href="/intake" className="btn btn-accent">
          I Accept, Begin Valuation
        </Link>
      </div>
    </div>
  );
}
