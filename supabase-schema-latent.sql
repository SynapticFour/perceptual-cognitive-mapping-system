-- Latent Cognitive Representation Schema
-- Enhanced database schema for high-dimensional cognitive representations
-- Supports rich response capture, feature extraction, and ML-ready data structures

-- Enable Row Level Security
ALTER ROLE postgres SET "app.settings.jwt_secret" = 'your-secret-key';

-- Enhanced Sessions Table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS latent_model_version TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS latent_vector_dimension INTEGER DEFAULT 64;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS feature_extraction_method TEXT DEFAULT 'statistical-v1.0';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS raw_response_count INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_info JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS browser_info JSONB;

-- Raw Responses Table (NEW)
CREATE TABLE IF NOT EXISTS raw_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    selected_answer INTEGER NOT NULL CHECK (selected_answer >= 1 AND selected_answer <= 5),
    response_time INTEGER NOT NULL, -- milliseconds
    timestamp BIGINT NOT NULL, -- epoch time
    question_context JSONB NOT NULL, -- category, difficulty, type, tags
    confidence DECIMAL(3,2), -- Response confidence if available
    answer_changes INTEGER DEFAULT 0, -- Number of times user changed answer
    metadata JSONB, -- Additional response metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_raw_responses_session (session_id),
    INDEX idx_raw_responses_timestamp (timestamp),
    INDEX idx_raw_responses_question (question_id)
);

-- Raw Response Batches Table (NEW)
CREATE TABLE IF NOT EXISTS raw_response_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    responses JSONB NOT NULL, -- Array of raw responses
    batch_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_count INTEGER NOT NULL,
    metadata JSONB, -- Session stats, model version, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_raw_batches_session (session_id)
);

-- Cognitive Features Table (NEW)
CREATE TABLE IF NOT EXISTS cognitive_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    features JSONB NOT NULL, -- Extracted cognitive features
    feature_version TEXT NOT NULL DEFAULT 'statistical-v1.0',
    extraction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confidence DECIMAL(3,2), -- Overall feature confidence
    metadata JSONB, -- Feature extraction metadata
    
    INDEX idx_cognitive_features_session (session_id),
    INDEX idx_cognitive_features_version (feature_version)
);

-- Latent Cognitive Vectors Table (NEW)
CREATE TABLE IF NOT EXISTS latent_cognitive_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    vector VECTOR(64) NOT NULL, -- High-dimensional latent vector
    dimension INTEGER NOT NULL DEFAULT 64, -- Vector dimension
    version TEXT NOT NULL DEFAULT 'latent-v1.0',
    confidence DECIMAL(3,2) NOT NULL, -- Overall representation confidence
    features_id UUID REFERENCES cognitive_features(id) ON DELETE SET NULL,
    metadata JSONB, -- Creation metadata, device info, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vector similarity index for efficient nearest neighbor searches
    INDEX idx_latent_vectors_vector USING ivfflat (vector vector_cosine_ops),
    INDEX idx_latent_vectors_session (session_id),
    INDEX idx_latent_vectors_version (version)
);

-- Clustering Results Table (NEW)
CREATE TABLE IF NOT EXISTS cognitive_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    cluster_id INTEGER NOT NULL,
    cluster_label TEXT NOT NULL,
    cluster_confidence DECIMAL(3,2),
    cluster_size INTEGER,
    distance_to_center DECIMAL(8,4),
    clustering_method TEXT NOT NULL DEFAULT 'kmeans',
    clustering_version TEXT NOT NULL DEFAULT 'v1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_cognitive_clusters_session (session_id),
    INDEX idx_cognitive_clusters_cluster (cluster_id, clustering_version)
);

-- Model Versioning Table (NEW)
CREATE TABLE IF NOT EXISTS model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, -- 'feature_extractor', 'latent_generator', 'clustering'
    description TEXT,
    parameters JSONB, -- Model parameters and configuration
    performance_metrics JSONB, -- Accuracy, F1-score, etc.
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_model_versions_type (type),
    INDEX idx_model_versions_active (is_active)
);

-- Feature Importances Table (NEW)
CREATE TABLE IF NOT EXISTS feature_importances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version_id UUID NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    importance DECIMAL(5,4) NOT NULL,
    contribution_variance DECIMAL(5,4), -- How much this feature varies
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_feature_importances_version (model_version_id),
    INDEX idx_feature_importances_feature (feature_name)
);

-- Enhanced Research Assessments Table
ALTER TABLE research_assessments ADD COLUMN IF NOT EXISTS latent_vector_id UUID REFERENCES latent_cognitive_vectors(id) ON DELETE SET NULL;
ALTER TABLE research_assessments ADD COLUMN IF NOT EXISTS features_id UUID REFERENCES cognitive_features(id) ON DELETE SET NULL;
ALTER TABLE research_assessments ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES cognitive_clusters(id) ON DELETE SET NULL;
ALTER TABLE research_assessments ADD COLUMN IF NOT EXISTS raw_response_batch_id UUID REFERENCES raw_response_batches(id) ON DELETE SET NULL;

-- Data Processing Records (Enhanced)
ALTER TABLE data_processing_records ADD COLUMN IF NOT EXISTS processing_type TEXT NOT NULL DEFAULT 'latent_representation';
ALTER TABLE data_processing_records ADD COLUMN IF NOT EXISTS model_versions JSONB; -- Track all model versions used

-- Audit Log (Enhanced)
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS model_version TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS feature_count INTEGER;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS vector_dimension INTEGER;

-- Enhanced RLS Policies for Latent Data

-- Users can only access their own data
CREATE POLICY "Users own raw responses" ON raw_responses
    FOR ALL USING (
        auth.uid() = session_id
    );

CREATE POLICY "Users own cognitive features" ON cognitive_features
    FOR ALL USING (
        auth.uid() = session_id
    );

CREATE POLICY "Users own latent vectors" ON latent_cognitive_vectors
    FOR ALL USING (
        auth.uid() = session_id
    );

CREATE POLICY "Users own clusters" ON cognitive_clusters
    FOR ALL USING (
        auth.uid() = session_id
    );

-- Research access for aggregated data (GDPR compliant)
CREATE POLICY "Research access to aggregated features" ON cognitive_features
    FOR SELECT USING (
        jwt_role() = 'researcher'
    );

CREATE POLICY "Research access to anonymized vectors" ON latent_cognitive_vectors
    FOR SELECT USING (
        jwt_role() = 'researcher' AND
        -- Only access to anonymized data (no session_id link)
        session_id IS NULL
    );

-- Triggers for Automatic Processing

-- Trigger to extract features when sufficient responses are collected
CREATE OR REPLACE FUNCTION extract_cognitive_features()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if session has enough responses for feature extraction
    IF (SELECT COUNT(*) FROM raw_responses WHERE session_id = NEW.session_id) >= 10 THEN
        INSERT INTO cognitive_features (session_id, features, feature_version, extraction_timestamp)
        SELECT 
            NEW.session_id,
            jsonb_build_object(
                'average_response_time', AVG(response_time),
                'response_variance', VARIANCE(response_time),
                'response_count', COUNT(*),
                'extraction_method', 'statistical-v1.0'
            ),
            NOW(),
            0.8,
            jsonb_build_object('auto_extracted', true)
        FROM raw_responses 
        WHERE session_id = NEW.session_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate latent vector when features are extracted
CREATE OR REPLACE FUNCTION generate_latent_vector()
RETURNS TRIGGER AS $$
BEGIN
    -- This would call a Python/ML service in production
    -- For now, create a simple statistical projection
    INSERT INTO latent_cognitive_vectors (session_id, vector, dimension, version, confidence, features_id)
    SELECT 
        NEW.session_id,
        -- Simple statistical projection to 64D
        (
            SELECT ARRAY[
                AVG(selected_answer), -- Mean response
                STDDEV(selected_answer), -- Response variance
                CORR(selected_answer, response_time), -- Correlation with time
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time), -- Median response time
                PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY selected_answer), -- Q1 response
                PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY selected_answer) -- Q3 response
            ]::FLOAT[] || 
            ARRAY_FILL(0, 64 - ARRAY_LENGTH(
                ARRAY[
                    AVG(selected_answer), 
                    STDDEV(selected_answer), 
                    CORR(selected_answer, response_time), 
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time),
                    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY selected_answer),
                    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY selected_answer)
                ]
            ))
        ),
        64,
        'latent-v1.0',
        0.8,
        NEW.id
    FROM raw_responses 
    WHERE session_id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trigger_extract_features
    AFTER INSERT ON raw_responses
    FOR EACH ROW
    EXECUTE FUNCTION extract_cognitive_features();

CREATE TRIGGER trigger_generate_latent
    AFTER INSERT ON cognitive_features
    FOR EACH ROW
    EXECUTE FUNCTION generate_latent_vector();

-- Functions for Clustering and Analysis

-- Function to find similar cognitive vectors
CREATE OR REPLACE FUNCTION find_similar_vectors(
    target_vector VECTOR(64),
    limit_count INTEGER DEFAULT 10,
    similarity_threshold DECIMAL(3,2) DEFAULT 0.7
)
RETURNS TABLE (
    session_id UUID,
    similarity DECIMAL(5,4),
    vector_distance DECIMAL(8,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        session_id,
        1 - (vector <=> target_vector) as similarity,
        (vector <-> target_vector) as vector_distance
    FROM latent_cognitive_vectors
    WHERE 1 - (vector <=> target_vector) > similarity_threshold
    ORDER BY (vector <=> target_vector)
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update clustering results
CREATE OR REPLACE FUNCTION update_cognitive_clustering(
    clustering_method TEXT DEFAULT 'kmeans',
    cluster_count INTEGER DEFAULT 8
)
RETURNS VOID AS $$
BEGIN
    -- This would call a Python ML service in production
    -- For now, create simple k-means based clustering
    -- Implementation would go here
    
    -- Log clustering attempt
    INSERT INTO audit_log (
        table_name, 
        operation, 
        record_id, 
        new_values, 
        change_reason
    ) VALUES (
        'cognitive_clusters',
        'UPDATE',
        (SELECT id FROM sessions WHERE id = ANY(SELECT DISTINCT session_id FROM latent_cognitive_vectors)),
        jsonb_build_object('clustering_method', clustering_method, 'cluster_count', cluster_count),
        'Automated clustering update'
    );
END;
$$ LANGUAGE plpgsql;

-- Views for Research Analysis

-- Rich session view with all cognitive data
CREATE OR REPLACE VIEW rich_cognitive_sessions AS
SELECT 
    s.id,
    s.started_at,
    s.completed_at,
    s.cultural_context,
    s.latent_model_version,
    s.latent_vector_dimension,
    s.feature_extraction_method,
    s.raw_response_count,
    rv.response_count as actual_response_count,
    cf.features,
    lv.vector,
    lv.confidence as vector_confidence,
    lv.version as vector_version,
    cc.cluster_label,
    cc.cluster_confidence,
    s.device_info,
    s.browser_info
FROM sessions s
LEFT JOIN (
    SELECT session_id, COUNT(*) as response_count
    FROM raw_responses 
    GROUP BY session_id
) rv ON s.id = rv.session_id
LEFT JOIN cognitive_features cf ON s.id = cf.session_id
LEFT JOIN latent_cognitive_vectors lv ON s.id = lv.session_id
LEFT JOIN cognitive_clusters cc ON s.id = cc.session_id;

-- Research-ready anonymized view
CREATE OR REPLACE VIEW research_cognitive_data AS
SELECT 
    lv.id,
    lv.vector,
    lv.dimension,
    lv.version,
    lv.confidence,
    cf.features,
    s.cultural_context,
    s.latent_model_version,
    s.feature_extraction_method,
    s.raw_response_count,
    lv.created_at,
    lv.updated_at
FROM latent_cognitive_vectors lv
JOIN cognitive_features cf ON lv.features_id = cf.id
JOIN sessions s ON lv.session_id = s.id
WHERE s.session_identifier LIKE 'anon_%'; -- Only anonymized sessions

-- Performance monitoring view
CREATE OR REPLACE VIEW model_performance_metrics AS
SELECT 
    mv.version,
    mv.type,
    mv.description,
    COUNT(lv.id) as usage_count,
    AVG(lv.confidence) as avg_confidence,
    STDDEV(lv.confidence) as confidence_std,
    mv.created_at,
    mv.deployed_at
FROM model_versions mv
LEFT JOIN latent_cognitive_vectors lv ON lv.version = mv.version
GROUP BY mv.version, mv.type, mv.description, mv.created_at, mv.deployed_at;

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_latent_vectors_cosine ON latent_cognitive_vectors 
USING ivfflat (vector vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_sessions_latent_version ON sessions(latent_model_version);
CREATE INDEX IF NOT EXISTS idx_sessions_feature_method ON sessions(feature_extraction_method);
CREATE INDEX IF NOT EXISTS idx_cognitive_features_extraction ON cognitive_features(extraction_timestamp);

-- Comments for Documentation
COMMENT ON TABLE raw_responses IS 'Stores individual questionnaire responses with rich temporal and behavioral data';
COMMENT ON TABLE cognitive_features IS 'Contains extracted cognitive features from raw responses using statistical and ML methods';
COMMENT ON TABLE latent_cognitive_vectors IS 'High-dimensional cognitive representations ready for ML analysis and clustering';
COMMENT ON TABLE cognitive_clusters IS 'Clustering results for cognitive pattern discovery and similarity analysis';
COMMENT ON TABLE model_versions IS 'Version control for all ML models and feature extraction methods';
COMMENT ON COLUMN latent_cognitive_vectors.vector IS 'High-dimensional vector representation using pgvector extension for similarity search';

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
