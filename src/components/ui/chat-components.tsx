"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageBubbleProps {
  text: string;
  timestamp: string;
  isOutgoing: boolean;
  className?: string;
}

export function MessageBubble({ text, timestamp, isOutgoing, className }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-full flex",
        isOutgoing ? "justify-end" : "justify-start",
        className
      )}
    >
      <div
        className={cn(
          "relative max-w-md px-4 py-2 rounded-xl text-sm leading-[19px] transition-all",
          isOutgoing
            ? "bg-[#dcf8c6] text-[#111b21] rounded-tr-none ml-auto"
            : "bg-white text-[#111b21] rounded-tl-none border border-[#e9edef]"
        )}
      >
        <div className="px-1 pt-1 pb-4">
          {text}
        </div>

        {/* Timestamp & Status */}
        <div className="absolute right-3 bottom-1 flex items-center gap-1">
          <span className={cn("text-[11px] min-w-fit", isOutgoing ? "text-[#4fc3f7]" : "text-[#8696a0]")}>
            {timestamp}
          </span>
          {isOutgoing && (
            <span className="text-[#4fc3f7] ml-0.5">
              <CheckCheck className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface ChatListItemProps {
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isActive?: boolean;
  onClick?: () => void;
  avatar?: string;
  className?: string;
}

export function ChatListItem({
  name,
  lastMessage,
  timestamp,
  unreadCount = 0,
  isActive = false,
  onClick,
  avatar,
  className
}: ChatListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 mx-2 my-1",
        isActive
          ? "bg-[#f0f2f5] border border-[#00a884]"
          : "hover:bg-[#f0f2f5]",
        className
      )}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white font-semibold shrink-0">
        {avatar || name.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-semibold text-[14px] text-[#111b21] truncate">
            {name}
          </h3>
          <span className={cn("text-xs", unreadCount > 0 ? "text-[#00a884] font-medium" : "text-[#8696a0]")}>
            {timestamp}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-[#8696a0] truncate flex items-center gap-1">
            {lastMessage}
          </p>
          {unreadCount > 0 && (
            <span className="bg-[#00a884] text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full ml-2">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Emoji Data ───────────────────────────────────────────────
const EMOJI_CATEGORIES: { name: string; icon: string; emojis: string[] }[] = [
  {
    name: "Smileys",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
      "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢",
      "🫣", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥",
      "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴",
      "😷", "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯",
      "😎", "🥳", "🤠", "😈", "👿", "👹", "👺", "💀", "☠️", "👻",
      "👽", "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"
    ]
  },
  {
    name: "Gestures",
    icon: "👋",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌",
      "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉",
      "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛",
      "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "💪", "🦾",
      "🦿", "🦵", "🦶", "👂", "🦻", "👃", "👀", "👁️", "👅", "👄"
    ]
  },
  {
    name: "Hearts",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
      "💟", "♥️", "💌", "💋", "👄", "🫦", "💏", "💑", "👩‍❤️‍👨", "👨‍❤️‍👨"
    ]
  },
  {
    name: "Animals",
    icon: "🐶",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨",
      "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒",
      "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇",
      "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞"
    ]
  },
  {
    name: "Food",
    icon: "🍕",
    emojis: [
      "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈",
      "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🫒", "🥑", "🍕",
      "🍔", "🍟", "🌭", "🍿", "🧂", "🥚", "🍳", "🧈", "🥞", "🧇",
      "🍰", "🎂", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "☕", "🍵"
    ]
  },
  {
    name: "Travel",
    icon: "✈️",
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐",
      "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🚏", "🛤️",
      "✈️", "🛩️", "🚀", "🛸", "🚁", "⛵", "🚢", "🏠", "🏡", "🏢",
      "🏰", "🗼", "🗽", "⛪", "🕌", "🕍", "🏛️", "⛩️", "🌅", "🌄"
    ]
  },
  {
    name: "Objects",
    icon: "💡",
    emojis: [
      "⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "💾", "💿", "📀",
      "📷", "📹", "🎥", "📞", "☎️", "📺", "📻", "🎙️", "🎚️", "🎛️",
      "⏰", "⏳", "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🧯", "🛢️",
      "💰", "💵", "💴", "💶", "💷", "🪙", "💎", "⚖️", "🔧", "🔨"
    ]
  },
  {
    name: "Symbols",
    icon: "✅",
    emojis: [
      "✅", "❌", "❓", "❗", "‼️", "⁉️", "💯", "🔥", "✨", "⭐",
      "🌟", "💫", "⚡", "💥", "💢", "💦", "💨", "🕳️", "🔔", "🔕",
      "🎵", "🎶", "🎼", "🏳️", "🏴", "🚩", "🏁", "♻️", "✳️", "❇️",
      "⚠️", "🚸", "⛔", "🚫", "🚳", "🚭", "🚯", "🔞", "☢️", "☣️"
    ]
  }
];

// ─── Emoji Picker Component ──────────────────────────────────
function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Filter emojis by search (basic substring match on category name)
  const displayCategory = EMOJI_CATEGORIES[activeCategory];

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-2xl border border-[#e9edef] overflow-hidden z-50"
      style={{ width: "340px", maxHeight: "380px" }}
    >
      {/* Category Tabs */}
      <div className="flex items-center gap-0.5 px-2 py-2 border-b border-[#e9edef] bg-[#f0f2f5] overflow-x-auto">
        {EMOJI_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(idx)}
            title={cat.name}
            className={cn(
              "flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all duration-150",
              activeCategory === idx
                ? "bg-[#00a884] shadow-md scale-110"
                : "hover:bg-white/80"
            )}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* Category Label */}
      <div className="px-3 pt-2 pb-1">
        <span className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider">
          {displayCategory.name}
        </span>
      </div>

      {/* Emoji Grid */}
      <div className="px-2 pb-3 overflow-y-auto" style={{ maxHeight: "280px" }}>
        <div className="grid grid-cols-8 gap-0.5">
          {displayCategory.emojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => onSelect(emoji)}
              className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-[#f0f2f5] active:scale-90 transition-all duration-100 cursor-pointer"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Message Input ───────────────────────────────────────────
interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function MessageInput({ value, onChange, onSend, placeholder = "Type a message", className }: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEmojiSelect = (emoji: string) => {
    // Insert emoji at cursor position (or end)
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      const newValue = value.slice(0, start) + emoji + value.slice(end);
      onChange(newValue);
      // Restore cursor position after emoji
      setTimeout(() => {
        input.focus();
        const pos = start + emoji.length;
        input.setSelectionRange(pos, pos);
      }, 0);
    } else {
      onChange(value + emoji);
    }
  };

  return (
    <div className={cn("flex items-center gap-3 w-full relative", className)}>
      {/* Emoji Picker Popup */}
      <AnimatePresence>
        {showEmojiPicker && (
          <EmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* Emoji Button */}
      <button
        onClick={() => setShowEmojiPicker(prev => !prev)}
        className={cn(
          "transition-all duration-200 p-2 rounded-full",
          showEmojiPicker
            ? "text-[#00a884] bg-[#e7fce3]"
            : "text-[#8696a0] hover:text-[#111b21] hover:bg-[#f0f2f5]"
        )}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Input Field */}
      <div className="flex-1 bg-white border border-[#e9edef] rounded-full px-4 py-3 outline-none focus-within:ring-2 focus-within:ring-[#00a884] transition-all duration-200">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              onSend(value);
              setShowEmojiPicker(false);
            }
          }}
          placeholder={placeholder}
          className="bg-transparent border-none outline-none text-[#111b21] placeholder:text-[#8696a0] w-full h-full"
        />
      </div>

      {/* Send Button */}
      {value.trim() ? (
        <button
          onClick={() => { onSend(value); setShowEmojiPicker(false); }}
          className="px-6 py-3 rounded-full bg-[#00a884] hover:bg-[#008069] text-white font-medium transition-all duration-200"
        >
          Send
        </button>
      ) : (
        <button className="text-[#8696a0] hover:text-[#111b21] hover:bg-[#f0f2f5] transition-all duration-200 p-2 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      )}
    </div>
  );
}
