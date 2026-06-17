# ReturnAppProj

An end-to-end **return management automation system** where customers submit return requests via a web form, an AI model decides approval or rejection, and Azure Maps automatically assigns the nearest factory for collection.

## Architecture

```
Customer (React form)
    ↓
Node.js / Express API
    ↓
Azure Service Bus  ──→  Azure Functions (serverless processing)
                              ↓
                        AI approval/rejection decision
                              ↓
                        Azure Maps (nearest-factory lookup)
                              ↓
                        UiPath (RPA automation)
                              ↓
                        Azure Table Storage (persistent record)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, HTML/CSS |
| Backend API | Node.js, Express |
| Serverless | Azure Functions |
| Messaging | Azure Service Bus |
| Mapping | Azure Maps |
| Automation | UiPath (RPA) |
| Storage | Azure Table Storage |
| Agent | Python (`courier-agent`) |

## Project Structure

```
ReturnAppProj/
├── CustomerReturnRequest/   # React frontend — return submission form
├── ReturnAppProj/           # Node.js/Express backend + Azure Functions
└── courier-agent/           # Python agent handling courier assignment logic
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Azure subscription (Functions, Service Bus, Maps, Table Storage)
- UiPath Studio

### Environment Variables

Copy `.env.example` and fill in your own values — **never commit real keys**:

```bash
cp .env.example .env
```

```
AZURE_MAPS_KEY=
AZURE_SERVICE_BUS_CONNECTION_STRING=
AZURE_STORAGE_CONNECTION_STRING=
AZURE_FUNCTIONS_URL=
```

### Run locally

```bash
# Backend
cd ReturnAppProj
npm install
npm start

# Frontend
cd CustomerReturnRequest
npm install
npm start

# Courier agent
cd courier-agent
pip install -r requirements.txt
python agent.py
```

## What I Learned

Building this taught me how to wire together cloud messaging (Service Bus), serverless compute (Azure Functions), and RPA (UiPath) into a single coherent flow — and how to keep secrets out of source control using environment variables.

---

> **Note:** `customer_data.csv` and `return_orders.xlsx` contain **dummy/sample data only** — no real personal data is stored in this repository.
