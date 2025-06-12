"use client";

import { Send } from "lucide-react";
import React, { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "메시지를 입력하세요...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const handleSendMessage = () => {
    if (message.trim() === "" || disabled) {
      return;
    }

    onSendMessage(message);
    setMessage("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        className="flex-1"
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        ref={inputRef}
        placeholder={placeholder}
        disabled={disabled}
      />
      <Button
        onClick={handleSendMessage}
        disabled={!message.trim() || disabled || isComposing}
        size="icon"
        className="shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
