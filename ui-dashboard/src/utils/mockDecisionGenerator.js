// Mock decision data generator for demo/testing
// Simulates decision.events and decision.explanations streams

export const generateMockDecision = () => {
  const decisionTypes = ['replenishment', 'reroute', 'alert', 'optimization'];
  const priorities = ['HIGH', 'MEDIUM', 'LOW'];
  const actionTemplates = {
    replenishment: [
      'Replenish SKU-123 immediately',
      'Increase inventory for Part A-456',
      'Emergency restocking required for Warehouse 2',
      'Accelerate delivery of Critical Component X',
    ],
    reroute: [
      'Reroute Trip-5 via alternate highway',
      'Redirect vehicle VEH-001 to Distribution Center B',
      'Optimize delivery sequence for Route 7',
      'Adjust trip priority for maximum efficiency',
    ],
    alert: [
      'Monitor supply chain risk elevation',
      'Activate backup supplier contingency',
      'Escalate inventory shortage alert',
      'Review vehicle maintenance schedule',
    ],
    optimization: [
      'Consolidate shipments for better efficiency',
      'Reduce delivery window by 2 hours',
      'Optimize warehouse packing sequence',
      'Improve vehicle fuel efficiency',
    ],
  };

  const explanationTemplates = {
    replenishment: (action) =>
      `${action} due to inventory levels dropping below reorder threshold combined with increased demand forecast and supplier capacity constraints.`,
    reroute: (action) =>
      `${action} to avoid traffic congestion and reduce estimated delivery time by 45 minutes. Current route shows 40% probability of delays due to weather conditions.`,
    alert: (action) =>
      `${action}. Risk assessment indicates elevated supply chain vulnerability. Recommend activating backup suppliers and increasing safety stock.`,
    optimization: (action) =>
      `${action} to improve operational efficiency and reduce costs by approximately 12%. Analysis shows consolidation opportunity affecting 3 nearby deliveries.`,
  };

  const dataSources = [
    'inventory_agent + risk_agent',
    'route_planner + traffic_feed',
    'supplier_capacity + demand_forecast',
    'vehicle_gps + weather_integration',
    'inventory_health + route_optimizer',
  ];

  const type = decisionTypes[Math.floor(Math.random() * decisionTypes.length)];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];
  const action = actionTemplates[type][Math.floor(Math.random() * actionTemplates[type].length)];
  const explanation = explanationTemplates[type](action);
  const confidence = 0.75 + Math.random() * 0.25; // 0.75 - 1.0
  const dataSource = dataSources[Math.floor(Math.random() * dataSources.length)];

  const now = new Date();
  const decisionId = `exec-${now.toISOString().split('T')[0]}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

  return {
    decision_id: decisionId,
    type,
    priority,
    action,
    explanation,
    confidence,
    timestamp: now.toISOString(),
    data_source: dataSource,
  };
};

export const generateMockExplanation = (decisionId) => {
  const contributingSignals = [
    ['inventory_drop_rate: 0.08 units/hour', 'demand_surge: +25% vs baseline', 'supplier_capacity: 85% utilized'],
    ['traffic_congestion: +35% on Route 7', 'weather_alert: rain probability 60%', 'vehicle_fuel_level: 40%'],
    ['supply_chain_risk: ELEVATED', 'backup_supplier_status: AVAILABLE', 'lead_time: 48 hours'],
    ['vehicle_maintenance: DUE in 500 miles', 'delivery_consolidation: 3 nearby orders', 'fuel_cost_impact: $240 savings potential'],
    ['news_feed: port_disruption_alert', 'weather_forecast: storm system moving in', 'inventory_trend: downward trajectory'],
  ];

  const selectedSignals = contributingSignals[Math.floor(Math.random() * contributingSignals.length)];

  return {
    decision_id: decisionId,
    explanation_text: `This decision was generated based on real-time analysis of multiple contributing factors. The system evaluated current inventory levels, demand forecasts, supplier capacity, and external factors to determine the optimal course of action.

Key factors influencing this decision:
- ${selectedSignals[0]}
- ${selectedSignals[1]}
- ${selectedSignals[2]}

The confidence score of ${(Math.random() * 0.25 + 0.75).toFixed(2)} reflects high certainty in this recommendation based on historical accuracy and data reliability.`,
    contributing_signals: selectedSignals,
    confidence: Math.random() * 0.25 + 0.75,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Mock WebSocket message for decision.events stream
 * Use this in tests or demo mode to simulate real stream data
 */
export const createMockDecisionEventMessage = () => {
  return {
    stream: 'decision.events',
    data: generateMockDecision(),
  };
};

/**
 * Mock WebSocket message for decision.explanations stream
 * Use this in tests or demo mode to simulate real stream data
 */
export const createMockExplanationEventMessage = (decisionId) => {
  return {
    stream: 'decision.explanations',
    data: generateMockExplanation(decisionId),
  };
};

/**
 * Decision data shape for reference:
 *
 * Decision Event:
 * {
 *   decision_id: string (e.g., "exec-2025-01-04-0001")
 *   type: "replenishment" | "reroute" | "alert" | "optimization"
 *   priority: "HIGH" | "MEDIUM" | "LOW"
 *   action: string (user-readable action description)
 *   explanation: string (why this action was chosen)
 *   confidence: number (0.0 - 1.0)
 *   timestamp: string (ISO 8601 datetime)
 *   data_source: string (e.g., "inventory_agent + risk_agent")
 * }
 *
 * Explanation Event:
 * {
 *   decision_id: string (matches decision event)
 *   explanation_text: string (detailed reasoning)
 *   contributing_signals: string[] (list of factors considered)
 *   confidence: number (0.0 - 1.0)
 *   timestamp: string (ISO 8601 datetime)
 * }
 */
