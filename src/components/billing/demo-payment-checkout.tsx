"use client";

import React, { useState } from "react";
import { DetailedInvoice, DetailedPayment } from "@/types";
import { formatINR, paiseToRupees, rupeesToPaise } from "@/lib/billing/math";
import { processDemoPaymentAction } from "@/app/actions/billing";
import { PaymentProcessing } from "./payment-processing";
import { PaymentResult } from "./payment-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  CreditCard,
  QrCode,
  Building,
  Smartphone,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  Info,
  Sparkles,
} from "lucide-react";

export interface DemoPaymentCheckoutProps {
  invoice: DetailedInvoice;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (payment: DetailedPayment) => void;
}

type TabMethod = "upi" | "card" | "debit_card" | "net_banking";

const TOP_BANKS = [
  { id: "HDFC", name: "HDFC Bank", code: "HDFC0001" },
  { id: "ICICI", name: "ICICI Bank", code: "ICIC0002" },
  { id: "SBI", name: "State Bank of India", code: "SBIN0003" },
  { id: "AXIS", name: "Axis Bank", code: "UTIB0004" },
  { id: "KOTAK", name: "Kotak Mahindra Bank", code: "KKBK0005" },
  { id: "PNB", name: "Punjab National Bank", code: "PUNB0006" },
];

export function DemoPaymentCheckout({
  invoice,
  isOpen,
  onClose,
  onPaymentSuccess,
}: DemoPaymentCheckoutProps) {
  const maxDueRupees = paiseToRupees(invoice.amountDuePaise);

  const [activeTab, setActiveTab] = useState<TabMethod>("upi");
  const [amountRupees, setAmountRupees] = useState<number>(maxDueRupees);
  const [step, setStep] = useState<"form" | "processing" | "result">("form");

  // UPI state
  const [upiVpa, setUpiVpa] = useState<string>("customer@okaxis");
  const [showQr, setShowQr] = useState<boolean>(false);

  // Card state
  const [selectedCardType, setSelectedCardType] = useState<"visa" | "mastercard">("visa");
  const [cardHolder, setCardHolder] = useState<string>(invoice.customerName || "AUTHORIZED SIGNATORY");

  // Net banking state
  const [selectedBank, setSelectedBank] = useState<string>("HDFC");

  // Processing state
  const [isSimulatingFailure, setIsSimulatingFailure] = useState<boolean>(false);
  const [resultData, setResultData] = useState<{
    success: boolean;
    transactionReference: string;
    errorMessage?: string;
    remainingDuePaise: number;
    amountPaidRupees: number;
  } | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulatePayment = async (outcome: "success" | "failure") => {
    setFormError(null);

    if (isNaN(amountRupees) || amountRupees <= 0) {
      setFormError("Please enter a valid amount greater than zero.");
      return;
    }

    if (amountRupees > maxDueRupees) {
      setFormError(
        `Amount (₹${amountRupees.toFixed(2)}) cannot exceed outstanding balance of ₹${maxDueRupees.toFixed(2)}.`
      );
      return;
    }

    setIsSimulatingFailure(outcome === "failure");
    setStep("processing");

    // Gather simulated details
    let simulatedDetails: any = {};
    if (activeTab === "upi") {
      simulatedDetails = { upiVpa: showQr ? "demo.qr.scan@brightloop" : upiVpa };
    } else if (activeTab === "card" || activeTab === "debit_card") {
      simulatedDetails = {
        cardBrand: selectedCardType === "visa" ? "Visa" : "Mastercard",
        cardLast4: selectedCardType === "visa" ? "4242" : "5555",
      };
    } else if (activeTab === "net_banking") {
      const b = TOP_BANKS.find((item) => item.id === selectedBank);
      simulatedDetails = { bankName: b?.name || selectedBank };
    }

    try {
      // Simulate realistic network latency (1.8s) for the demo experience
      const [response] = await Promise.all([
        processDemoPaymentAction({
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amountRupees,
          paymentMethod: activeTab,
          demoOutcome: outcome,
          failureReason:
            outcome === "failure"
              ? "Simulated Bank Decline: Transaction rejected due to simulated insufficient card balance."
              : undefined,
          simulatedDetails,
        }),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ]);

      if (response.success && response.data?.success) {
        const remainingDue = invoice.amountDuePaise - rupeesToPaise(amountRupees);
        setResultData({
          success: true,
          transactionReference: response.data.transactionReference,
          remainingDuePaise: Math.max(0, remainingDue),
          amountPaidRupees: amountRupees,
        });
        setStep("result");
        if (onPaymentSuccess && response.data.payment) {
          onPaymentSuccess(response.data.payment);
        }
      } else {
        setResultData({
          success: false,
          transactionReference:
            response.data?.transactionReference || `DEMO-FAIL-${Date.now()}`,
          errorMessage:
            response.error ||
            response.data?.error ||
            "Simulated Bank Decline: The transaction could not be processed.",
          remainingDuePaise: invoice.amountDuePaise,
          amountPaidRupees: 0,
        });
        setStep("result");
      }
    } catch (err: any) {
      setResultData({
        success: false,
        transactionReference: `DEMO-ERR-${Date.now()}`,
        errorMessage: err.message || "An unexpected error occurred during payment processing.",
        remainingDuePaise: invoice.amountDuePaise,
        amountPaidRupees: 0,
      });
      setStep("result");
    }
  };

  const handleRetry = () => {
    setStep("form");
    setResultData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-background border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground font-black text-lg">
              BL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Brightloop Demo Checkout</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  DEMO GATEWAY
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Simulated checkout portal • {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          {step !== "processing" && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* STEP 1: PROCESSING */}
        {step === "processing" && (
          <PaymentProcessing
            amountRupees={amountRupees}
            paymentMethod={activeTab}
            isSimulatingFailure={isSimulatingFailure}
          />
        )}

        {/* STEP 2: RESULT */}
        {step === "result" && resultData && (
          <PaymentResult
            success={resultData.success}
            amountRupees={resultData.amountPaidRupees}
            transactionReference={resultData.transactionReference}
            paymentMethod={activeTab}
            remainingDuePaise={resultData.remainingDuePaise}
            errorMessage={resultData.errorMessage}
            invoiceNumber={invoice.invoiceNumber}
            customerName={invoice.customerName}
            onRetry={handleRetry}
            onClose={onClose}
          />
        )}

        {/* STEP 3: CHECKOUT FORM */}
        {step === "form" && (
          <div className="p-6 space-y-6">
            {/* Invoice Financial Summary Banner */}
            <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground">Customer:</span>
                <p className="font-semibold text-foreground text-sm">
                  {invoice.customerName}
                </p>
                <p className="text-muted-foreground">{invoice.customerEmail}</p>
              </div>
              <div className="flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0">
                <span className="text-muted-foreground">Outstanding Balance:</span>
                <span className="text-lg font-black text-primary font-mono">
                  {formatINR(invoice.amountDuePaise)}
                </span>
              </div>
            </div>

            {/* Payment Amount Input & Quick Chips */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-foreground">
                  Payment Amount (INR ₹)
                </label>
                <span className="text-muted-foreground">
                  Max: ₹{maxDueRupees.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">
                    ₹
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    max={maxDueRupees}
                    value={amountRupees || ""}
                    onChange={(e) => setAmountRupees(parseFloat(e.target.value) || 0)}
                    className="pl-7 font-mono font-semibold"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmountRupees(maxDueRupees)}
                  className="text-xs shrink-0"
                >
                  Pay Full
                </Button>
                {maxDueRupees > 100 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmountRupees(Math.round((maxDueRupees / 2) * 100) / 100)}
                    className="text-xs shrink-0"
                  >
                    Pay 50%
                  </Button>
                )}
              </div>
              {formError && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formError}
                </p>
              )}
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Simulated Payment Method
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("upi")}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    activeTab === "upi"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs font-semibold">UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("card")}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    activeTab === "card"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs font-semibold">Credit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("debit_card")}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    activeTab === "debit_card"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs font-semibold">Debit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("net_banking")}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    activeTab === "net_banking"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Building className="w-5 h-5" />
                  <span className="text-xs font-semibold">Net Banking</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: UPI */}
            {activeTab === "upi" && (
              <div className="p-4 rounded-xl border bg-muted/20 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    Simulated UPI Instant Transfer
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowQr(false)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                        !showQr ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      UPI ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQr(true)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                        showQr ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      QR Code
                    </button>
                  </div>
                </div>

                {!showQr ? (
                  <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground">Virtual Payment Address (VPA)</label>
                    <Input
                      value={upiVpa}
                      onChange={(e) => setUpiVpa(e.target.value)}
                      placeholder="username@okhdfcbank"
                      className="text-xs"
                    />
                    <div className="flex gap-1.5 pt-1">
                      {["demo.pay@okaxis", "accounts@okhdfc", "finance@oksbi"].map((vpa) => (
                        <button
                          key={vpa}
                          type="button"
                          onClick={() => setUpiVpa(vpa)}
                          className="text-[10px] bg-background border px-2 py-0.5 rounded text-muted-foreground hover:text-foreground"
                        >
                          {vpa}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border text-center space-y-2">
                    <div className="w-32 h-32 border-2 border-dashed border-primary/40 rounded-lg flex flex-col items-center justify-center bg-muted/20">
                      <QrCode className="w-16 h-16 text-primary/70" />
                      <span className="text-[10px] font-mono text-muted-foreground mt-1">SIMULATED QR</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scan with any simulated UPI App (GPay, PhonePe, Paytm)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CREDIT / DEBIT CARD */}
            {(activeTab === "card" || activeTab === "debit_card") && (
              <div className="space-y-4 animate-in fade-in">
                {/* Visual Card Mockup */}
                <div
                  className={`w-full rounded-xl p-5 text-white shadow-lg space-y-3 transition-all ${
                    activeTab === "card"
                      ? "bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900"
                      : "bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">
                      {activeTab === "card" ? "Brightloop Corporate Platinum" : "Brightloop Business Debit"}
                    </span>
                    <span className="text-sm font-black tracking-wider uppercase font-mono">
                      {selectedCardType === "visa" ? "VISA" : "MASTERCARD"}
                    </span>
                  </div>

                  <div className="py-2">
                    <p className="font-mono text-lg tracking-widest font-medium">
                      {selectedCardType === "visa" ? "4242 •••• •••• 4242" : "5555 •••• •••• 5555"}
                    </p>
                  </div>

                  <div className="flex justify-between items-end text-xs font-mono">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider opacity-60 block">Cardholder</span>
                      <span className="font-semibold">{cardHolder}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider opacity-60 block">Expires</span>
                      <span className="font-semibold">12/28</span>
                    </div>
                  </div>
                </div>

                {/* Card Test Preset Buttons */}
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCardType("visa")}
                    className={`flex-1 py-1.5 px-3 rounded-md border text-center transition-colors ${
                      selectedCardType === "visa"
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Visa Test Card (•••• 4242)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCardType("mastercard")}
                    className={`flex-1 py-1.5 px-3 rounded-md border text-center transition-colors ${
                      selectedCardType === "mastercard"
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Mastercard Test (•••• 5555)
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: NET BANKING */}
            {activeTab === "net_banking" && (
              <div className="space-y-2 animate-in fade-in">
                <label className="text-[11px] text-muted-foreground">Select Partner Bank</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TOP_BANKS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBank(b.id)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                        selectedBank === b.id
                          ? "border-primary bg-primary/10 font-semibold text-primary"
                          : "border-border hover:bg-muted text-foreground"
                      }`}
                    >
                      <span>{b.name}</span>
                      {selectedBank === b.id && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Demo Simulation Controls */}
            <div className="pt-2 border-t space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-foreground">Hackathon Demonstration Triggers:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => handleSimulatePayment("success")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Simulate Successful Payment
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSimulatePayment("failure")}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold py-2.5 flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Simulate Bank Decline
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground text-center">
                Simulated transactions record directly into the demo database ledger without charging real currency.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

