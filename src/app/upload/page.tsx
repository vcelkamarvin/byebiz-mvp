"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function UploadForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const recordId = searchParams.get("id");
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!recordId) {
            setError("Missing record ID. Please start from the beginning.");
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const files = ["pnl", "balanceSheet", "addBacks"];

        try {
            for (const fileKey of files) {
                const file = formData.get(fileKey) as File;
                if (file && file.size > 0) {
                    const filePath = `${recordId}/${fileKey}-${file.name}`;
                    const { error: uploadError } = await supabase.storage
                        .from("financial_documents")
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;
                }
            }

            setSuccess(true);

            // Update status
            await supabase
                .from("layerOneVerification")
                .update({ status: "processing_financials" })
                .eq("id", recordId);

            // Trigger financial extraction edge function
            supabase.functions.invoke("financial-extraction", {
                body: { recordId },
            }).catch(console.error);

            // Redirect after a short delay
            setTimeout(() => {
                router.push(`/dashboard/${recordId}`);
            }, 2000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to upload documents.");
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="box" style={{ textAlign: "center" }}>
                <h2 style={{ color: "var(--accent)" }}>Upload Successful</h2>
                <p>Your documents have been securely transmitted.</p>
                <p style={{ fontSize: "0.875rem", opacity: 0.7 }}>Analyzing financials and redirecting to your teaser dashboard...</p>
            </div>
        );
    }

    return (
        <div className="box">
            <h2>Financial Document Verification</h2>
            <p>Please upload your financial statements for our AI to calculate your true Seller's Discretionary Earnings (SDE).</p>

            {error && <div style={{ color: "var(--accent)", marginBottom: "var(--spacing-md)" }}>{error}</div>}

            <form onSubmit={handleUpload}>
                <div style={{ marginBottom: "var(--spacing-md)" }}>
                    <label htmlFor="pnl">Profit and Loss Statement (PDF/Text)</label>
                    <input type="file" id="pnl" name="pnl" accept=".pdf,.doc,.docx,.txt" required />
                </div>

                <div style={{ marginBottom: "var(--spacing-md)" }}>
                    <label htmlFor="balanceSheet">Balance Sheet (PDF/Text)</label>
                    <input type="file" id="balanceSheet" name="balanceSheet" accept=".pdf,.doc,.docx,.txt" required />
                </div>

                <div style={{ marginBottom: "var(--spacing-md)" }}>
                    <label htmlFor="addBacks">List of Add-backs / Personal Expenses (Optional)</label>
                    <input type="file" id="addBacks" name="addBacks" accept=".pdf,.doc,.docx,.txt" />
                </div>

                <button type="submit" className="btn btn-accent" disabled={loading}>
                    {loading ? "Uploading & Analyzing..." : "Upload Securely"}
                </button>
            </form>
        </div>
    );
}

export default function DocumentUpload() {
    return (
        <div className="container" style={{ padding: "var(--spacing-xl) 0", display: "flex", justifyContent: "center" }}>
            <Suspense fallback={<div className="box">Loading...</div>}>
                <UploadForm />
            </Suspense>
        </div>
    );
}
