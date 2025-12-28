"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function TestCheckout() {
  const [returnUrl, setReturnUrl] = useState<string>("");
  const [aureaId, setAureaId] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get parameters from URL
    const params = new URLSearchParams(window.location.search);
    const url = params.get("return_url");
    const id = params.get("aurea_id");
    
    if (url) setReturnUrl(url);
    if (id) setAureaId(id);
    
    console.log("Test Checkout Loaded:");
    console.log("- Return URL:", url);
    console.log("- Aurea ID:", id);
  }, []);

  const handleComplete = () => {
    if (returnUrl) {
      console.log("Redirecting to:", returnUrl);
      // Simulate Whop redirecting back after purchase
      window.location.href = returnUrl;
    } else {
      alert("No return URL found! Check URL parameters.");
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#020513] text-white px-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-2xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
              <CreditCard className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Test Checkout Page
            </h1>
            <p className="text-gray-400">
              This simulates Whop's checkout flow
            </p>
          </div>

          {/* Info Cards */}
          <div className="space-y-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Return URL:</div>
              <div className="text-sm font-mono text-blue-400 break-all">
                {returnUrl || "Not provided"}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Aurea ID (Anonymous ID):</div>
              <div className="text-sm font-mono text-green-400 break-all">
                {aureaId || "Not provided"}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">TTR Membership</h3>
                <p className="text-sm text-gray-400">Lifetime Access</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">$99</div>
                <div className="text-sm text-gray-400">one-time</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Access to private Discord</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Real-time trading signals</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Educational resources</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-4">
            <Button
              onClick={handleComplete}
              disabled={!returnUrl}
              variant="gradient"
              className="w-full rounded-xl py-6 text-base group"
            >
              Complete Purchase (Test)
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            {!returnUrl && (
              <p className="text-sm text-red-400 text-center">
                ⚠️ No return URL found. Make sure you came from the buy button.
              </p>
            )}

            <p className="text-xs text-gray-500 text-center">
              This is a test page for development. No actual charge will occur.
            </p>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          <p className="mb-2">
            <strong>Testing Instructions:</strong>
          </p>
          <ol className="text-left inline-block space-y-1">
            <li>1. Click the "Complete Purchase" button above</li>
            <li>2. You'll be redirected to the thank-you page</li>
            <li>3. Check browser console for tracking events</li>
            <li>4. Verify events in Aurea CRM analytics</li>
          </ol>
        </motion.div>
      </div>
    </main>
  );
}
