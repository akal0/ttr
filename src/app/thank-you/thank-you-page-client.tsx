"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle, TrendingUp, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getAureaSDK } from "@/components/aurea-tracking";

/**
 * Thank You Page
 * 
 * This page handles post-purchase tracking:
 * 1. Calls checkoutCompleted() to track the conversion
 * 2. Identifies the user if email is available
 * 3. Links the conversion back to the original session
 */
export default function ThankYouPageClient() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);

    const sdk = getAureaSDK();
    
    // Get URL params (Whop may pass these)
    const userEmail = searchParams.get("email");
    const userName = searchParams.get("name");
    const orderId = searchParams.get("order_id") || searchParams.get("transaction_id") || `order_${Date.now()}`;
    const fromCheckout = searchParams.get("from_checkout") === "true";
    const originalSessionId = searchParams.get("session_id");

    // Calculate checkout duration from sessionStorage
    const checkoutStartTime = sessionStorage.getItem("checkout_started_at");
    const checkoutDuration = checkoutStartTime 
      ? Math.floor((Date.now() - Number.parseInt(checkoutStartTime, 10)) / 1000)
      : null;

    console.log("[TTR] Thank you page loaded");
    console.log("[TTR] Order ID:", orderId);
    console.log("[TTR] From checkout:", fromCheckout);
    console.log("[TTR] Original session:", originalSessionId);
    console.log("[TTR] Checkout duration:", checkoutDuration, "seconds");

    if (sdk) {
      // Check if we already tracked this conversion (prevent double-tracking on refresh)
      const conversionTracked = sessionStorage.getItem("conversion_tracked");
      
      if (!conversionTracked) {
        // Call checkoutCompleted() - this:
        // 1. Advances funnel stage to 'purchase'
        // 2. Tracks checkout_completed event with revenue
        // 3. Links back to the original pre-checkout session
        // 4. Sends conversion to Aurea CRM
        sdk.checkoutCompleted({
          orderId,
          revenue: 99,
          currency: "USD",
          paymentMethod: "stripe",
          products: [{
            productId: "ttr_membership",
            productName: "TTR VIP Access",
            price: 99,
            currency: "USD",
          }],
        });
        
        // Mark as tracked to prevent duplicates
        sessionStorage.setItem("conversion_tracked", "true");
        
        console.log("[TTR] Checkout completed tracked");
      } else {
        console.log("[TTR] Conversion already tracked, skipping");
      }

      // Identify user if we have their email
      if (userEmail) {
        sdk.identify(userEmail, {
          name: userName || "TTR Member",
          email: userEmail,
          product: "TTR Membership",
          purchaseDate: new Date().toISOString(),
          orderId,
        });
        console.log("[TTR] User identified:", userEmail);
      }

      // Track thank you page view
      sdk.trackEvent("thank_you_page_viewed", {
        source: "whop_checkout",
        fromCheckout,
        orderId,
        checkoutDuration,
        hasEmail: !!userEmail,
      });
    } else {
      console.warn("[TTR] SDK not available on thank you page");
    }

    // Clear checkout tracking data
    sessionStorage.removeItem("checkout_started_at");
  }, [searchParams]);

  if (!mounted) return null;

  const handleCheckEmail = () => {
    const sdk = getAureaSDK();
    sdk?.trackEvent("check_email_clicked", {
      source: "thank_you_page",
    });
  };

  const handleBackToHome = () => {
    const sdk = getAureaSDK();
    sdk?.trackEvent("back_to_home_clicked", {
      source: "thank_you_page",
    });
    window.location.href = "/";
  };

  const handleSupportClick = () => {
    const sdk = getAureaSDK();
    sdk?.trackEvent("support_email_clicked", {
      source: "thank_you_page",
    });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#020513] text-white px-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl w-full relative z-10">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl" />
            <CheckCircle className="w-24 h-24 text-green-500 relative" />
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
            Welcome to the Room!
          </h1>
          <p className="text-xl text-gray-400">
            You're now part of Tom's Trading Room
          </p>
        </motion.div>

        {/* Confirmation Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4 text-center">
            What Happens Next?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Check Your Email</h3>
                <p className="text-gray-400 text-sm">
                  You'll receive a confirmation email with your access details within the next few minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Access the Discord</h3>
                <p className="text-gray-400 text-sm">
                  Join our private Discord community where Tom shares his daily trades and analysis.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Start Trading</h3>
                <p className="text-gray-400 text-sm">
                  Begin applying the strategies and frameworks to your own trading.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Button
            onClick={handleCheckEmail}
            variant="outline"
            className="flex items-center gap-2 bg-white/5 border-white/10 hover:bg-white/10"
          >
            <CheckCircle className="w-4 h-4" />
            Check Email
          </Button>
          <Button
            onClick={handleSupportClick}
            variant="outline"
            className="flex items-center gap-2 bg-white/5 border-white/10 hover:bg-white/10"
          >
            <Users className="w-4 h-4" />
            Get Support
          </Button>
          <Button
            onClick={handleBackToHome}
            variant="outline"
            className="flex items-center gap-2 bg-white/5 border-white/10 hover:bg-white/10"
          >
            <ArrowRight className="w-4 h-4" />
            Back to Home
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center"
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">87%</p>
            <p className="text-gray-400 text-sm">Success Rate</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">3,200+</p>
            <p className="text-gray-400 text-sm">Active Members</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">24/7</p>
            <p className="text-gray-400 text-sm">Support Access</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
