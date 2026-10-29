"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "./Icons";
import { store, type SafeUser } from "../lib/store";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: SafeUser) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === "login") {
        const res = await store.login(email, password);
        if (res.requiresVerification) {
          setMode("verify");
          setDebugOtp(res.debugCode || null);
          setSuccessMessage("Please enter the 6-digit verification code sent to your email.");
        } else {
          onAuthSuccess(res.user);
          onClose();
        }
      } else {
        const res = await store.register(email, password, displayName);
        if (res.requiresVerification) {
          setMode("verify");
          setDebugOtp(res.debugCode || null);
          setSuccessMessage("Account created! Check your email for the 6-digit activation code.");
        } else {
          onAuthSuccess(res.user);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verificationCode.trim();
    if (cleanCode.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await store.verifyEmail(email, cleanCode);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await store.resendVerificationCode(email);
      setSuccessMessage("A fresh 6-digit verification code has been sent!");
      if (res.debugCode) setDebugOtp(res.debugCode);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Account Authentication"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d1017]/95 p-6 shadow-2xl backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Icon name="music" size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {mode === "verify"
                  ? "Verify Your Email"
                  : mode === "login"
                  ? "Sign in to Musify"
                  : "Create Musify Account"}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {mode === "verify"
                  ? "Enter the 6-digit code to activate"
                  : mode === "login"
                  ? "Access your cloud music library"
                  : "Sync across devices & save playlists"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            disabled={isLoading}
            className="text-zinc-500 hover:text-white transition disabled:opacity-40"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Tab Toggle (Hidden during verification) */}
        {mode !== "verify" && (
          <div className="mt-4 flex rounded-xl bg-white/5 p-1 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              disabled={isLoading}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                mode === "login"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              disabled={isLoading}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                mode === "register"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Debug OTP Banner for Instant Testing */}
        {debugOtp && mode === "verify" && (
          <div className="mt-3 rounded-xl border border-indigo-500/30 bg-indigo-500/15 p-2.5 text-xs text-indigo-200 flex items-center justify-between">
            <span>
              Activation Code: <strong className="font-mono text-white text-sm tracking-widest">{debugOtp}</strong>
            </span>
            <button
              type="button"
              onClick={() => setVerificationCode(debugOtp)}
              className="text-[10px] underline hover:text-white font-medium"
            >
              Autofill
            </button>
          </div>
        )}

        {/* STEP 2: Email Verification (OTP) */}
        {mode === "verify" ? (
          <form onSubmit={handleVerifySubmit} className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-400">
                  6-Digit Verification Code
                </label>
                <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">
                  {email}
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                autoFocus
                disabled={isLoading}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center text-lg font-mono font-bold tracking-[6px] text-white outline-none focus:border-white/30 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-zinc-600 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-bold text-black shadow-lg shadow-white/10 transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                "Verify & Activate Account"
              )}
            </button>

            <div className="mt-3 flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-zinc-400 hover:text-white transition"
              >
                ← Back to Sign In
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition disabled:opacity-50"
              >
                Resend Code
              </button>
            </div>
          </form>
        ) : (
          /* STEP 1: Normal Login / Register Form */
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {mode === "register" && (
              <div>
                <label className="text-[11px] font-medium text-zinc-400">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex"
                  maxLength={50}
                  disabled={isLoading}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/30 placeholder:text-zinc-600 disabled:opacity-50"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-zinc-400">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/30 placeholder:text-zinc-600 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-400">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                disabled={isLoading}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/30 placeholder:text-zinc-600 disabled:opacity-50"
              />
            </div>

            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2.5 text-[11px] text-indigo-300 flex items-start gap-2">
              <span className="text-sm">🔒</span>
              <span>
                {mode === "register"
                  ? "Requires 6-digit email OTP verification. Your current guest favorites and playlists will automatically merge into your account."
                  : "Protected with Argon2id encryption and secure token verification."}
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || password.length < 8}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-bold text-black shadow-lg shadow-white/10 transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span>Authenticating...</span>
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Send Verification Code"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
