import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { GoogleGenAI } from "npm:@google/genai"

console.log("Hello from osint-verification!")

serve(async (req) => {
    try {
        const { recordId, companyName, city } = await req.json()

        if (!recordId || !companyName || !city) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 })
        }

        // Initialize Gemini API
        const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") });

        const prompt = `
      You are an M&A OSINT Analyst. Run a search for the company "${companyName}" located in "${city}, Germany".
      Your goal is to extract exactly these 10 metrics:
      1. Founding year (from Impressum or registers)
      2. Estimated employee count (from LinkedIn)
      3. Public ratings and reviews
      4. Active job postings indicating growth
      5. Industry certifications like ISO
      6. Media or PR mentions
      7. Website technology modernity
      8. Public presence of key management
      9. Number of physical locations
      10. Digital activity frequency
      
      Evaluate these points and generate a strict JSON object with:
      - trustScore (integer between 0 and 100 representing confidence and legitimacy)
      - marketSummary (a detailed text summary of your findings as an anonymous teaser)
      - metrics (a JSON object containing the 10 data points you found)
      
      Respond with ONLY the JSON object. Do not include markdown formatting or backticks around the JSON.
    `;

        // Use Gemini 1.5 Flash with Search Grounding
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.2,
            }
        });

        const textResponse = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const osintResult = JSON.parse(textResponse);

        // Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        )

        // Update the database record
        const { data, error } = await supabaseClient
            .from("layerOneVerification")
            .update({
                trust_score: osintResult.trustScore,
                market_summary: osintResult.marketSummary,
                osint_metrics: osintResult.metrics,
                status: "osint_verified"
            })
            .eq("id", recordId)
            .select()

        if (error) throw error

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        console.error("Error in OSINT function:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        })
    }
})
