"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, TrendingUp, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { trackEvent, identifyUser } from "aurea-tracking-sdk";

export default function ThankYouPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Try to get user info from URL params (if Whop passes them)
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get("email");
    const userName = urlParams.get("name");
    const orderId = urlParams.get("order_id") || urlParams.get("transaction_id") || `order_${Date.now()}`;
    const fromCheckout = urlParams.get("from_checkout") === "true";
    const originalSessionId = urlParams.get("session_id"); // ✅ NEW: Get original session ID

    // ✅ NEW: Calculate checkout duration from sessionStorage
    const checkoutStartTime = sessionStorage.getItem('checkout_started_at');
    const checkoutDuration = checkoutStartTime 
      ? Math.floor((Date.now() - Number.parseInt(checkoutStartTime, 10)) / 1000)
      : null;

    // Use new SDK checkoutCompleted() method if available
    if (typeof window !== 'undefined' && (window as any).aureaSDK) {
      // ✅ UPDATED: Pass originalSessionId and checkoutDuration
      (window as any).aureaSDK.checkoutCompleted({
        orderId,
        revenue: 99,
        currency: "USD",
        paymentMethod: "stripe",
        products: [{
          productId: "ttr_membership",
          productName: "TTR VIP Access",
          price: 99,
          currency: "USD",
          quantity: 1
        }],
        originalSessionId,  // ✅ NEW: Link to pre-checkout session
        checkoutDuration,   // ✅ NEW: Time spent on Whop
      });
      
      console.log("[TTR] Checkout completed with session linking");
      console.log("  Original Session:", originalSessionId);
      console.log("  Checkout Duration:", checkoutDuration, "seconds");
    } else {
      // Fallback to old tracking
      const conversionTracked = sessionStorage.getItem("conversion_tracked");
      if (!conversionTracked) {
        trackEvent("checkout_completed", {
          source: "thank_you_page",
          fallback: true,
          orderId,
          checkoutDuration,
        });
        sessionStorage.setItem("conversion_tracked", "true");
      }
    }

    // Identify user if we have their email
    if (userEmail) {
      if (typeof window !== 'undefined' && (window as any).aureaSDK) {
        (window as any).aureaSDK.identify(userEmail, {
          name: userName || "TTR Member",
          email: userEmail,
          source: "thank_you_page",
          product: "TTR Membership",
          purchaseDate: new Date().toISOString(),
        });
      } else {
        identifyUser(userEmail, {
          name: userName || "TTR Member",
          email: userEmail,
          source: "thank_you_page",
          product: "TTR Membership",
        });
      }
      console.log("[TTR] User identified:", userEmail);
    }

    // Track thank you page view
    if (typeof window !== 'undefined' && (window as any).aureaSDK) {
      (window as any).aureaSDK.trackEvent("thank_you_page_viewed", {
        source: "whop_checkout",
        fromCheckout,
        orderId,
        checkoutDuration,
        timestamp: new Date().toISOString(),
      });
    } else {
      trackEvent("thank_you_page_viewed", {
        source: "whop_checkout",
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  if (!mounted) return null;

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
            Welcome to the Room! 🎉
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
                <h3 className="font-semibold mb-1">Start Learning</h3>
                <p className="text-gray-400 text-sm">
                  Get access to all the resources, signals, and educational content immediately.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Community Access</h3>
            <p className="text-sm text-gray-400">
              Join 500+ traders in our exclusive Discord
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Real-Time Signals</h3>
            <p className="text-sm text-gray-400">
              Get notified of every trade Tom makes
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Lifetime Access</h3>
            <p className="text-sm text-gray-400">
              One payment, unlimited learning
            </p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="gradient"
            className="rounded-xl px-8 py-6 text-base group"
            onClick={() => {
              trackEvent("check_email_clicked", {
                source: "thank_you_page",
              });
              // You can add email link here if needed
            }}
          >
            Check Your Email
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            variant="outline"
            className="rounded-xl px-8 py-6 text-base border-white/20 hover:bg-white/5"
            onClick={() => {
              trackEvent("back_to_home_clicked", {
                source: "thank_you_page",
              });
              window.location.href = "/";
            }}
          >
            Back to Home
          </Button>
        </motion.div>

        {/* Support Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center mt-12 text-sm text-gray-500"
        >
          <p>
            Need help? Email us at{" "}
            <a
              href="mailto:support@tomstradingroom.com"
              className="text-blue-400 hover:text-blue-300 underline"
              onClick={() =>
                trackEvent("support_email_clicked", {
                  source: "thank_you_page",
                })
              }
            >
              support@tomstradingroom.com
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
