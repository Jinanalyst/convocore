import { AIInputDemo } from "@/components/blocks/ai-input-demo";
import { ConvoAILogo } from "@/components/ui/convo-ai-logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <ConvoAILogo />
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/chat">Chat</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button asChild>
              <Link href="/chat">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Demo Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AI Input Component Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience our advanced AI input component with auto-resizing textarea, 
            model selection, and modern UI design.
          </p>
        </div>

        {/* Demo Container */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Try the AI Input Component
            </h2>
            
            <AIInputDemo 
              onSubmit={(message, model) => {
                alert(`Message: "${message}"\nModel: ${model}\n\nThis is a demo - in production this would send to your AI service.`);
              }}
              placeholder="Type your message here... Try typing a long message to see auto-resize!"
            />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Auto-Resize Textarea
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                The textarea automatically adjusts its height as you type, providing a smooth user experience.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Model Selection
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Choose from multiple AI models including GPT-4, Claude 3, and Gemini Pro with a clean dropdown interface.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Keyboard Shortcuts
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Use Ctrl+Enter (or Cmd+Enter on Mac) to quickly submit messages without clicking the send button.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Tool Integration
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Built-in buttons for file attachments, voice input, and web search functionality.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Modern Design
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Clean, minimalist design that works perfectly in both light and dark themes.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                TypeScript Ready
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Fully typed with TypeScript for better development experience and type safety.
              </p>
            </div>
          </div>

          {/* Integration Note */}
          <div className="mt-12 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Integration Complete ✅
            </h3>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              The AI Input component has been successfully integrated into your ConvoAI platform. 
              It&apos;s now being used in the chat interface with full model selection and TRON payment integration.
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/chat">Try Live Chat</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 