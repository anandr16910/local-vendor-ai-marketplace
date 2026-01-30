-- Create database for development
CREATE DATABASE local_vendor_ai;

-- Create database for testing
CREATE DATABASE local_vendor_ai_test;

-- Create user for the application
CREATE USER local_vendor_user WITH PASSWORD 'local_vendor_pass';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE local_vendor_ai TO local_vendor_user;
GRANT ALL PRIVILEGES ON DATABASE local_vendor_ai_test TO local_vendor_user;

-- Connect to the main database
\c local_vendor_ai;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create initial tables
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('vendor', 'buyer', 'intermediary')),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    location JSONB,
    preferences JSONB,
    security_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vendor_profiles (
    vendor_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    business_info JSONB NOT NULL,
    reputation JSONB DEFAULT '{"overall": 0, "quality": 0, "fairness": 0, "service": 0, "reliability": 0, "totalReviews": 0, "recentReviews": 0, "verifiedReviews": 0}',
    specializations TEXT[] DEFAULT '{}',
    verification_status JSONB DEFAULT '{"isVerified": false, "verificationLevel": "basic"}',
    market_presence JSONB DEFAULT '{"yearsActive": 0, "totalTransactions": 0, "monthlyTransactions": 0}',
    cultural_preferences JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    images TEXT[] DEFAULT '{}',
    specifications JSONB DEFAULT '[]',
    base_price DECIMAL(10,2) NOT NULL,
    availability JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    negotiation_session_id UUID,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'initiated' CHECK (status IN (
        'initiated', 'pending_payment', 'payment_confirmed', 'in_progress', 
        'completed', 'cancelled', 'disputed', 'refunded'
    )),
    location JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create vendor feedback table
CREATE TABLE vendor_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    ratings JSONB NOT NULL, -- {quality: 1-5, fairness: 1-5, service: 1-5, reliability: 1-5}
    comments TEXT,
    would_recommend BOOLEAN NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transaction_id) -- One feedback per transaction
);

-- Create verification documents table
CREATE TABLE verification_documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'business_license', 'tax_certificate', 'identity_proof', 'address_proof', 'bank_details'
    )),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN (
        'pending', 'approved', 'rejected'
    )),
    rejection_reason TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(user_id)
);

-- Create negotiation sessions table
CREATE TABLE negotiation_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'paused', 'completed', 'cancelled', 'expired'
    )),
    current_offer JSONB,
    negotiation_history JSONB DEFAULT '[]',
    cultural_context JSONB,
    final_agreement JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create market data table
CREATE TABLE market_data (
    data_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    location JSONB NOT NULL,
    price_points JSONB NOT NULL,
    demand_indicators JSONB DEFAULT '[]',
    seasonal_factors JSONB DEFAULT '[]',
    competitor_analysis JSONB DEFAULT '[]',
    data_source VARCHAR(100) NOT NULL,
    reliability DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment sessions table
CREATE TABLE payment_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'initiated' CHECK (status IN (
        'initiated', 'pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'
    )),
    gateway_transaction_id VARCHAR(255),
    gateway_provider VARCHAR(50),
    payment_url TEXT,
    qr_code TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create market data processed tracking table
CREATE TABLE market_data_processed (
    transaction_id UUID PRIMARY KEY REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_market_data_processed_transaction ON market_data_processed(transaction_id);
CREATE INDEX idx_market_data_processed_processed_at ON market_data_processed(processed_at);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_location ON users USING GIN(location);
CREATE INDEX idx_users_verified ON users(is_verified);

CREATE INDEX idx_vendor_profiles_specializations ON vendor_profiles USING GIN(specializations);
CREATE INDEX idx_vendor_profiles_business_info ON vendor_profiles USING GIN(business_info);
CREATE INDEX idx_vendor_profiles_reputation ON vendor_profiles USING GIN(reputation);

CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category, subcategory);
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_price ON products(base_price);

CREATE INDEX idx_transactions_vendor ON transactions(vendor_id);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_product ON transactions(product_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_transactions_amount ON transactions(amount);

CREATE INDEX idx_vendor_feedback_vendor ON vendor_feedback(vendor_id);
CREATE INDEX idx_vendor_feedback_buyer ON vendor_feedback(buyer_id);
CREATE INDEX idx_vendor_feedback_transaction ON vendor_feedback(transaction_id);
CREATE INDEX idx_vendor_feedback_submitted ON vendor_feedback(submitted_at);
CREATE INDEX idx_vendor_feedback_verified ON vendor_feedback(is_verified);

CREATE INDEX idx_verification_documents_vendor ON verification_documents(vendor_id);
CREATE INDEX idx_verification_documents_status ON verification_documents(verification_status);
CREATE INDEX idx_verification_documents_type ON verification_documents(document_type);

CREATE INDEX idx_negotiation_sessions_vendor ON negotiation_sessions(vendor_id);
CREATE INDEX idx_negotiation_sessions_buyer ON negotiation_sessions(buyer_id);
CREATE INDEX idx_negotiation_sessions_product ON negotiation_sessions(product_id);
CREATE INDEX idx_negotiation_sessions_status ON negotiation_sessions(status);
CREATE INDEX idx_negotiation_sessions_activity ON negotiation_sessions(last_activity);

CREATE INDEX idx_market_data_category ON market_data(category, subcategory);
CREATE INDEX idx_market_data_location ON market_data USING GIN(location);
CREATE INDEX idx_market_data_created ON market_data(created_at);

CREATE INDEX idx_payment_sessions_transaction ON payment_sessions(transaction_id);
CREATE INDEX idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX idx_payment_sessions_gateway ON payment_sessions(gateway_transaction_id);

-- Create trigger to update search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.name, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' || 
        COALESCE(NEW.category, '') || ' ' || 
        COALESCE(NEW.subcategory, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_search_vector
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_vendor_profiles_updated_at
    BEFORE UPDATE ON vendor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update transaction completed_at when status changes to completed
CREATE OR REPLACE FUNCTION update_transaction_completed_at()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transaction_completed_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_transaction_completed_at();

-- Create function to update negotiation session activity timestamp
CREATE OR REPLACE FUNCTION update_negotiation_activity()
RETURNS TRIGGER AS $
BEGIN
    NEW.last_activity = NOW();
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_negotiation_activity
    BEFORE UPDATE ON negotiation_sessions
    FOR EACH ROW EXECUTE FUNCTION update_negotiation_activity();