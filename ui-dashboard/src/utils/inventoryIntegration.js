// Phase 2 Integration Guide: Adding Decision Overlays to Inventory Page
// This file shows how to integrate InventoryDecisionBadge into the existing Inventory component

/**
 * STEP 1: Import the new components in your Inventory.jsx page
 * 
 * import InventoryDecisionBadge from '../components/InventoryDecisionBadge';
 * import { useRedisStream } from '../hooks/useRedisStream';
 */

/**
 * STEP 2: Add state for decisions in your Inventory component
 * 
 * const [decisions, setDecisions] = useState([]);
 * 
 * // Setup WebSocket listener
 * const { subscribe } = useRedisStream(
 *   (event) => {
 *     if (event.stream === 'decision.events') {
 *       setDecisions(prev => [event.data, ...prev].slice(0, 50));
 *     }
 *   },
 *   [],
 *   (streamName) => streamName === 'decision.events'
 * );
 * 
 * useEffect(() => {
 *   subscribe('decision.events');
 * }, [subscribe]);
 */

/**
 * STEP 3: Add InventoryDecisionBadge to each inventory item in your list/table
 * 
 * Example for table cell:
 * <TableCell>
 *   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
 *     <Typography>{item.part_id}</Typography>
 *     <InventoryDecisionBadge
 *       partId={item.part_id}
 *       decisions={decisions}
 *       onBadgeClick={(decision) => {
 *         // Handle badge click - could open decision details modal
 *         console.log('Clicked decision:', decision);
 *       }}
 *       inventoryItem={item}
 *     />
 *   </Box>
 * </TableCell>
 * 
 * Example for list item:
 * <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 *   <Box>
 *     <Typography>{item.name}</Typography>
 *     <Typography variant="body2" color="textSecondary">
 *       SKU: {item.sku}
 *     </Typography>
 *   </Box>
 *   <InventoryDecisionBadge
 *     partId={item.sku}
 *     decisions={decisions}
 *     onBadgeClick={(decision) => {
 *       // Navigate to decision detail or show modal
 *     }}
 *   />
 * </Box>
 */

/**
 * Badge Status Mapping:
 * 
 * - REPLENISH NOW: HIGH priority + replenishment type = most urgent
 * - CRITICAL: HIGH priority but other types
 * - REPLENISH: HIGH or MEDIUM priority with replenishment type
 * - MONITOR: Alert type or other monitoring decisions
 * - AFFECTED: Generic affected status
 */

/**
 * STEP 4 (Optional): Highlight affected rows in table/list
 * 
 * const hasAffectingDecision = (partId) => {
 *   return decisions.some(d => {
 *     const actionUpper = d.action?.toUpperCase() || '';
 *     const explanationUpper = d.explanation?.toUpperCase() || '';
 *     return actionUpper.includes(partId.toUpperCase()) || 
 *            explanationUpper.includes(partId.toUpperCase());
 *   });
 * };
 * 
 * Then in your row styling:
 * <TableRow
 *   sx={{
 *     backgroundColor: hasAffectingDecision(item.part_id) 
 *       ? 'rgba(255, 107, 107, 0.1)' 
 *       : 'transparent',
 *     transition: 'background-color 0.3s ease',
 *   }}
 * >
 */

/**
 * COMPLETE EXAMPLE: Modified Inventory Item Component
 */
export const InventoryItemWithDecisions = ({ item, decisions, onSelectDecision }) => {
  const React = require('react');
  const { Box, Card, CardContent, Typography } = require('@mui/material');
  const InventoryDecisionBadge = require('../components/InventoryDecisionBadge').default;

  // Check if any decisions affect this item
  const affectingDecisions = React.useMemo(() => {
    return decisions.filter(d => {
      const partPattern = item.sku.toUpperCase();
      const actionUpper = d.action?.toUpperCase() || '';
      const explanationUpper = d.explanation?.toUpperCase() || '';
      return actionUpper.includes(partPattern) || explanationUpper.includes(partPattern);
    });
  }, [item.sku, decisions]);

  const hasDecisions = affectingDecisions.length > 0;

  return (
    <Card
      sx={{
        mb: 2,
        backgroundColor: hasDecisions ? 'rgba(255, 107, 107, 0.08)' : '#fff',
        borderLeft: hasDecisions ? '4px solid #ff6b6b' : '4px solid #eee',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          {/* Item Details */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {item.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              SKU: {item.sku}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2">
                Stock: <strong>{item.quantity}</strong>
              </Typography>
              <Typography variant="body2">
                Reorder: <strong>{item.reorder_level}</strong>
              </Typography>
            </Box>
          </Box>

          {/* Decision Badge */}
          <Box>
            <InventoryDecisionBadge
              partId={item.sku}
              decisions={decisions}
              onBadgeClick={(decision) => {
                if (onSelectDecision) {
                  onSelectDecision(decision);
                }
              }}
              inventoryItem={item}
            />
          </Box>
        </Box>

        {/* Show decision details if hovering/expanded */}
        {hasDecisions && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#ff6b6b', display: 'block', mb: 1 }}>
              Affecting Decisions ({affectingDecisions.length}):
            </Typography>
            {affectingDecisions.map((d, idx) => (
              <Typography
                key={idx}
                variant="caption"
                sx={{
                  display: 'block',
                  color: '#666',
                  mb: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    color: '#667eea',
                    textDecoration: 'underline',
                  },
                }}
                onClick={() => onSelectDecision && onSelectDecision(d)}
              >
                • {d.action}
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * USAGE IN YOUR INVENTORY PAGE:
 * 
 * import { InventoryItemWithDecisions } from '../utils/inventoryIntegration';
 * 
 * // In your inventory list component:
 * {inventoryItems.map((item) => (
 *   <InventoryItemWithDecisions
 *     key={item.id}
 *     item={item}
 *     decisions={decisions}
 *     onSelectDecision={(decision) => {
 *       // Open decision modal or navigate to details
 *       console.log('Selected decision:', decision);
 *     }}
 *   />
 * ))}
 */

export default null; // This is a guide file, not a component
