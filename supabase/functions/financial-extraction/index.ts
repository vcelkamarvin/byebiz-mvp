import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { GoogleGenAI } from "npm:@google/genai"

console.log("Hello from financial-extraction!")

serve(async (req) => {
    try {
        const { recordId } = await req.json()

        if (!recordId) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 })
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        )

        // In a real scenario, we would download the files from Supabase Storage and parse PDF/Docx text.
        // Deno has some limitations with pure JS PDF parsing, but assuming we extract text here:
        // For MVP, we will simulate fetching the text or expect it to be passed.
        // Let's assume the user uploaded text files or we use an external parser APIs before sending to Gemini.

        // We will list the files in the directory
        const { data: files } = await supabaseClient.storage.from('financial_documents').list(recordId);

        let combinedText = "Extracted contents from:\n";
        if (files && files.length > 0) {
            for (const file of files) {
                const { data: fileData } = await supabaseClient.storage.from('financial_documents').download(`${recordId}/${file.name}`);
                if (fileData) {
                    const text = await fileData.text(); // Assuming text files for this MVP simplicity
                    combinedText += `\n--- ${file.name} ---\n${text.substring(0, 10000)}\n`;
                }
            }
        } else {
            throw new Error("No files found to analyze");
        }

        // Initialize Gemini API
        const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") });

        const prompt = `
      You are an expert M&A Financial Analyst. Review the following extracted textual data from uploaded Profit & Loss and Balance Sheet documents.
      
      Data:
      ${combinedText}
      
      Your goal is to calculate the TRUE Seller's Discretionary Earnings (SDE). 
      To do this, identify the current Net Profit, and identify any typical "Add-backs" (owner's salary, personal expenses run through the business, one-time non-recurring expenses).
      SDE = Net Profit + Add-backs.
      
      Output a strict JSON object with:
      - financial_net_profit (number)
      - financial_add_backs (number)
      - financial_sde (number)
      - notes (string explaining the add backs found)
      
      Respond with ONLY the JSON object. Do not include markdown formatting or backticks. If data is completely missing, estimate 0 or return error notes.
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: { temperature: 0.1 }
        });

        const textResponse = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const financialResult = JSON.parse(textResponse);

        // Update database record
        const { data, error } = await supabaseClient
            .from("layerOneVerification")
            .update({
                financial_net_profit: financialResult.financial_net_profit,
                financial_add_backs: financialResult.financial_add_backs,
                financial_sde: financialResult.financial_sde,
                financial_metrics: { notes: financialResult.notes },
                status: "financials_verified"
            })
            .eq("id", recordId)
            .select()

        if (error) throw error

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        console.error("Error in Financial Extraction function:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        })
    }
})
