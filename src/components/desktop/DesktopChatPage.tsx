import React from 'react';
import { Suspense } from "react";
import { ChatPageContent } from '@/app/chat/page';

export default function DesktopChatPage() {
  return (
    <div className="hidden md:block">
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
        <ChatPageContent />
      </Suspense>
    </div>
  );
} 