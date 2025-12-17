# Approach 5: Ambient Agent (Background Loop)

## Overview
An **Ambient Agent** is an AI that operates continuously in the background, monitoring streams of data (emails, logs, news, stock prices) and "waking up" only when specific criteria are met. 

It proactively interrupts the user, rather than waiting for the user to ask a question.

## LangGraph Concepts Used
1.  **Cyclic Graph**: The graph has no "End" (conceptually). It loops from `Start` -> `Check` -> `Sleep` -> `Start`.
2.  **State Persistence**: It needs to remember "What did I see last time?" so it doesn't alert you about the same email twice.
3.  **Autonomous Decision Making**: It uses the LLM to filter noise. It only alerts if the LLM judges the content as `URGENT`.

## The Scenario
The agent monitors a (simulated) news feed.
- It stays silent for boring news.
- It interrupts you when "Critical Market News" appears.

## Setup
1. Create a `.env` file with `ANTHROPIC_API_KEY=sk-ant-...`
2. Run `npm install`
3. Run `npm start`

## Running Modes

### Demo Mode (Default)
Runs through the mock data once and stops:
```bash
npm start
```

### Continuous Mode
Runs forever, cycling through mock data (or replace with real data source):
```bash
npm run start:continuous
```

### Fast Polling (2 second intervals)
```bash
npm run start:fast
```

### Production Mode (30 second intervals, continuous)
```bash
npm run start:production
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | - | Your Anthropic API key (required) |
| `POLL_INTERVAL_MS` | `5000` | Milliseconds between feed checks |
| `DEMO_MODE` | `true` | Set to `false` for infinite loop |

## Running Constantly in Production

### Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start the agent
pm2 start index.js --name "ambient-agent" -- 

# Or with environment variables
DEMO_MODE=false POLL_INTERVAL_MS=30000 pm2 start index.js --name "ambient-agent"

# Auto-restart on system reboot
pm2 startup
pm2 save

# Monitor
pm2 logs ambient-agent
pm2 monit
```

### Using Docker
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV DEMO_MODE=false
ENV POLL_INTERVAL_MS=30000
CMD ["node", "index.js"]
```

```bash
docker build -t ambient-agent .
docker run -d --restart=always --env-file .env ambient-agent
```

### Using systemd (Linux)
```ini
# /etc/systemd/system/ambient-agent.service
[Unit]
Description=Ambient Agent
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/05-langgraph-ambient
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=DEMO_MODE=false
Environment=POLL_INTERVAL_MS=30000

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ambient-agent
sudo systemctl start ambient-agent
```

## Graceful Shutdown
The agent handles `SIGINT` (Ctrl+C) and `SIGTERM` gracefully, completing the current check before exiting.
