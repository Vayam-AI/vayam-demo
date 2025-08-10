"use client";

import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const [showMessage, setShowMessage] = useState(false);
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "not-signed-in") {
      setMessageType("error");
      setMessageText("You need to sign in to access that page");
      setShowMessage(true);
      // Hide message after 5 seconds
      const timer = setTimeout(() => setShowMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Check if user was logged out successfully
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("message") === "logged-out") {
      setMessageType("success");
      setMessageText("Logged out successfully");
      setShowMessage(true);
      // Hide message after 3 seconds
      const timer = setTimeout(() => setShowMessage(false), 3000);
      // Clean up URL
      window.history.replaceState({}, '', '/');
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Authentication Message */}
      {showMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
            messageType === "error"
              ? "bg-destructive text-destructive-foreground"
              : "bg-green-600 text-white"
          }`}
        >
          {messageType === "error" ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <span>{messageText}</span>
        </motion.div>
      )}

      {/* Blurred Background */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/10 dark:bg-black/10" />

      <div className="relative w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left Side - Simple Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 text-center lg:text-left order-2 lg:order-1"
        >
          {/* Logo & Brand */}
          <div className="flex items-center justify-center lg:justify-start space-x-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl">
              <span className=" font-bold text-2xl font-serif">V</span>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold ">Vayam</h1>
            </div>
          </div>

       
        </motion.div>

        {/* Right Side - Sign In Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative order-1 lg:order-2"
        >
          <div className=" rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-12">
            <div className="relative space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Welcome Back
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Sign in to continue your journey
                </p>
              </div>

              <div className="text-center space-y-4">
               

                <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <Shield className="w-4 h-4" />
                  <span>Your privacy is protected</span>
                </div>
              </div>

              <GoogleSignInButton />

              
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
