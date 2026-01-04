version: '3.8'

services:
  ui-dashboard:
    build:
      context: ./ui-dashboard
      dockerfile: Dockerfile
    container_name: supply-chain-ui
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://api-gateway:8000
    depends_on:
      - api-gateway
    volumes:
      - ./ui-dashboard/src:/app/src
    networks:
      - supply-chain-network
    command: npm run dev

  # Make sure api-gateway is defined in your docker-compose.yml
