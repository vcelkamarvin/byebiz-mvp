-- Create the main layerOneVerification table
CREATE TABLE public."layerOneVerification" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    city TEXT NOT NULL,
    estimated_revenue NUMERIC NOT NULL,
    
    -- Risk Profile
    risk_owner_dependence TEXT NOT NULL,
    risk_operating_leverage TEXT NOT NULL,
    risk_customer_concentration TEXT NOT NULL,
    risk_cash_flow TEXT NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending_osint',
    
    -- AI OSINT Verification Data (Phase 3)
    trust_score INTEGER,
    market_summary TEXT,
    osint_metrics JSONB,
    
    -- AI Financial Extraction Data (Phase 5)
    financial_net_profit NUMERIC,
    financial_add_backs NUMERIC,
    financial_sde NUMERIC,
    financial_metrics JSONB
);

-- Set up Row Level Security (RLS)
ALTER TABLE public."layerOneVerification" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (since it's an intake form without auth for now)
CREATE POLICY "Allow anonymous inserts" ON public."layerOneVerification"
    FOR INSERT WITH CHECK (true);

-- Create policy to allow anonymous reads (for the dashboard)
CREATE POLICY "Allow anonymous reads" ON public."layerOneVerification"
    FOR SELECT USING (true);
    
-- Set up Storage for Financial Documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('financial_documents', 'financial_documents', false);

-- Set up Storage Policies
CREATE POLICY "Allow anonymous uploads" ON storage.objects
    FOR INSERT TO public WITH CHECK (bucket_id = 'financial_documents');
    
CREATE POLICY "Allow public read of uploads" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'financial_documents');
