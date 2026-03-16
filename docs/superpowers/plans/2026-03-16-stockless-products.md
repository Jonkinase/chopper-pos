# Stockless Products Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the functionality for products that do not require stock tracking (stockless products). These products can have 0 stock, won't trigger low stock alerts, won't record inventory movements on sales, and won't interfere with inventory metrics.

**Architecture:** Add a `requires_stock` flag to the `products` table. Update backend services (Products, Sales, Metrics) to respect this flag. Update frontend product form to allow toggling this feature.

**Tech Stack:** Node.js (Express), PostgreSQL, React (Vite, Tailwind).

---

### Task 1: Database Migration

**Files:**
- Create: `backend/src/database/migrations/add_requires_stock_to_products.sql`

- [ ] **Step 1: Create the migration script**
Add `requires_stock` BOOLEAN to `products` table.

```sql
ALTER TABLE products ADD COLUMN requires_stock BOOLEAN DEFAULT TRUE;
```

- [ ] **Step 2: Apply migration**
Run: `psql -d chopper_pos -f backend/src/database/migrations/add_requires_stock_to_products.sql` (Assuming DB name and tool availability).

- [ ] **Step 3: Commit**
```bash
git add backend/src/database/migrations/add_requires_stock_to_products.sql
git commit -m "db: add requires_stock column to products"
```

---

### Task 2: Backend Products Service Update

**Files:**
- Modify: `backend/src/modules/products/products.service.js`

- [ ] **Step 1: Update `getAll`**
Include `p.requires_stock` in the SELECT query.

- [ ] **Step 2: Update `create`**
Handle `requires_stock` in the INSERT query.

- [ ] **Step 3: Update `update`**
Handle `requires_stock` in the UPDATE query.

- [ ] **Step 4: Update `getById`**
Include `p.requires_stock` in the SELECT query.

- [ ] **Step 5: Commit**
```bash
git add backend/src/modules/products/products.service.js
git commit -m "feat(backend): handle requires_stock in ProductsService"
```

---

### Task 3: Backend Sales Service Update

**Files:**
- Modify: `backend/src/modules/sales/sales.service.js`

- [ ] **Step 1: Update `create` validation**
Skip stock check if `requires_stock` is false.

- [ ] **Step 2: Update `create` stock decrement and movement**
Skip updating `inventory` and inserting into `inventory_movements` if `requires_stock` is false.

- [ ] **Step 3: Update `create` low stock notification**
Skip adding to `pendingNotifications` if `requires_stock` is false.

- [ ] **Step 4: Update `cancel` stock revert**
Skip stock increment and inventory movement record if `requires_stock` is false.

- [ ] **Step 5: Commit**
```bash
git add backend/src/modules/sales/sales.service.js
git commit -m "feat(backend): skip inventory operations for stockless products in sales"
```

---

### Task 4: Backend Metrics Service Update

**Files:**
- Modify: `backend/src/modules/metrics/metrics.service.js`

- [ ] **Step 1: Update `getDashboard` low stock query**
Add `AND p.requires_stock = TRUE` (join with products if needed).

- [ ] **Step 2: Update `getInventoryMetrics` valuation and low stock queries**
Add `AND p.requires_stock = TRUE`.

- [ ] **Step 3: Commit**
```bash
git add backend/src/modules/metrics/metrics.service.js
git commit -m "feat(backend): exclude stockless products from inventory metrics"
```

---

### Task 5: Frontend Product Form Update

**Files:**
- Modify: `frontend/src/pages/products/ProductForm.jsx`

- [ ] **Step 1: Update Zod schema**
Add `requires_stock: z.boolean()` to `productSchema`.

- [ ] **Step 2: Update `defaultValues`**
Set `requires_stock` from `initialData` or default to `true`.

- [ ] **Step 3: Add Checkbox UI**
Add a checkbox for "Controlar Stock" or "Requiere Stock" in the form.

- [ ] **Step 4: Conditional Stock Fields**
Optional: Disable or hide stock fields if `requires_stock` is false (though user said they can have 0 stock, so it's better to just let them be but maybe pre-set to 0).

- [ ] **Step 5: Commit**
```bash
git add frontend/src/pages/products/ProductForm.jsx
git commit -m "feat(frontend): add requires_stock toggle to ProductForm"
```

---

### Task 6: Frontend Products List Update (Optional but Recommended)

**Files:**
- Modify: `frontend/src/pages/products/ProductsList.jsx`

- [ ] **Step 1: Show stockless status**
In the table, show "Sin stock" or similar if `requires_stock` is false.

- [ ] **Step 2: Commit**
```bash
git add frontend/src/pages/products/ProductsList.jsx
git commit -m "feat(frontend): display stockless status in ProductsList"
```
