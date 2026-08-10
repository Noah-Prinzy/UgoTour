# UgoTour Architecture

## Frontend
HTML + CSS + Tailwind CSS for interface/design.
Vanilla JavaScript owns functionality and interactions.

## Backend
JavaScript executed by Node.js.
REST API architecture.

## Database access
`pg` / node-postgres will be used as the PostgreSQL driver.
This is not Prisma and is not an ORM.

## Database
PostgreSQL with SQL queries and migration files.

## Data flow
Browser UI -> JavaScript -> HTTP/REST -> Node.js JavaScript backend -> pg -> SQL -> PostgreSQL
