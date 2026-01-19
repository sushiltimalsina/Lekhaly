"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Zap, Shield } from "lucide-react";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between overflow-hidden">
            {/* Hero Section */}
            <section className="w-full flex flex-col items-center justify-center pt-32 pb-20 px-4 relative z-10">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px]" />
                    <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-4xl"
                >
                    <h1 className="text-6xl font-bold tracking-tight mb-6">
                        Build Faster with <br />
                        <span className="text-gradient">Premium Experience</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                        The ultimate platform for modern developers. Experience the power of
                        Next.js combined with a sleek, high-performance UI.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/login"
                            className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/25"
                        >
                            Get Started <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="#features"
                            className="px-8 py-4 bg-secondary/80 backdrop-blur-sm text-secondary-foreground rounded-full font-medium hover:bg-secondary/100 transition-all border border-white/10"
                        >
                            Learn More
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="w-full py-24 px-6 md:px-20 relative">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {[
                            {
                                icon: <Zap className="w-8 h-8 text-yellow-500" />,
                                title: "Lightning Fast",
                                description:
                                    "Built on Next.js 14 for unparalleled performance and speed.",
                            },
                            {
                                icon: <Shield className="w-8 h-8 text-green-500" />,
                                title: "Secure by Default",
                                description:
                                    "Enterprise-grade security measures baked into every component.",
                            },
                            {
                                icon: <CheckCircle2 className="w-8 h-8 text-blue-500" />,
                                title: "Pixel Perfect",
                                description:
                                    "Meticulously crafted UI components that look great on any device.",
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="glass-panel p-8 rounded-2xl hover:translate-y-[-5px] transition-transform duration-300"
                            >
                                <div className="mb-6 p-4 bg-background/50 rounded-xl w-fit">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full py-10 border-t border-white/10 text-center text-muted-foreground">
                <p>© 2026 Lekhaly. All rights reserved.</p>
            </footer>
        </main>
    );
}
