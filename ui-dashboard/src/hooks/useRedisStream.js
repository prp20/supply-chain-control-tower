import { useEffect, useRef, useCallback } from 'react';

export const useRedisStream = (onStreamEvent, streamPatterns = []) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false);
  const subscriptionsRef = useRef(new Set());

  const connectWebSocket = useCallback(() => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isConnectingRef.current = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✓ WebSocket connected to Redis stream listener');
      isConnectingRef.current = false;

      // Re-subscribe to previously subscribed streams
      subscriptionsRef.current.forEach((pattern) => {
        wsRef.current.send(JSON.stringify({ action: 'subscribe', stream: pattern }));
      });
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onStreamEvent) {
          onStreamEvent(data);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      isConnectingRef.current = false;
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      isConnectingRef.current = false;

      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };
  }, [onStreamEvent]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  const subscribe = useCallback((pattern) => {
    subscriptionsRef.current.add(pattern);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ action: 'subscribe', stream: pattern });
      console.log(`🔗 Sending subscription: ${pattern}`);
      wsRef.current.send(message);
      console.log(`✓ Subscribed to stream: ${pattern}`);
    } else {
      console.warn(`⚠️ WebSocket not ready (state: ${wsRef.current?.readyState}), queuing subscription: ${pattern}`);
    }
  }, []);

  const unsubscribe = useCallback((pattern) => {
    subscriptionsRef.current.delete(pattern);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'unsubscribe', stream: pattern }));
      console.log(`✓ Unsubscribed from stream: ${pattern}`);
    }
  }, []);

  return { subscribe, unsubscribe, ws: wsRef.current };
};
