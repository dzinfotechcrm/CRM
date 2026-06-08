# DZ Infotech Internal CRM

Internal web application for managing clients, projects, subscriptions, payments, finances, and goals.

## Tech Stack

- **Frontend:** React.js + Tailwind CSS + Recharts
- **Backend:** Node.js + Express.js (REST API)
- **Database:** PostgreSQL
- **Auth:** JWT (username/password)

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+

### Installation

```bash
# Install all dependencies (root + server + client)
npm run install:all
```

### Database Setup

1. Update `server/.env` with your PostgreSQL credentials
2. Run the migration:

```bash
npm run migrate
```

This will:
- Create the `dz_crm` database
- Create all 8 tables with constraints
- Seed 20 settings keys (values set via UI)
- Create 2 founder accounts

### Development

```bash
# Run both frontend and backend
npm run dev

# Run server only
npm run server

# Run client only
npm run client
```

### Default Login

| Username | Password |
|----------|----------|
| founder1 | founder@123 |
| founder2 | founder@123 |

> ⚠️ Change passwords directly in the database after first login.

## Project Structure

```
CRM/
├── client/          # React frontend (Vite)
├── server/          # Express backend
│   ├── src/         # Application code
│   └── db/          # Schema, seeds, migrations
├── package.json     # Root with concurrently scripts
└── README.md
```
