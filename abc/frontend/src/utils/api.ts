import axios from 'axios';
import { AnalysisResult, IncidentReport, DashboardStats, ModelMetricsReport } from '../types/models';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const analyzeMessage = async (payload: { message?: string; url?: string; language?: string }): Promise<AnalysisResult> => {
  const res = await api.post('/analyze', payload);
  return res.data;
};

export const getAnalyses = async (limit = 50): Promise<AnalysisResult[]> => {
  const res = await api.get(`/analyses?limit=${limit}`);
  return res.data;
};

export const getAnalysisById = async (id: number): Promise<AnalysisResult> => {
  const res = await api.get(`/analyses/${id}`);
  return res.data;
};

export const createReport = async (analysisId: number, consentGiven = true): Promise<IncidentReport> => {
  const res = await api.post('/reports', { analysis_id: analysisId, consent_given: consentGiven });
  return res.data;
};

export const getReports = async (): Promise<IncidentReport[]> => {
  const res = await api.get('/reports');
  return res.data;
};

export const getReportById = async (id: number): Promise<IncidentReport> => {
  const res = await api.get(`/reports/${id}`);
  return res.data;
};

export const submitReportToAuthorities = async (reportId: number) => {
  const res = await api.post(`/reports/${reportId}/submit`);
  return res.data;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get('/stats');
  return res.data;
};

export const getModelMetrics = async (): Promise<ModelMetricsReport> => {
  const res = await api.get('/model/metrics');
  return res.data;
};

export const recordConsent = async (eventType: string, details: Record<string, any> = {}) => {
  const res = await api.post('/consent', { event_type: eventType, details });
  return res.data;
};

export const exportUserData = async () => {
  const res = await api.get('/privacy/export');
  return res.data;
};

export const deleteUserData = async () => {
  const res = await api.delete('/privacy/data');
  return res.data;
};

export const uploadOcrScreenshot = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
