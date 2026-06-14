-- Schema for ReachIQ CRM (PostgreSQL / Supabase)

-- 1. Create Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    city VARCHAR(100) NOT NULL,
    last_order_date TIMESTAMP WITH TIME ZONE,
    total_spent DECIMAL(12, 2) DEFAULT 0.00,
    order_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for segmentation lookups
CREATE INDEX IF NOT EXISTS idx_customers_segmentation ON customers (total_spent, last_order_date, city);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'completed' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on customer_id for orders list
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);

-- 3. Create Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    intent TEXT,
    segment_filters JSONB DEFAULT '{}'::jsonb,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
    message_template TEXT NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status VARCHAR(50) DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'sending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Delivery Status Table
CREATE TABLE IF NOT EXISTS delivery_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed')),
    error_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Crucial: Unique constraint to guarantee callback idempotency
    CONSTRAINT unique_campaign_customer UNIQUE (campaign_id, customer_id)
);

-- Index on campaign_id for dashboard query aggregations
CREATE INDEX IF NOT EXISTS idx_delivery_status_campaign ON delivery_status (campaign_id);

-- 5. Helper function for idempotent updates with state-machine progression validation
-- Prevents updating a status backward (e.g. from 'opened' back to 'sent')
CREATE OR REPLACE FUNCTION upsert_delivery_status(
    p_campaign_id UUID,
    p_customer_id UUID,
    p_status VARCHAR,
    p_error_message TEXT
) RETURNS VOID AS $$
DECLARE
    current_status VARCHAR;
    status_order INT;
    new_status_order INT;
BEGIN
    -- Get current status if exists
    SELECT status INTO current_status 
    FROM delivery_status 
    WHERE campaign_id = p_campaign_id AND customer_id = p_customer_id;
    
    IF current_status IS NULL THEN
        -- Insert new record
        INSERT INTO delivery_status (campaign_id, customer_id, status, error_message, updated_at)
        VALUES (p_campaign_id, p_customer_id, p_status, p_error_message, now());
    ELSE
        -- Map statuses to order priority
        -- pending(0), sent(1), delivered(2), opened(3), clicked(4), failed(5)
        status_order := CASE current_status
            WHEN 'pending' THEN 0
            WHEN 'sent' THEN 1
            WHEN 'delivered' THEN 2
            WHEN 'opened' THEN 3
            WHEN 'clicked' THEN 4
            WHEN 'failed' THEN 5
            ELSE -1
        END;
        
        new_status_order := CASE p_status
            WHEN 'pending' THEN 0
            WHEN 'sent' THEN 1
            WHEN 'delivered' THEN 2
            WHEN 'opened' THEN 3
            WHEN 'clicked' THEN 4
            WHEN 'failed' THEN 5
            ELSE -1
        END;
        
        -- Update only if state transitions forward
        IF new_status_order > status_order THEN
            UPDATE delivery_status 
            SET status = p_status,
                error_message = p_error_message,
                updated_at = now()
            WHERE campaign_id = p_campaign_id AND customer_id = p_customer_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;
