"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Dashboard({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data: record, error } = await supabase
                .from("layerOneVerification")
                .select("*")
                .eq("id", params.id)
                .single();

            if (!error && record) {
                setData(record);
            }
            setLoading(false);
        };

        fetchData();

        // Subscribe to changes
        const channel = supabase
            .channel("custom-filter-channel")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "layerOneVerification", filter: `id=eq.${params.id}` },
                (payload) => setData(payload.new)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [params.id, supabase]);

    if (loading) return <div className="container" style={{ padding: "var(--spacing-xl) 0" }}>Loading Teaser Dashboard...</div>;
    if (!data) return <div className="container" style={{ padding: "var(--spacing-xl) 0" }}>Valuation record not found.</div>;

    return (
        <div className="container" style={{ padding: "var(--spacing-md) 0" }}>
            <header style={{ marginBottom: "var(--spacing-xl)", borderBottom: "4px solid var(--foreground)", paddingBottom: "var(--spacing-md)" }}>
                <h1>Anonymous Investor Teaser</h1>
                <p>Project ID: {data.id.split('-')[0]}</p>
                <div style={{ display: "inline-block", background: "var(--foreground)", color: "var(--background)", padding: "4px 8px", fontWeight: "bold", textTransform: "uppercase" }}>
                    Status: {data.status.replace('_', ' ')}
                </div>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-lg)" }}>
                {/* Left Column: Business & Risk */}
                <div>
                    <div className="box" style={{ marginBottom: "var(--spacing-lg)", borderTopWidth: "8px", borderTopColor: "var(--accent)" }}>
                        <h2>Business Overview</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-sm)", marginBottom: "var(--spacing-md)" }}>
                            <div><strong>Industry:</strong> {data.industry}</div>
                            <div><strong>Location:</strong> {data.city}</div>
                            <div><strong>Self-Reported Revenue:</strong> €{Number(data.estimated_revenue).toLocaleString()}</div>
                        </div>

                        <h3 style={{ marginTop: "var(--spacing-md)" }}>Risk Assessment</h3>
                        <ul style={{ listStyle: "none", padding: 0 }}>
                            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                                <strong>Owner Dependence:</strong> <span style={{ textTransform: "uppercase" }}>{data.risk_owner_dependence}</span>
                            </li>
                            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                                <strong>Operating Leverage:</strong> <span style={{ textTransform: "uppercase" }}>{data.risk_operating_leverage}</span>
                            </li>
                            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                                <strong>Customer Concentration:</strong> <span style={{ textTransform: "uppercase" }}>{data.risk_customer_concentration}</span>
                            </li>
                            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                                <strong>Cash Flow Predictability:</strong> <span style={{ textTransform: "uppercase" }}>{data.risk_cash_flow}</span>
                            </li>
                        </ul>
                    </div>

                    <div className="box">
                        <h2>AI Verified Financials</h2>
                        {data.financial_sde ? (
                            <>
                                <div style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "var(--spacing-sm)" }}>
                                    SDE: €{Number(data.financial_sde).toLocaleString()}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-sm)", opacity: 0.8 }}>
                                    <div>Net Profit: €{Number(data.financial_net_profit).toLocaleString()}</div>
                                    <div>Add-backs: €{Number(data.financial_add_backs).toLocaleString()}</div>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: "var(--spacing-lg) 0", textAlign: "center", color: "var(--border)" }}>
                                <em>Financials currently under processing or awaiting upload.</em>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: OSINT */}
                <div>
                    <div className="box" style={{ height: "100%", background: "#f8f9fa", borderColor: "#f8f9fa" }}>
                        <h2>Market Verification (OSINT)</h2>
                        {data.trust_score ? (
                            <>
                                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-md)" }}>
                                    <div style={{ fontSize: "3rem", fontWeight: "bold", color: data.trust_score >= 80 ? "var(--foreground)" : "var(--accent)" }}>
                                        {data.trust_score}/100
                                    </div>
                                    <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>Trust Score</div>
                                </div>

                                <h3 style={{ fontSize: "1.2rem", marginBottom: "var(--spacing-xs)" }}>Market Summary</h3>
                                <p style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>{data.market_summary}</p>

                                {data.osint_metrics && (
                                    <div style={{ marginTop: "var(--spacing-md)", fontSize: "0.85rem" }}>
                                        <strong>Metrics Verified:</strong>
                                        <pre style={{ background: "#fff", padding: "8px", border: "1px solid #ddd", overflowX: "auto", marginTop: "8px" }}>
                                            {JSON.stringify(data.osint_metrics, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ padding: "var(--spacing-xl) 0", textAlign: "center", color: "var(--border)" }}>
                                <em>OSINT Background Check in progress...</em>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
