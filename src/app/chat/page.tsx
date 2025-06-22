import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/main-layout";

export const metadata: Metadata = {
  title: "AI Chat - Advanced Conversational AI with Code Generation | Convocore",
  description: "Experience powerful AI conversations with advanced models including GPT-4 and Claude 3. Code generation, problem solving, creative writing, and more. Secure, fast, and intelligent AI chat platform powered by Web3.",
  keywords: [
    "AI chat",
    "conversational AI",
    "code generation",
    "AI assistant",
    "artificial intelligence",
    "smart chat",
    "AI conversation",
    "machine learning chat",
    "intelligent assistant",
    "AI help",
    "GPT-4 chat",
    "Claude 3 chat",
    "programming assistant",
    "code debugging",
    "Web3 AI"
  ],
  openGraph: {
    title: "Convocore AI Chat - Advanced Conversational AI with Code Generation",
    description: "Powerful AI conversations with GPT-4, Claude 3, and more. Code generation, problem solving, and creative assistance. Experience the future of AI chat with blockchain integration.",
    url: "https://convocore.site/chat",
    type: "website",
  },
  twitter: {
    title: "Convocore AI Chat - Advanced Conversational AI",
    description: "Advanced AI conversations with code generation, debugging, and intelligent assistance. Powered by GPT-4, Claude 3, and Web3 technology.",
  },
  alternates: {
    canonical: "/chat",
  },
};

export default function ChatPage() {
  return <MainLayout />;
} 