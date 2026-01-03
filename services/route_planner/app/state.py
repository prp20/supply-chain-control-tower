from collections import deque

# Keep last N events only (prevents memory leak)
MAX_EVENTS = 50

traffic_events = deque(maxlen=MAX_EVENTS)
news_events = deque(maxlen=MAX_EVENTS)
