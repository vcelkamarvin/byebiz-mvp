"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function IntakeForm() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = {
            company_name: formData.get("companyName"),
            industry: formData.get("industry"),
            city: formData.get("city"),
            estimated_revenue: Number(formData.get("revenue")),
            risk_owner_dependence: formData.get("ownerDependence"),
            risk_operating_leverage: formData.get("operatingLeverage"),
            risk_customer_concentration: formData.get("customerConcentration"),
            risk_cash_flow: formData.get("cashFlowPredictability"),
            status: "pending_osint", // Initial status
        };

        const { data: insertedData, error: dbError } = await supabase
            .from("layerOneVerification")
            .insert([data])
            .select()
            .single();

        if (dbError) {
            console.error(dbError);
            setError("Failed to save data. Please try again.");
            setLoading(false);
            return;
        }

        // Attempt to trigger OSINT edge function asynchronously (fire and forget for now, 
        // real implementation might wait or use a webhook response)
        // Actually, letting supabase edge function handle triggers is better (db webhook).
        // For manual triggering, we can call it here:
        supabase.functions.invoke("osint-verification", {
            body: { recordId: insertedData.id, companyName: data.company_name, city: data.city },
        }).catch(console.error);

        // Proceed to next phase
        router.push(`/upload?id=${insertedData.id}`);
    };

    return (
        <div className="container" style={{ padding: "var(--spacing-xl) 0" }}>
            <div className="box" style={{ margin: "0 auto", maxWidth: "800px" }}>
                <h2>Company Intake</h2>
                <p>Please provide verifiable details about your business. Our AI will cross-reference this data.</p>

                {error && <div style={{ color: "var(--accent)", marginBottom: "var(--spacing-md)" }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
                        <div>
                            <label htmlFor="companyName">Legal Company Name</label>
                            <input type="text" id="companyName" name="companyName" required placeholder="e.g. Byebiz GmbH" />
                        </div>
                        <div>
                            <label htmlFor="industry">Industry</label>
                            <input type="text" id="industry" name="industry" required placeholder="e.g. Software Development" />
                        </div>
                        <div>
                            <label htmlFor="city">City (Germany)</label>
                            <input type="text" id="city" name="city" required placeholder="e.g. Berlin" />
                        </div>
                        <div>
                            <label htmlFor="revenue">Est. Annual Revenue (€)</label>
                            <input type="number" id="revenue" name="revenue" required placeholder="500000" min="0" step="1000" />
                        </div>
                    </div>

                    <hr style={{ margin: "var(--spacing-md) 0", borderColor: "var(--border)" }} />
                    <h3>Risk Profile Assessment</h3>

                    <label>Owner Dependence</label>
                    <select name="ownerDependence" required>
                        <option value="">Select an option...</option>
                        <option value="high">High (Owner manages all daily operations)</option>
                        <option value="medium">Medium (Owner has a management team but is critical)</option>
                        <option value="low">Low (Business runs independently of owner)</option>
                    </select>

                    <label>Operating Leverage</label>
                    <select name="operatingLeverage" required>
                        <option value="">Select an option...</option>
                        <option value="high">High (High fixed costs, low variable costs)</option>
                        <option value="medium">Medium (Balanced fixed and variable costs)</option>
                        <option value="low">Low (Low fixed costs, scales easily)</option>
                    </select>

                    <label>Customer Concentration</label>
                    <select name="customerConcentration" required>
                        <option value="">Select an option...</option>
                        <option value="high">High (Top 3 clients &gt; 50% revenue)</option>
                        <option value="medium">Medium (Top 3 clients 20-50% revenue)</option>
                        <option value="low">Low (Highly diversified client base)</option>
                    </select>

                    <label>Cash Flow Predictability</label>
                    <select name="cashFlowPredictability" required>
                        <option value="">Select an option...</option>
                        <option value="high">High (Recurring revenue, long-term contracts)</option>
                        <option value="medium">Medium (Project-based but consistent historicals)</option>
                        <option value="low">Low (Highly seasonal or unpredictable)</option>
                    </select>

                    <button type="submit" className="btn btn-accent" disabled={loading} style={{ marginTop: "var(--spacing-md)" }}>
                        {loading ? "Processing..." : "Submit & Start Verification"}
                    </button>
                </form>
            </div>
        </div>
    );
}
