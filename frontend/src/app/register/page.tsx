"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Mail, Lock, User, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      toast.success("Account created!", { description: "Welcome to your workspace." });
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Registration failed:", err);
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to create account.";
      toast.error("Registration Error", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Top Header */}
      <header className="flex items-center justify-between p-4 sm:p-6 border-b border-border/40">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Register Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/60 shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Create an Account
            </CardTitle>
            <CardDescription className="text-sm">
              Get started with {siteConfig.name} today
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pl-9"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full gap-2 shadow-xs">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>Create Workspace Account</span>
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border/40 pt-4 text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline ml-1">
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-muted-foreground border-t border-border/40">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </footer>
    </div>
  );
}
