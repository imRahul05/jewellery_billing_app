# Design Document: Business Address Configuration & Checkout Payment Flow

**Date:** 2026-10-14  
**Topic:** Business Address Configuration, Default Payment Mode Settings, and Invoice Pre-Finalization Payment & Due Flow  
**Target Branch:** `feat/business-address-and-billing-payments`

---

## 1. Intent & The Why

In the Jewellery ERP billing system:
1. **Business Address Configuration:** Each tenant operates independently under multi-tenancy, but there is currently no option in the Business Configuration UI to manage the store's physical address (street, city, state, postal code, country). Because invoices, cash memos, and GST Tax Invoices require the seller's legal address, businesses must be able to update and view this information easily.
2. **Checkout Payment Step Before Finalizing:** Currently, whenever an invoice is created, it is saved as an unpaid draft or issued as an unpaid bill. Staff are forced to navigate away, open a separate payment page, and record payments after the fact. At a physical jewellery counter, payment settlement happens right before handing over the bill and goods. Staff must be able to select how the customer is paying (full cash, full online/UPI, card, split payments, or credit/pay later) directly in the invoice builder.
3. **Transparent Balances & Due Determination:** The system must clearly calculate and display total payable, amount paid, and remaining balance due, setting the invoice status accurately (`paid`, `partially_paid`, or `issued`/due) without requiring manual status updates.
4. **Default Payment Mode Setting:** Different stores have different workflows (some primarily accept UPI, others cash). Businesses must be able to configure their default payment mode in settings so that the checkout step defaults to their preferred mode.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Tenant Address Settings:** Add a structured address form to Settings &rarr; Business Configuration (`street`, `city`, `state`, `postalCode`, `country`). Persist this in `Tenant.addressJson` and retrieve it via API.
- **Default Payment Mode Setting:** Add a configuration in Business Settings allowing owners/managers to choose a default payment mode (`cash`, `upi`, `card`, `split`, `due`) saved in `BusinessSetting.settingsJson`.
- **API & Client Typing:** Update `app/api/v1/settings/business/route.ts` and `lib/api/business.api.ts` to strictly type address details and default payment settings without using `any`.
- **Pre-Finalization Payment Step (Step 4):** Add a final step in `app/(app)/invoices/new/page.tsx` before finalizing:
  - Total summary: Grand Total, Old Gold exchange credit, Net Payable.
  - Pre-selected default payment mode from business settings.
  - Payment modes:
    - **Full Cash**: auto-fills amount to full net payable.
    - **Full Online / UPI**: auto-fills amount to full net payable, includes optional reference/UPI transaction ID.
    - **Full Card**: auto-fills amount, optional auth code / last 4 digits.
    - **Split Payment**: inputs for Cash amount and Online/Card amount; calculates sum.
    - **Credit / Due**: amount paid is ₹0, entire balance marked as due.
  - Live Settlement Breakdown:
    - `Amount Paid` = sum of cash, online, card amounts.
    - `Balance Due` = `Net Payable - Amount Paid`.
    - Live status badge: `PAID` (if balance == 0), `PARTIALLY PAID` (if balance > 0 and paid > 0), `ISSUED (DUE)` (if paid == 0).
    - Expected Due Settlement Date picker (active when `Balance Due > 0`).
- **Atomic Invoice Creation & Finalization:** Ensure `createInvoice` and `finalizeInvoice` accept the initial payments array, record them into the `Payment` table in the same transaction, deduct inventory items, and assign the proper initial invoice status.
- **Print & PDF Alignment:** Ensure `renderInvoicePdfToBuffer` and `InvoicePreviewDialog` display the tenant address and payment breakdown (Amount Paid, Payment Methods, Balance Due).

### Non-Goals
- Integrated payment gateway processing (Razorpay, Stripe, or Pine Labs POS hardware integration). This feature is for register accounting and ledger tracking at the counter.
- Customer loyalty point redemption or gift vouchers (deferred to customer loyalty milestone).

### Anti-Goals
- No breaking changes to existing invoices or retroactively altering historical invoice records.
- No loose typings: `any` is strictly prohibited per project rules; `unknown` must be narrowed with type guards.

---

## 3. Data Model & Architecture

### 3.1 Tenant Address Structure
`Tenant.addressJson` stores the structured object:
```ts
export interface AddressDetails {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```
A type guard `isAddressDetails(val: unknown): val is AddressDetails` ensures runtime safety.

### 3.2 Business Settings Extension
`BusinessSetting.settingsJson` stores:
```ts
export interface BusinessExtraSettings {
  defaultPaymentMode?: "cash" | "upi" | "card" | "split" | "due";
}
```

### 3.3 Payment Representation in Invoicing
In `lib/api/invoices.api.ts`:
```ts
export interface InitialPaymentInput {
  method: "cash" | "card" | "upi" | "bank_transfer" | "cheque" | "gold_exchange";
  amount: number;
  referenceNo?: string;
  notes?: string;
}
```
`InvoiceCreateInput` is updated to accept an optional `initialPayments?: InitialPaymentInput[]` and `dueDate?: string`.

### 3.4 Status & Balance Calculation Algorithm
Given:
- `GrandTotal` (after line items, taxes, and discounts)
- `OldGoldCredit` (deducted before cash/bank settlement)
- `NetPayable = max(0, GrandTotal - OldGoldCredit)`
- `PaymentsSum = sum(payments.amount where method != 'gold_exchange')`
- `BalanceDue = NetPayable - PaymentsSum`

Decision Rules:
1. If `PaymentsSum >= NetPayable` or `NetPayable == 0`:
   - `Invoice.status = "paid"`
   - `Invoice.amountPaid = NetPayable`
   - `Invoice.balanceDue = 0`
2. If `PaymentsSum > 0` and `PaymentsSum < NetPayable`:
   - `Invoice.status = "partially_paid"`
   - `Invoice.amountPaid = PaymentsSum`
   - `Invoice.balanceDue = NetPayable - PaymentsSum`
3. If `PaymentsSum == 0`:
   - `Invoice.status = "issued"`
   - `Invoice.amountPaid = 0`
   - `Invoice.balanceDue = NetPayable`

### 3.5 Architectural Resolutions (Builder Check)
- **GrandTotal Clarification:** In `calculateInvoice` and `Invoice.grandTotal`, the value already stores the post-deduction net amount (`subtotal + taxes - oldGoldCredit`). Therefore, `NetPayable === Invoice.grandTotal`. Old Gold is never double-deducted.
- **Finalize Endpoint Contract:** `POST /api/v1/invoices/[id]/finalize` is updated to accept an optional body `{ initialPayments?: InitialPaymentInput[], dueDate?: string }`. Inside the finalization transaction, it writes `Payment` records (status `completed`, linked to `tenantId` and `invoiceId`), updates `Invoice.amountPaid`, `Invoice.balanceDue`, `dueDate`, and `status`. If the body is empty, it maintains full backwards-compatibility. "Save as Draft" does not commit completed payment ledger records.
- **Split Payment Flexibility:** In Split Payment, both Cash and Digital (UPI/Card/Bank) fields are freely editable up to `NetPayable`. If the sum is less than `NetPayable`, the remainder is automatically calculated as `Balance Due` and triggers the `PARTIALLY PAID` status and optional Due Date picker. Digital split mode includes a selector for payment method (defaults to `upi`).
- **Customer Identification Policy:** Per business requirements, every bill must capture customer details (Customer Name and Mobile Number at minimum). Step 1 requires either selecting an existing customer or entering new customer details (which auto-registers them). Anonymous walk-in bills without a customer record are disallowed, ensuring all invoices have identifiable recipients for legal Tax Invoicing, WhatsApp sharing, and ledger tracking.
- **Tendered Cash & Change Calculation:** Cash fields accept exact payment or an optional tendered amount helper that displays change due to the customer, but the recorded `Payment.amount` is clamped to the payable balance.

---

## 4. User Interface Specifications

### 4.1 Business Settings Page (`app/(app)/settings/business/page.tsx`)
1. **Business Profile Card** expanded with:
   - Street Address (textarea or text input)
   - City (text input)
   - State (text input or dropdown with standard Indian states)
   - Postal / PIN Code (6-digit numeric input)
   - Country (defaults to India)
2. **Default Payment Mode**:
   - Select dropdown under Invoicing Settings: Cash, UPI / Online, Card, Split, Due / Credit.

### 4.2 Invoice Builder (`app/(app)/invoices/new/page.tsx`)
- Progress bar becomes 4 steps:
  - Step 1: Customer & Date (Search existing customer or quick-add new customer with Name & Phone; anonymous walk-in is disallowed)
  - Step 2: Line Items
  - Step 3: Old Gold & Discounts
  - **Step 4: Payment & Settlement**
- Step 4 Layout:
  - Left Column / Main Card:
    - Mode toggle pills: `[ Cash ] [ UPI / Online ] [ Card ] [ Split Pay ] [ Pay Later / Due ]`
    - Dynamic fields according to active mode:
      - Split pay displays Cash Amount & Online Amount fields with remaining auto-calculated.
      - Reference No. input for UPI / Card.
      - Due Date input (enabled whenever Balance Due > 0).
  - Right Column / Summary Card:
    - Invoice Subtotal & Taxes
    - Old Gold deduction
    - Net Amount Payable
    - Amount Paid (Green)
    - Balance Due (Red if > 0, Gray if 0)
    - Status Badge: `PAID` (green) / `PARTIALLY PAID` (amber) / `ISSUED` (blue)
  - Action buttons:
    - `Back` (returns to Step 3)
    - `Save as Draft` (preserves line items and draft status)
    - `Finalize & Issue Bill` (creates invoice, posts payments, deducts stock, opens printable PDF)

---

## 5. What's Left to the Builder
- Detailed UI micro-interactions (e.g. quick "Full Pay" button next to inputs in split mode).
- Form validation error styling for postal codes.
- State code auto-filling from GSTIN when the user enters a GSTIN.
