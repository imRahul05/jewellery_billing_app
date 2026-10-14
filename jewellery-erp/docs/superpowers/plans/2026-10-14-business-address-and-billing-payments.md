# Business Address Configuration & Checkout Payment Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement store address configuration, default payment mode settings, mandatory customer capture on invoices, and a pre-finalization checkout payment settlement step supporting cash, online, split payments, and dues.

**Architecture:** Extend Tenant and BusinessSetting schemas/APIs to persist structured address details and store payment defaults. In the billing wizard, mandate customer identification, introduce Step 4 for payment settlement, and update the atomic invoice finalization endpoint to record completed payments, deduct inventory, and determine invoice status (`paid`, `partially_paid`, or `issued`).

**Tech Stack:** Next.js 16 (App Router), TypeScript (Strict Mode, no `any`), Prisma 7 (PostgreSQL), Zod, React Hook Form, TailwindCSS, shadcn/ui, Vitest.

**Spec:** [`docs/superpowers/specs/2026-10-14-business-address-and-billing-payments-design.md`](../specs/2026-10-14-business-address-and-billing-payments-design.md)

## Global Constraints
- Absolute ban on `any` and untyped `unknown` (must use runtime type guards).
- Zero TypeScript and ESLint warnings/errors.
- Centralized API functions in `lib/api/*.api.ts` and HTTP client in `lib/api/http.ts`.
- Multi-tenant isolation verified on all tenant-specific database operations.

## Review Focus
1. **Zero Cash Payment (Full Due):** Cashier selects "Credit / Due"; verify `payments` is empty, `amountPaid` is 0, `balanceDue` is `grandTotal`, and invoice status is `issued`.
2. **Split Payment with Remainder Due:** Bill is ₹20,000, cashier records ₹5,000 cash and ₹10,000 UPI; verify two `Payment` rows recorded, `amountPaid` is ₹15,000, `balanceDue` is ₹5,000, and invoice status is `partially_paid`.
3. **Old Gold Offset + Payment:** Invoice has gross ₹1,00,000, Old Gold credit ₹20,000 (net payable ₹80,000), customer pays ₹80,000 cash; verify `grandTotal` is ₹80,000, `amountPaid` is ₹80,000, `balanceDue` is 0, and status is `paid` (no double deduction of old gold).
4. **Mandatory Customer Guard:** Attempting to proceed to Step 2 without selecting or registering a customer is blocked by UI and Zod validation.
5. **PDF Address Formatting:** Invoices generated display the updated store street, city, state, and postal code.

---

### Task 1: Business Address & Default Payment Mode Backend & Types

**Files:**
- Modify: `jewellery-erp/lib/api/business.api.ts`
- Modify: `jewellery-erp/app/api/v1/settings/business/route.ts`
- Test: `jewellery-erp/tests/business-address-settings.test.ts`

**Interfaces:**
- Consumes: `prisma.tenant`, `prisma.businessSetting`, `authorize("settings:read" | "settings:write")`
- Produces: `AddressDetails` interface, `type guard isAddressDetails`, `UnifiedBusinessSettings.address`, `UnifiedBusinessSettings.defaultPaymentMode`

- [ ] **Step 1: Write test for GET and PATCH business settings with address and default payment mode**
  Create `tests/business-address-settings.test.ts` testing:
  - PATCH `/api/v1/settings/business` with address `{ street: "123 Gold Lane", city: "Mumbai", state: "Maharashtra", postalCode: "400001", country: "India" }` and `defaultPaymentMode: "cash"`.
  - GET returns the address object and `defaultPaymentMode`.

- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm --filter jewellery-erp test tests/business-address-settings.test.ts`
  Expected: FAIL (missing fields / validation error).

- [ ] **Step 3: Update `lib/api/business.api.ts` and `app/api/v1/settings/business/route.ts`**
  - Define `AddressDetails` interface and runtime type guard `isAddressDetails`.
  - In `BusinessSettingUpdateSchema`, add `address: z.object({ street: z.string().min(1), city: z.string().min(1), state: z.string().min(1), postalCode: z.string().min(3), country: z.string().default("India") }).optional().nullable()`.
  - Add `defaultPaymentMode: z.enum(["cash", "upi", "card", "split", "due"]).optional()`.
  - Update GET handler to return structured address and `defaultPaymentMode` read from `settingsJson`.
  - Update PATCH handler to persist `address` into `Tenant.addressJson` and `defaultPaymentMode` into `BusinessSetting.settingsJson`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm --filter jewellery-erp test tests/business-address-settings.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add lib/api/business.api.ts app/api/v1/settings/business/route.ts tests/business-address-settings.test.ts
  git commit -m "feat(settings): add address details and default payment mode API support"
  ```

---

### Task 2: Business Settings UI for Address & Payment Mode

**Files:**
- Modify: `jewellery-erp/app/(app)/settings/business/page.tsx`

**Interfaces:**
- Consumes: `useBusinessSettings`, `useUpdateBusinessSettings`, `UnifiedBusinessSettings`
- Produces: Rendered Address form fields and Default Payment Mode selector in Settings

- [ ] **Step 1: Extend `BusinessSettingsSchema` in `page.tsx`**
  Add `addressStreet`, `addressCity`, `addressState`, `addressPostalCode`, `addressCountry`, and `defaultPaymentMode` to the form schema.

- [ ] **Step 2: Pre-populate form state from existing settings**
  Inside `React.useEffect`, map `settings.address` and `settings.defaultPaymentMode` into form default values.

- [ ] **Step 3: Render Address form section in "Business Profile" Card**
  Add inputs for Street Address, City, State, PIN / Postal Code, and Country with proper labels, IDs, and error messages.

- [ ] **Step 4: Render "Default Counter Payment Mode" select in "Invoicing & Sequence" Card**
  Add `<Select label="Default Payment Mode" {...register("defaultPaymentMode")}>` with options:
  - Cash
  - Online / UPI
  - Card
  - Split (Cash + Online)
  - Due / Credit (Pay Later)

- [ ] **Step 5: Verify build & commit**
  ```bash
  pnpm --filter jewellery-erp build
  git add app/\(app\)/settings/business/page.tsx
  git commit -m "feat(settings-ui): add business address inputs and default payment mode dropdown"
  ```

---

### Task 3: Backend Invoicing Payment Lifecycle & Atomic Finalization

**Files:**
- Modify: `jewellery-erp/lib/api/invoices.api.ts`
- Modify: `jewellery-erp/app/api/v1/invoices/[id]/finalize/route.ts`
- Test: `jewellery-erp/tests/invoice-finalize-payments.test.ts`

**Interfaces:**
- Consumes: `InitialPaymentInput`, `calculateInvoice`, `assignInvoiceNumber`
- Produces: `POST /api/v1/invoices/[id]/finalize` accepting `{ initialPayments?: InitialPaymentInput[], dueDate?: string }`

- [ ] **Step 1: Write tests for payment finalization scenarios**
  Create `tests/invoice-finalize-payments.test.ts`:
  - Full payment via Cash: verifies status is `paid`, `amountPaid == grandTotal`, `balanceDue == 0`.
  - Split payment (Cash + UPI): verifies two `Payment` rows, status is `partially_paid`, `balanceDue > 0`.
  - Zero payment (Credit): verifies status is `issued`, `balanceDue == grandTotal`.

- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm --filter jewellery-erp test tests/invoice-finalize-payments.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implement payment recording in `finalize/route.ts`**
  - Parse request body for `{ initialPayments?: InitialPaymentInput[], dueDate?: string }`.
  - Inside `prisma.$transaction`:
    - Insert `tx.payment.create` for each valid payment (linking `invoiceId`, `tenantId`, `customerId: invoice.customerId`, `status: "completed"`, `paidAt: new Date()`).
    - Sum non-gold payment amounts into `amountPaid`.
    - Compute `balanceDue = calcResult.grandTotal.sub(amountPaid)`.
    - Determine `finalStatus`: `paid` if `balanceDue <= 0`, `partially_paid` if `amountPaid > 0`, `issued` if `amountPaid == 0`.
    - Update `Invoice` record with `invoiceNumber`, `amountPaid`, `balanceDue`, `dueDate`, `status`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm --filter jewellery-erp test tests/invoice-finalize-payments.test.ts`
  Expected: PASS

- [ ] **Step 5: Run existing test suites to prevent regression**
  Run: `pnpm --filter jewellery-erp test tests/phase3.test.ts`
  Expected: PASS

- [ ] **Step 6: Commit**
  ```bash
  git add lib/api/invoices.api.ts app/api/v1/invoices/\[id\]/finalize/route.ts tests/invoice-finalize-payments.test.ts
  git commit -m "feat(invoices-api): support atomic payment settlement during invoice finalization"
  ```

---

### Task 4: Mandatory Customer Selection & Invoice Builder Step 4 UI

**Files:**
- Modify: `jewellery-erp/app/(app)/invoices/new/page.tsx`

**Interfaces:**
- Consumes: `useBusinessSettings`, `finalizeInvoice`, `InitialPaymentInput`
- Produces: 4-step invoice builder with mandatory customer and interactive payment settlement

- [ ] **Step 1: Update Step 1 to enforce Customer identification**
  - Remove anonymous "Walk-in" option without details; provide "Existing Customer" (search) and "New Customer" (name, phone, optional email/address).
  - Add validation preventing moving to Step 2 unless customer is selected or valid name & phone are entered.

- [ ] **Step 2: Implement Step 4 Form State in `invoices/new/page.tsx`**
  - State: `paymentMode`: `"cash" | "upi" | "card" | "split" | "due"`.
  - Initialize `paymentMode` from `settings.defaultPaymentMode` once loaded.
  - State: `cashAmount`, `digitalAmount`, `digitalMethod` (`"upi" | "card" | "bank_transfer"`), `referenceNo`, `dueDate`.
  - Calculate `payableAmount = calcResult.grandTotal`.
  - Calculate `amountPaid`:
    - If `cash`: `payableAmount`.
    - If `upi`: `payableAmount`.
    - If `card`: `payableAmount`.
    - If `split`: `parseFloat(cashAmount || 0) + parseFloat(digitalAmount || 0)`.
    - If `due`: `0`.
  - Calculate `balanceDue = max(0, payableAmount - amountPaid)`.
  - Compute status badge: `PAID`, `PARTIALLY PAID`, or `ISSUED`.

- [ ] **Step 3: Render Step 4 Payment UI**
  - Render payment mode selector pills.
  - Render payment inputs (amount inputs, reference number input, tendered cash change helper).
  - Render Live Settlement card with Grand Total, Old Gold Credit, Net Payable, Amount Received, and Balance Due.
  - Render Due Date picker if `balanceDue > 0`.

- [ ] **Step 4: Connect Finalize button with payment payload**
  - When clicking "Finalize & Issue Bill", construct `initialPayments: InitialPaymentInput[]` from entered amounts.
  - Call `finalizeInvoice({ id: invoice.id, data: { initialPayments, dueDate } })`.
  - Open PDF preview on success.

- [ ] **Step 5: Verify build & commit**
  ```bash
  pnpm --filter jewellery-erp build
  git add app/\(app\)/invoices/new/page.tsx
  git commit -m "feat(billing-ui): add Step 4 payment settlement and enforce mandatory customer capture"
  ```

---

### Task 5: PDF Rendering & Invoice Preview Updates

**Files:**
- Modify: `jewellery-erp/lib/billing/pdf/renderer.ts`
- Modify: `jewellery-erp/lib/billing/pdf/invoice-pdf.tsx`
- Modify: `jewellery-erp/components/billing/invoice-preview-dialog.tsx`

**Interfaces:**
- Consumes: `Tenant.addressJson`, `Invoice.payments`, `Invoice.balanceDue`
- Produces: Formatted store address and settlement summary on PDF and Preview modal

- [ ] **Step 1: Update `getTenantAddressString` in `renderer.ts`**
  Ensure street, city, state, postal code, and country are cleanly joined:
  `[addr.street, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(", ")`.

- [ ] **Step 2: Update `InvoicePdfDocument` and `InvoicePreviewDialog`**
  Display payment methods breakdown (`payments.map(p => ...)`), Amount Paid, and Balance Due on the invoice footer.

- [ ] **Step 3: Verify build & commit**
  ```bash
  pnpm --filter jewellery-erp build
  git add lib/billing/pdf/renderer.ts lib/billing/pdf/invoice-pdf.tsx components/billing/invoice-preview-dialog.tsx
  git commit -m "feat(billing-pdf): render store address and payment breakdown on invoice preview and PDF"
  ```

---

### Task 6: Full Verification, Typecheck, Lint, and Branch Delivery

**Files:**
- Workspace-wide verification

- [ ] **Step 1: Run TypeScript compiler check**
  Run: `pnpm --filter jewellery-erp exec tsc --noEmit`
  Expected: 0 errors.

- [ ] **Step 2: Run ESLint**
  Run: `pnpm --filter jewellery-erp lint`
  Expected: 0 errors.

- [ ] **Step 3: Run full Vitest test suite**
  Run: `pnpm --filter jewellery-erp test`
  Expected: All test suites pass.

- [ ] **Step 4: Push branch to GitHub**
  ```bash
  git push -u origin feat/business-address-and-billing-payments
  ```

- [ ] **Step 5: Create Pull Request**
  Generate PR from `feat/business-address-and-billing-payments` targeting `main` with summary and verification evidence.
