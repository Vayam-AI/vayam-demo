"use client";

import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-end lg:items-center justify-center p-4">
      {/* Blurred Background */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/10 dark:bg-black/10" />

      <div className="relative w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-8 lg:mb-0">
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

          {/* Simple Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-4"
          >
            <p className="text-xl lg:text-2xl text-neutral-700 dark:text-neutral-300 font-medium">
              Empowering voices, shaping conversations
            </p>
          </motion.div>
        </motion.div>

        {/* Right Side - Sign In Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative order-1 lg:order-2"
        >
          <div className="bg-white dark:bg-white rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-12">
            <div className="relative space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-neutral-900">
                  Welcome Back
                </h3>
                <p className="text-neutral-600">
                  Sign in to continue your journey
                </p>
              </div>

              <GoogleSignInButton />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
