import { redirect } from 'next/navigation';

export default function ChatPage() {
  // Redirect /chat to /convocore to avoid duplication
  redirect('/convocore');
} 