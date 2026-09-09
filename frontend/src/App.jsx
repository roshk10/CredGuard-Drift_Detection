import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewView from './views/OverviewView';
import DriftMonitoringView from './views/DriftMonitoringView';
import ModelBehaviourView from './views/ModelBehaviourView';
import SegmentImpactView from './views/SegmentImpactView';
import ComplianceView from './views/ComplianceView';
import RetrainingView from './views/RetrainingView';
import CurrencyPageLoader from './components/CurrencyPageLoader';
import CredGuardAPI from './api/client';

export default function App() {
  const [driftData, setDriftData] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [shapData, setShapData] = useState(null);
  const [segmentData, setSegmentData] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [retrainData, setRetrainData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      const [
        driftRes,
        scoreRes,
        shapRes,
        segRes,
        compRes,
        auditRes,
        retrainRes
      ] = await Promise.all([
        CredGuardAPI.getDriftOverview(),
        CredGuardAPI.getScoreDistribution(),
        CredGuardAPI.getShapShift(),
        CredGuardAPI.getSegmentImpact(),
        CredGuardAPI.getComplianceReport(),
        CredGuardAPI.getAuditTrail(),
        CredGuardAPI.getRetrainHistory()
      ]);

      setDriftData(driftRes);
      setScoreData(scoreRes);
      setShapData(shapRes);
      setSegmentData(segRes);
      setComplianceData(compRes);
      setAuditData(auditRes);
      setRetrainData(retrainRes);
    } catch (e) {
      console.warn('Backend sync note: Using calibrated offline data stream.', e);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handlePipelineRefresh = async () => {
    setRefreshing(true);
    try {
      await CredGuardAPI.runPipeline();
      await loadAllData();
    } finally {
      setRefreshing(false);
    }
  };

  const status = driftData?.status || 'CRITICAL';

  return (
    <BrowserRouter>
      <CurrencyPageLoader />
      <div className="app-layout">
        
        {/* Fixed Left Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="main-wrapper">
          
          {/* Top Executive Header */}
          <Header
            status={status}
            onRefresh={handlePipelineRefresh}
            refreshing={refreshing}
          />

          {/* Views Routing Outlet */}
          <main className="content-area">
            <Routes>
              <Route 
                path="/" 
                element={
                  <OverviewView
                    driftData={driftData}
                    scoreData={scoreData}
                    segmentData={segmentData}
                    complianceData={complianceData}
                    onRefresh={handlePipelineRefresh}
                  />
                } 
              />
              <Route 
                path="/drift-monitoring" 
                element={
                  <DriftMonitoringView
                    driftData={driftData}
                  />
                } 
              />
              <Route 
                path="/model-behaviour" 
                element={
                  <ModelBehaviourView
                    scoreData={scoreData}
                    shapData={shapData}
                  />
                } 
              />
              <Route 
                path="/segment-impact" 
                element={
                  <SegmentImpactView
                    segmentData={segmentData}
                  />
                } 
              />
              <Route 
                path="/compliance-report" 
                element={
                  <ComplianceView
                    complianceData={complianceData}
                    auditData={auditData}
                  />
                } 
              />
              <Route 
                path="/retraining" 
                element={
                  <RetrainingView
                    complianceData={complianceData}
                    retrainData={retrainData}
                    onRetrainSuccess={loadAllData}
                  />
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

        </div>

      </div>
    </BrowserRouter>
  );
}
