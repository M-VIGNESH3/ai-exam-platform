# OmniProctor Container Orchestration

This directory contains container deployment guidelines.

## Quick Start

From the workspace root, spin up the entire cluster using:

```bash
docker-compose up --build -d
```

## Services Map

- **Frontend React Portal**: [http://localhost](http://localhost) (mapped on Nginx reverse proxy)
- **Express Core Backend**: [http://localhost:5000](http://localhost:5000)
- **Standalone WebSocket Gateway**: ws://localhost:6001/ws
- **Independent AI Proxy**: http://localhost:7000
- **MongoDB Instance**: localhost:27017
- **Redis Cache Instance**: localhost:6379
