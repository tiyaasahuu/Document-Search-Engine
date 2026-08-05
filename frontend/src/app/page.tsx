"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  FileText,
  Search,
  MessageSquareText,
  Zap,
  Cpu,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Landing Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-foreground">
              {siteConfig.name}
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#benefits" className="hover:text-foreground transition-colors">
              Benefits
            </a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">
              Testimonials
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild className="font-medium text-sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="gap-2 shadow-xs font-semibold text-sm">
              <Link href="/register">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 border-b border-border/40">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/80 text-xs font-semibold text-foreground border border-border/80 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>Next-Gen RAG & Research Intelligence Platform</span>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight sm:leading-none">
                Transform Complex Documents into{" "}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  Instant AI Insights
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Empower your engineering, research, and legal teams to search, summarize, and converse with thousands of documents simultaneously using high-precision vector intelligence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button size="lg" asChild className="w-full sm:w-auto gap-2 text-base h-12 px-8 font-semibold shadow-md">
                <Link href="/register">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto gap-2 text-base h-12 px-8 font-medium">
                <Link href="/dashboard">
                  <span>Explore Live Demo</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Product Preview Card Mockup */}
            <div className="pt-10 max-w-5xl mx-auto">
              <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-2xl backdrop-blur-xl">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-6 sm:p-8 space-y-6 text-left">
                  <div className="flex items-center justify-between border-b border-border/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                      <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                      <span className="text-xs font-mono text-muted-foreground ml-2">documind-ai // dashboard-preview</span>
                    </div>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>1,420,000 Vectors Indexed</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">Document Ingestion</span>
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-lg font-bold">128 PDFs & Papers</div>
                      <p className="text-xs text-muted-foreground">Structured parsing active</p>
                    </div>

                    <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">Semantic Search</span>
                        <Search className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-lg font-bold">1.2s Avg Latency</div>
                      <p className="text-xs text-muted-foreground">Sub-second citations</p>
                    </div>

                    <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">AI Intelligence</span>
                        <MessageSquareText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-lg font-bold">99.8% Accuracy</div>
                      <p className="text-xs text-muted-foreground">Verified source attribution</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 border-b border-border/40 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="outline" className="text-xs uppercase tracking-wider text-primary border-primary/30">
                Core Capabilities
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Everything You Need for Intelligent Research
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Engineered from the ground up for high throughput, precise information retrieval, and verifiable RAG workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/60 shadow-xs hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <FileText className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Multi-Format Document Vault</CardTitle>
                  <CardDescription>
                    Upload PDFs, research papers, legal briefs, and technical specifications with automatic OCR and layout retention.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/60 shadow-xs hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Search className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Hybrid Vector Search</CardTitle>
                  <CardDescription>
                    Combine dense vector embedding search with keyword BM25 retrieval for unmatched query precision.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/60 shadow-xs hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Multi-Document AI Chat</CardTitle>
                  <CardDescription>
                    Engage in conversational reasoning across multiple documents simultaneously with line-by-line citation references.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/60 shadow-xs hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Zap className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Instant Executive Summaries</CardTitle>
                  <CardDescription>
                    Generate key takeaway bullet points, methodology overviews, and executive briefings in seconds.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/60 shadow-xs hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Lock className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Enterprise Security & Privacy</CardTitle>
                  <CardDescription>
                    SOC2 compliant architecture ensuring zero data leakage and strict data isolation per workspace.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/60 shadow-xs hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">REST API & Integrations</CardTitle>
                  <CardDescription>
                    Seamlessly connect your existing backend data sources and automated pipelines via production REST endpoints.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 border-b border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="outline" className="text-xs uppercase tracking-wider text-primary border-primary/30">
                Simple Workflow
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                How Document & Research Intelligence Works
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Go from raw documents to actionable research insights in 3 effortless steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative p-6 rounded-2xl border border-border/60 bg-card space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg">
                  1
                </div>
                <h3 className="font-bold text-lg">Upload Documents</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Drop your PDFs, whitepapers, financial reports, or research studies into your secure workspace.
                </p>
              </div>

              <div className="relative p-6 rounded-2xl border border-border/60 bg-card space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg">
                  2
                </div>
                <h3 className="font-bold text-lg">Vector Indexing</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our neural engine chunks, embeds, and indexes your content into high-dimensional vector spaces.
                </p>
              </div>

              <div className="relative p-6 rounded-2xl border border-border/60 bg-card space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg">
                  3
                </div>
                <h3 className="font-bold text-lg">Query & Summarize</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask complex natural language questions and receive accurate answers backed by exact source citations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20 border-b border-border/40 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="text-xs uppercase tracking-wider text-primary border-primary/30">
                Proven Impact
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Designed for Teams Who Value Precision & Speed
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Eliminate manual keyword searches and document skimming. Experience a 10x acceleration in literature reviews and decision-making.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">10x Faster Literature Synthesis</h4>
                    <p className="text-xs text-muted-foreground">Synthesize hundreds of pages of technical data in minutes.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Zero Hallucination Tolerance</h4>
                    <p className="text-xs text-muted-foreground">Every statement is linked directly to exact page and paragraph sources.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Seamless Team Collaboration</h4>
                    <p className="text-xs text-muted-foreground">Share document collections and conversation histories across your organization.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl border border-border/80 bg-card shadow-xl space-y-6">
              <div className="flex items-center gap-4 border-b border-border/60 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Key Performance Metrics</h4>
                  <p className="text-xs text-muted-foreground">Benchmark data across 50+ research teams</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Research Speed Gain</span>
                    <span className="text-emerald-500">+85%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-emerald-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Citation Accuracy</span>
                    <span className="text-primary">99.8%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[99.8%] bg-primary rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Time Saved Per Project</span>
                    <span className="text-foreground">24 Hours / Week</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[78%] bg-foreground/80 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 border-b border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="outline" className="text-xs uppercase tracking-wider text-primary border-primary/30">
                User Feedback
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Trusted by Researchers & Leaders
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Discover how leading teams utilize our AI engine for high-stakes intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/60 shadow-xs">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm italic text-muted-foreground leading-relaxed">
                    &quot;Document Intelligence Engine cut our clinical trial review time in half. Being able to verify every single AI response with instant page citations is indispensable.&quot;
                  </p>
                  <div>
                    <h5 className="font-bold text-sm">Dr. Aris Thorne</h5>
                    <p className="text-xs text-muted-foreground">Lead Bio-Researcher at NovaLabs</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-xs">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm italic text-muted-foreground leading-relaxed">
                    &quot;We index thousands of legal filings every month. The hybrid vector search pinpointed exact clauses that standard search tools missed entirely.&quot;
                  </p>
                  <div>
                    <h5 className="font-bold text-sm">Elena Rostova</h5>
                    <p className="text-xs text-muted-foreground">Senior Partner at Apex Legal</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-xs">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm italic text-muted-foreground leading-relaxed">
                    &quot;The user interface is exceptionally clean and responsive. Our analysts were onboarding and extracting deep research summaries within 5 minutes.&quot;
                  </p>
                  <div>
                    <h5 className="font-bold text-sm">Marcus Vance</h5>
                    <p className="text-xs text-muted-foreground">Head of Intelligence at Quantum Capital</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 border-b border-border/40 bg-muted/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
            <div className="text-center space-y-3">
              <Badge variant="outline" className="text-xs uppercase tracking-wider text-primary border-primary/30">
                Frequently Asked Questions
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Got Questions? We Have Answers.
              </h2>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-3">
              <AccordionItem value="item-1" className="border border-border/60 bg-card rounded-xl px-4">
                <AccordionTrigger className="font-semibold text-sm sm:text-base hover:no-underline">
                  What document file types are supported?
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  We support PDF files, Word documents (.docx), plain text files (.txt), Markdown (.md), CSVs, and technical research papers. Optical Character Recognition (OCR) is automatically applied to scanned documents.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border border-border/60 bg-card rounded-xl px-4">
                <AccordionTrigger className="font-semibold text-sm sm:text-base hover:no-underline">
                  How does the AI prevent hallucinations?
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Our architecture enforces strict Retrieval-Augmented Generation (RAG) constraints. Every response is grounded exclusively in the provided document context, accompanied by verifiable citations.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border border-border/60 bg-card rounded-xl px-4">
                <AccordionTrigger className="font-semibold text-sm sm:text-base hover:no-underline">
                  Is my research data kept private and secure?
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Yes. Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). We never train foundation models on your private workspace data.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border border-border/60 bg-card rounded-xl px-4">
                <AccordionTrigger className="font-semibold text-sm sm:text-base hover:no-underline">
                  Can I try the platform before creating an account?
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Yes! You can click the &quot;Explore Live Demo&quot; button in the header or hero section to access the interactive dashboard immediately.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Ready to Supercharge Your Document Intelligence?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto text-base sm:text-lg">
              Join leading research teams and experience instant vector-powered analysis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto font-bold h-12 px-8 shadow-md">
                <Link href="/register">
                  <span>Get Started Now</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-12 px-8">
                <Link href="/login">Sign In to Workspace</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Landing Footer */}
      <footer className="w-full border-t border-border/60 bg-background px-4 py-8 sm:px-6 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-sm text-foreground">{siteConfig.name}</span>
          </div>
          <div>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
