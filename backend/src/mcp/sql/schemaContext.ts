/**
 * Compact schema summary for NL→SQL generation (PostgreSQL / Prisma).
 * Table names match Prisma defaults (quoted identifiers in SQL).
 */
export const POS_SCHEMA_FOR_LLM = `
PostgreSQL schema (public):

"Employee" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,  -- enum: CASHIER | MANAGER | ADMIN
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
)

"Shift" (
  id SERIAL PRIMARY KEY,
  "employeeId" INT NOT NULL REFERENCES "Employee"(id),
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP NULL
)

"Sale" (
  id SERIAL PRIMARY KEY,
  "employeeId" INT NULL REFERENCES "Employee"(id),
  "shiftId" INT NULL REFERENCES "Shift"(id),
  "paymentType" TEXT NOT NULL,  -- CASH | CARD | MOBILE
  "totalAmount" NUMERIC(12,2) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
)

"Product" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  price NUMERIC(10,2) NOT NULL,
  stock INT NOT NULL,
  "categoryId" INT NOT NULL REFERENCES "ProductCategory"(id),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
)

"ProductCategory" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
)

"SaleItem" (
  id SERIAL PRIMARY KEY,
  "saleId" INT NOT NULL REFERENCES "Sale"(id),
  "productId" INT NOT NULL REFERENCES "Product"(id),
  quantity INT NOT NULL,
  "unitPrice" NUMERIC(10,2) NOT NULL,
  "lineTotal" NUMERIC(12,2) NOT NULL
)

Rules for SQL:
- Use double-quoted identifiers exactly as above (PostgreSQL case-sensitive).
- Dates: compare "Sale"."createdAt" with timestamp ranges or ::date casts as needed.
`.trim();
