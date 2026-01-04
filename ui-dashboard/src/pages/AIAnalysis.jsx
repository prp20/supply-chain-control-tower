import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  FormControlLabel,
  Switch,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp,
  WarningAmber,
  CheckCircle,
  Lightbulb,
  Psychology,
  Send as SendIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import ExecutiveDecisionCenter from '../components/ExecutiveDecisionCenter';
import DecisionTimeline from '../components/DecisionTimeline';
import WhyPanel from '../components/WhyPanel';
import LogisticsImpactPanel from '../components/LogisticsImpactPanel';
import ConfidenceIndicator from '../components/ConfidenceIndicator';
import { useRedisStream } from '../hooks/useRedisStream';
import { generateMockDecision, generateMockExplanation } from '../utils/mockDecisionGenerator';

// eslint-disable-next-line no-unused-vars
const InsightCard = ({ icon: Icon, title, description, severity = 'info' }) => {
  const severityColor = {
    info: '#4facfe',
    warning: '#fa709a',
    success: '#43e97b',
    error: '#ff6b6b',
  };

  return (
    <Card
      sx={{
        mb: 2,
        background: '#F9F9F9',
        border: '1px solid #DEDEDE',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 16px rgba(102, 126, 234, 0.2)',
          transform: 'translateY(-2px)',
          borderColor: severityColor[severity],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
          <Icon
            sx={{
              mt: 1,
              color: severityColor[severity],
              fontSize: 28,
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#000000' }}>
              {title}
            </Typography>
            <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
              {description}
            </Typography>
            <Chip
              label={severity.charAt(0).toUpperCase() + severity.slice(1)}
              size="small"
              sx={{
                backgroundColor: `${severityColor[severity]}20`,
                color: severityColor[severity],
                fontWeight: 600,
                border: `1px solid ${severityColor[severity]}`,
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const AIAnalysis = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [currentDecision, setCurrentDecision] = useState(null);
  const [decisionHistory, setDecisionHistory] = useState([]); // All decisions
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [mockMode, setMockMode] = useState(true);
  const [showWhyPanel, setShowWhyPanel] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [selectedExplanation, setSelectedExplanation] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0 = latest, 1 = timeline

  // Setup WebSocket listener for decision events
  const { subscribe } = useRedisStream(
    (event) => {
      console.log('📨 Received stream event:', event);
      
      if (event.stream === 'decision.events' && event.data) {
        setCurrentDecision(event.data);
        setDecisionHistory((prev) => [event.data, ...prev].slice(0, 50)); // Keep last 50
        setDecisionLoading(false);
      }
      
      if (event.stream === 'decision.explanations' && event.data) {
        setSelectedExplanation(event.data);
        setShowWhyPanel(true);
      }
    },
    [],
    (streamName) => streamName.startsWith('decision.')
  );

  // Subscribe to decision streams on mount
  useEffect(() => {
    subscribe('decision.events');
    subscribe('decision.explanations');
  }, [subscribe]);

  // Simulate incoming decision (demo mode)
  const simulateDecision = () => {
    setDecisionLoading(true);
    setTimeout(() => {
      const mockDecision = generateMockDecision();
      setCurrentDecision(mockDecision);
      setDecisionHistory((prev) => [mockDecision, ...prev].slice(0, 50)); // Keep last 50
      setDecisionLoading(false);
    }, 1500);
  };

  // Get explanation for a decision
  const handleLearnMore = (decision) => {
    setSelectedDecision(decision);
    const explanation = generateMockExplanation(decision.decision_id);
    setSelectedExplanation(explanation);
    setShowWhyPanel(true);
  };

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setAnalysisResults({
        query,
        insights: [
          {
            title: 'Route Optimization',
            description: 'Current routes can be optimized by 15% to reduce delivery time and fuel costs.',
            severity: 'success',
            icon: TrendingUp,
          },
          {
            title: 'Inventory Alert',
            description: '3 items are approaching minimum stock levels. Recommend immediate restocking.',
            severity: 'warning',
            icon: WarningAmber,
          },
          {
            title: 'Fleet Status',
            description:
              'All vehicles are operating normally. Maintenance scheduled for 2 vehicles next week.',
            severity: 'info',
            icon: CheckCircle,
          },
          {
            title: 'Demand Forecast',
            description: 'Predicted 20% increase in demand next month. Recommend pre-positioning inventory.',
            severity: 'info',
            icon: Lightbulb,
          },
        ],
        recommendations: [
          'Increase inventory levels for high-demand items',
          'Schedule route optimization updates',
          'Review vendor performance metrics',
          'Plan maintenance windows for fleet',
          'Analyze customer demand patterns',
        ],
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header Section */}
      <Box sx={{ p: 4, pb: 3, borderBottom: '1px solid', borderColor: '#DEDEDE' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology sx={{ fontSize: 32, color: '#667eea' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              AI-Powered Analysis
            </Typography>
          </Box>
          
          {/* Demo Mode Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={mockMode}
                onChange={(e) => setMockMode(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#667eea',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#667eea',
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600, ml: 1 }}>
                Show AI Reasoning
              </Typography>
            }
          />
        </Box>
        <Typography color="textSecondary" variant="body2">
          Get intelligent insights about your supply chain operations
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 4, display: 'flex', flexDirection: 'column' }}>
        {/* Executive Decision Center - Prominent Position */}
        {mockMode && (
          <Box sx={{ mb: 4 }}>
            <ExecutiveDecisionCenter
              decision={currentDecision}
              onLearnMore={handleLearnMore}
              isLoading={decisionLoading}
            />
            
            {/* Demo Controls */}
            {mockMode && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={simulateDecision}
                  disabled={decisionLoading}
                  sx={{
                    backgroundColor: '#667eea',
                    '&:hover': {
                      backgroundColor: '#5568d3',
                    },
                  }}
                >
                  {decisionLoading ? 'Generating Decision...' : 'Simulate New Decision'}
                </Button>
              </Box>
            )}

            {/* Decision Timeline & History Section */}
            {decisionHistory.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Paper sx={{ borderRadius: 2 }}>
                  {/* Tabs */}
                  <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{
                      borderBottom: '1px solid #DEDEDE',
                      background: '#F9F9F9',
                    }}
                  >
                    <Tab
                      label="Latest Decision"
                      sx={{ fontWeight: 600, color: '#667eea' }}
                    />
                    <Tab
                      icon={<HistoryIcon sx={{ mr: 1 }} />}
                      label={`Decision History (${decisionHistory.length})`}
                      iconPosition="start"
                      sx={{ fontWeight: 600, color: '#667eea' }}
                    />
                  </Tabs>

                  {/* Tab Content */}
                  <Box sx={{ p: 3 }}>
                    {activeTab === 0 ? (
                      // Latest Decision Tab
                      currentDecision ? (
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
                            Most Recent Decision
                          </Typography>
                          <DecisionTimeline
                            decisions={[currentDecision]}
                            onSelectDecision={handleLearnMore}
                            selectedDecisionId={selectedDecision?.decision_id}
                          />

                          {/* Confidence Indicator - Ring Variant */}
                          <Box sx={{ mt: 3, mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#333' }}>
                              Decision Confidence
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <Box sx={{ flex: '0 0 auto' }}>
                                <ConfidenceIndicator
                                  confidence={currentDecision.confidence}
                                  variant="ring"
                                  size="medium"
                                />
                              </Box>
                              <Box sx={{ flex: '1 1 300px' }}>
                                <ConfidenceIndicator
                                  confidence={currentDecision.confidence}
                                  variant="detailed"
                                  size="medium"
                                />
                              </Box>
                            </Box>
                          </Box>

                          {/* Logistics Impact Panel */}
                          <Box sx={{ mt: 3 }}>
                            <LogisticsImpactPanel
                              decision={currentDecision}
                              onDrillDown={(metric) => {
                                console.log('Drilling down into metric:', metric);
                              }}
                            />
                          </Box>
                        </Box>
                      ) : (
                        <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                          No decisions yet. Generate one to get started!
                        </Typography>
                      )
                    ) : (
                      // Timeline Tab
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#667eea' }}>
                          All Decisions
                        </Typography>
                        <DecisionTimeline
                          decisions={decisionHistory}
                          onSelectDecision={handleLearnMore}
                          selectedDecisionId={selectedDecision?.decision_id}
                        />
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        )}

        <Grid container spacing={4} sx={{ height: 'fit-content' }}>
          {/* Query Section - Left Sidebar */}
          <Grid item xs={12} lg={5} xl={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Query Input Panel */}
              <Paper
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
                  Ask AI Assistant
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  placeholder="Ask a question about your supply chain..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      color: '#333',
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      opacity: 0.7,
                    },
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAnalyze}
                  disabled={!query.trim() || loading}
                  endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  sx={{
                    backgroundColor: 'white',
                    color: '#667eea',
                    fontWeight: 700,
                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      color: 'rgba(102,126,234,0.5)',
                    },
                  }}
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </Button>
              </Paper>

              {/* Quick Queries */}
              <Paper sx={{ p: 3, background: '#F9F9F9', border: '1px solid #DEDEDE' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#667eea' }}>
                  💡 Quick Queries
                </Typography>
                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  onClick={() => {
                    setQuery('What routes need optimization?');
                    setTimeout(() => handleAnalyze(), 100);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    mb: 1,
                    color: '#667eea',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
                  }}
                >
                  → What routes need optimization?
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  onClick={() => {
                    setQuery('Which items are low in stock?');
                    setTimeout(() => handleAnalyze(), 100);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    mb: 1,
                    color: '#667eea',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
                  }}
                >
                  → Which items are low in stock?
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  onClick={() => {
                    setQuery('What is the fleet status?');
                    setTimeout(() => handleAnalyze(), 100);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    color: '#667eea',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
                  }}
                >
                  → What is the fleet status?
                </Button>
              </Paper>
            </Box>
          </Grid>

          {/* Results Section - Right Main Area */}
          <Grid item xs={12} lg={7} xl={8}>
            {!analysisResults ? (
              <Paper
                sx={{
                  p: 5,
                  textAlign: 'center',
                  background: '#F9F9F9',
                  border: '2px dashed #DEDEDE',
                  borderRadius: 2,
                  minHeight: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box>
                  <Lightbulb
                    sx={{
                      fontSize: 80,
                      color: '#667eea',
                      opacity: 0.2,
                      mb: 2,
                    }}
                  />
                  <Typography color="textSecondary" sx={{ fontSize: '1.1rem' }}>
                    Ask a question to get AI-powered insights
                  </Typography>
                </Box>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Alert
                  severity="info"
                  sx={{
                    backgroundColor: '#667eea20',
                    borderColor: '#667eea',
                    color: '#667eea',
                    fontWeight: 600,
                  }}
                >
                  Analysis for: <strong>"{analysisResults.query}"</strong>
                </Alert>

                <Box>
                  <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, color: '#667eea' }}>
                    📊 Key Insights
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {analysisResults.insights.map((insight, idx) => (
                      <InsightCard
                        key={idx}
                        icon={insight.icon}
                        title={insight.title}
                        description={insight.description}
                        severity={insight.severity}
                      />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, color: '#667eea' }}>
                    ✅ Recommendations
                  </Typography>
                  <Paper sx={{ background: '#F9F9F9', border: '1px solid #DEDEDE' }}>
                    <CardContent>
                      <List sx={{ p: 0 }}>
                        {analysisResults.recommendations.map((rec, idx) => (
                          <ListItem key={idx} sx={{ py: 1.5, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircle sx={{ color: '#43e97b', fontSize: 20 }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={rec}
                              primaryTypographyProps={{ fontWeight: 500, color: '#000000' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Paper>
                </Box>

                {/* Confidence Indicators Showcase */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, color: '#667eea' }}>
                    🎯 Confidence Metrics
                  </Typography>
                  <Paper sx={{ background: '#F9F9F9', border: '1px solid #DEDEDE', p: 2.5 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1, color: '#667eea' }}>
                            Linear Progress Variant
                          </Typography>
                          <ConfidenceIndicator
                            confidence={0.88}
                            variant="linear"
                            size="medium"
                            showLabel
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1, color: '#667eea' }}>
                            Circular Progress Variant
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <ConfidenceIndicator
                              confidence={0.88}
                              variant="circular"
                              size="large"
                            />
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1, color: '#667eea' }}>
                            Badge/Chip Variant
                          </Typography>
                          <ConfidenceIndicator
                            confidence={0.88}
                            variant="badge"
                            size="medium"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1, color: '#667eea' }}>
                            Ring Variant
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <ConfidenceIndicator
                              confidence={0.88}
                              variant="ring"
                              size="medium"
                            />
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1, color: '#667eea' }}>
                          Detailed Card Variant
                        </Typography>
                        <ConfidenceIndicator
                          confidence={0.88}
                          variant="detailed"
                          size="medium"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    color: '#667eea',
                    borderColor: '#667eea',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      borderColor: '#764ba2',
                    },
                    mt: 2,
                  }}
                  onClick={() => {
                    setAnalysisResults(null);
                    setQuery('');
                  }}
                >
                  New Analysis
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Why Panel - Enhanced Explanation Modal */}
      <WhyPanel
        decision={selectedDecision}
        explanation={selectedExplanation}
        isOpen={showWhyPanel}
        onClose={() => setShowWhyPanel(false)}
      />
    </Box>
  );
};

export default AIAnalysis;
