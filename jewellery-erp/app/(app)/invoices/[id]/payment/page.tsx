"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { invoiceApi, PaymentCreateInput } from "@/lib/api/invoices.api";
import { SerializedInvoice } from "@/app/api/v1/invoices/route";
import { ArrowLeft, Wallet } from "lucide-react";

export default function RecordPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const router = useRouter();
  const { id } = use(params);

  const [invoice, setInvoice] = useState<SerializedInvoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<
    "cash" | "card" | "upi" | "bank_transfer" | "cheque" | "store_credit" | "gold_exchange"
  >("cash");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [exchangeWeight, setExchangeWeight] = useState<string>("");
  const [exchangeValue, setExchangeValue] = useState<string>("");

  useEffect(() => {
    const fetchInvoice = async (): Promise<void> => {
      try {
        setLoading(true);
        const res = await invoiceApi.getInvoiceById(id);
        setInvoice(res.data);
        setAmount(res.data.balanceDue); // Default to paying remaining balance
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load invoice";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    void fetchInvoice();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!invoice) return;

    const payAmt = parseFloat(amount);
    const balance = parseFloat(invoice.balanceDue);

    if (isNaN(payAmt) || payAmt <= 0) {
      toast.error("Please enter a valid positive payment amount.");
      return;
    }

    if (payAmt > balance) {
      toast.error(`Payment amount (₹${payAmt.toFixed(2)}) cannot exceed outstanding balance due (₹${balance.toFixed(2)}).`);
      return;
    }

    try {
      setSubmitting(true);
      const payload: PaymentCreateInput = {
        amount: payAmt,
        method,
        referenceNo: referenceNo || null,
        exchangeMetalWeight: method === "gold_exchange" ? parseFloat(exchangeWeight) : null,
        exchangeMetalValue: method === "gold_exchange" ? parseFloat(exchangeValue) : null,
        paidAt: new Date(),
      };

      await invoiceApi.createPayment(id, payload);
      toast.success(`Payment of ₹${payAmt.toFixed(2)} recorded successfully!`);
      router.push(`/invoices/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record payment";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-muted-foreground animate-pulse font-medium">Loading invoice details...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6 max-w-lg text-center space-y-4">
        <h2 className="text-2xl font-bold">Invoice Not Found</h2>
        <p className="text-muted-foreground">The requested invoice details could not be retrieved.</p>
        <Link href="/invoices" passHref>
          <Button>Back to Invoices</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-xl space-y-6">
      <div className="flex items-center space-x-3">
        <Link href={`/invoices/${id}`} passHref>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Record Payment</h1>
          <p className="text-muted-foreground text-sm">Invoice No: {invoice.invoiceNumber}</p>
        </div>
      </div>

      <Card className="shadow-lg border-emerald-100/50 bg-emerald-50/5">
        <CardHeader>
          <CardTitle className="text-emerald-600 flex items-center">
            <Wallet className="mr-2 h-5 w-5" /> Collect Payment
          </CardTitle>
          <CardDescription>Capture payment details against outstanding balance.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border flex justify-between items-center text-sm">
              <div>
                <p className="text-muted-foreground">Outstanding Balance:</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">₹{parseFloat(invoice.balanceDue).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Grand Total:</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">₹{parseFloat(invoice.grandTotal).toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay-amount">Payment Amount (INR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span>
                <Input
                  id="pay-amount"
                  type="number"
                  step="0.01"
                  className="pl-7 font-semibold"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay-method">Payment Method</Label>
              <Select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value as "cash" | "card" | "upi" | "bank_transfer" | "cheque" | "store_credit" | "gold_exchange")}>
                <option value="cash">Cash</option>
                <option value="card">Debit / Credit Card</option>
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="bank_transfer">Bank Transfer (IMPS / NEFT)</option>
                <option value="cheque">Cheque</option>
                <option value="store_credit">Store Credit</option>
                <option value="gold_exchange">Old Gold Exchange Deduction</option>
              </Select>
            </div>

            {method === "gold_exchange" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ex-wt">Exchange Gold Weight (g)</Label>
                  <Input
                    id="ex-wt"
                    type="number"
                    step="0.001"
                    placeholder="e.g. 10.250"
                    value={exchangeWeight}
                    onChange={(e) => setExchangeWeight(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ex-val">Valuation (INR)</Label>
                  <Input
                    id="ex-val"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 68000.00"
                    value={exchangeValue}
                    onChange={(e) => setExchangeValue(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ref">Reference Number / Transaction ID</Label>
              <Input
                id="ref"
                placeholder="e.g. Txn1234567890, Cheque #000123"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Link href={`/invoices/${id}`} passHref>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-100" disabled={submitting}>
              {submitting ? "Processing..." : "Capture Payment"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
