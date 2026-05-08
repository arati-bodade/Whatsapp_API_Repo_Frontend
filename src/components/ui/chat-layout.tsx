"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  sidebar?: ReactNode;
  chatList?: ReactNode;
  conversation?: ReactNode;
  className?: string;
}

export function ChatLayout({ sidebar, chatList, conversation, className }: ChatLayoutProps) {
  return (
    <div className={cn("h-screen flex overflow-hidden bg-white", className)}>
      {/* Sidebar Navigation (fixed) */}
      {sidebar && (
        <div className="w-[260px] h-full flex flex-col bg-white border-r border-[#e9edef]">
          {sidebar}
        </div>
      )}

      {/* Chat Workspace (flex row) */}
      <div className="flex-1 flex flex-row">
        {/* Chat List Panel (fixed width) */}
        {chatList && (
          <div className="w-[340px] h-full flex flex-col bg-white border-r border-[#e9edef]">
            {chatList}
          </div>
        )}

        {/* Conversation Panel (flex column) */}
        {conversation && (
          <div className="flex-1 flex flex-col h-full bg-white">
            {conversation}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationPanelProps {
  header: ReactNode;
  messages: ReactNode;
  input: ReactNode;
  className?: string;
}

export function ConversationPanel({ header, messages, input, className }: ConversationPanelProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Conversation Header (fixed) */}
      <div className="shrink-0 h-[64px] flex items-center px-6 bg-[#00a884] border-b border-[#00a884]">
        {header}
      </div>

      {/* Messages Container (scrollable ONLY) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#efeae2]">
        {messages}
      </div>

      {/* Message Input Bar (fixed bottom) */}
      <div className="shrink-0 h-[80px] flex items-center px-6 bg-[#f0f2f5] border-t border-[#e9edef]">
        {input}
      </div>
    </div>
  );
}

interface ChatListPanelProps {
  header: ReactNode;
  search: ReactNode;
  list: ReactNode;
  className?: string;
}

export function ChatListPanel({ header, search, list, className }: ChatListPanelProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="shrink-0 h-[64px] flex items-center justify-between px-4 bg-[#00a884] border-b border-[#00a884]">
        {header}
      </div>

      {/* Search Bar (fixed) */}
      <div className="shrink-0 p-4 bg-white border-b border-[#e9edef]">
        {search}
      </div>

      {/* Chat List (scrollable) */}
      <div className="flex-1 overflow-y-auto bg-white">
        {list}
      </div>
    </div>
  );
}
