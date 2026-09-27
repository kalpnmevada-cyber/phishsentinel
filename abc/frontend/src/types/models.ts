export interface IndicatorItem {
  id: string;
  signal_source: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  score_delta: number;
}

export interface SignalDetail {
  signal_name: string;
  fired: boolean;
  score_impact: number;
  confidence: number;
  summary: string;
  technical_details: Record<string, any>;
}

export interface MultilingualExplanation {
  en: {
    summary: string;
    reasons: string[];
    recommended_action: string;
    category_label: string;
    risk_label: string;
  };
  hi: {
    summary: string;
    reasons: string[];
    recommended_action: string;
    category_label: string;
    risk_label: string;
  };
  gu: {
    summary: string;
    reasons: string[];
    recommended_action: string;
    category_label: string;
    risk_label: string;
  };
}

export interface AnalysisResult {
  id: number;
  message: string;
  extracted_urls: string[];
  brand_claimed: string;
  category: string;
  risk_score: number;
  risk_level: 'LOW' | 'SUSPICIOUS' | 'HIGH RISK';
  summary: string;
  plain_reasons: string[];
  recommended_action: string;
  ml_probability: number;
  ml_model_version: string;
  indicators: IndicatorItem[];
  signals: {
    rule_engine: SignalDetail;
    url_analyzer: SignalDetail;
    ml_classifier: SignalDetail;
    llm_layer: SignalDetail;
  };
  multilingual?: MultilingualExplanation;
  created_at: string;
}

export interface IncidentReport {
  id: number;
  analysis_id: number;
  report_code: string;
  message: string;
  url?: string;
  category: string;
  risk_level: 'LOW' | 'SUSPICIOUS' | 'HIGH RISK';
  risk_score: number;
  brand_claimed?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'RESOLVED';
  submitted_at?: string;
  submission_adapter?: string;
  ack_id?: string;
  created_at: string;
}

export interface DashboardStats {
  total_analyses: number;
  high_risk_count: number;
  suspicious_count: number;
  low_risk_count: number;
  reports_submitted: number;
  suspicious_urls_found: number;
  risk_distribution: {
    'HIGH RISK': number;
    SUSPICIOUS: number;
    LOW: number;
  };
  category_distribution: Record<string, number>;
  top_brands: Array<{ brand: string; count: number }>;
  recent_activity: Array<{
    id: number;
    category: string;
    risk_score: number;
    risk_level: string;
    brand: string;
    created_at: string;
  }>;
  timeline: Array<{
    date: string;
    detections: number;
    avg_risk: number;
  }>;
}

export interface ModelMetricsReport {
  model_name: string;
  model_version: string;
  trained_at: string;
  dataset_file: string;
  dataset_hash: string;
  total_raw_rows: number;
  total_unique_rows: number;
  train_rows: number;
  val_rows: number;
  test_rows: number;
  candidates_comparison: Record<
    string,
    {
      accuracy: number;
      spam_precision: number;
      spam_recall: number;
      spam_f1: number;
    }
  >;
  overall_test_metrics: {
    accuracy: number;
    ham: { precision: number; recall: number; f1: number; support: number };
    spam: { precision: number; recall: number; f1: number; support: number };
    confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
  };
  financial_scams_subset_metrics: {
    test_split_subset_count: number;
    total_financial_scams_count: number;
    accuracy: number;
    ham: { precision: number; recall: number; f1: number; support: number };
    spam: { precision: number; recall: number; f1: number; support: number };
    confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
  };
  source_breakdown_test: Record<string, { count: number; accuracy: number }>;
}