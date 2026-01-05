-- Supabase Schema for Shop Floor Kiosk / ChangeOver App
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Machines table
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipe sizes table
CREATE TABLE IF NOT EXISTS pipe_sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tools table
CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parts table
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    pipe_size TEXT NOT NULL,
    part_family TEXT NOT NULL,
    part_number TEXT,
    description TEXT,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    location TEXT,
    pdf_url TEXT,
    pdf_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_parts_machine_pipe ON parts(machine_id, pipe_size);
CREATE INDEX IF NOT EXISTS idx_parts_machine_pipe_family ON parts(machine_id, pipe_size, part_family);

-- Changeover templates table
CREATE TABLE IF NOT EXISTS changeover_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    estimated_time INTEGER,
    documents JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_machine ON changeover_templates(machine_id);

-- Changeover steps table (replaces Firestore subcollection)
CREATE TABLE IF NOT EXISTS changeover_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES changeover_templates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    required_part_names TEXT[],
    required_tools JSONB,
    image_urls TEXT[],
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_steps_template ON changeover_steps(template_id);

-- Changeover logs table
CREATE TABLE IF NOT EXISTS changeover_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    from_size TEXT NOT NULL,
    to_size TEXT NOT NULL,
    duration INTEGER NOT NULL,
    machine_name TEXT,
    operator_name TEXT,
    step_notes JSONB,
    final_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_machine ON changeover_logs(machine_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON changeover_logs(created_at);

-- Consumable items table
CREATE TABLE IF NOT EXISTS consumable_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consumables_machine ON consumable_items(machine_id);

-- Consumable logs table
CREATE TABLE IF NOT EXISTS consumable_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES consumable_items(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    quantity_used INTEGER NOT NULL,
    operator_name TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consumable_logs_item ON consumable_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_consumable_logs_machine ON consumable_logs(machine_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON tools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON changeover_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON changeover_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consumables_updated_at BEFORE UPDATE ON consumable_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional - configure as needed)
-- ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
-- etc.

-- Storage bucket for file uploads (run in Supabase Dashboard > Storage)
-- Create a bucket named 'uploads' with public access

-- RLS Policies for anonymous access (if using anon key)
-- CREATE POLICY "Allow anonymous read" ON machines FOR SELECT USING (true);
-- CREATE POLICY "Allow anonymous insert" ON machines FOR INSERT WITH CHECK (true);
-- etc.
