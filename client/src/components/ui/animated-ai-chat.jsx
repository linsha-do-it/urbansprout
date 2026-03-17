import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Leaf,
  Home,
  Sun,
  Sparkles,
  SendIcon,
  LoaderIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import { apiCall } from "@/utils/api";

function useAutoResizeTextarea({ minHeight, maxHeight }) {
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(
    (reset) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

const commandSuggestions = [
  {
    icon: <Leaf className="w-4 h-4" />,
    label: "Beginner tips",
    description: "Easy plants to start with",
    prefix: "/beginner",
    message: "I'm a beginner, help me start",
  },
  {
    icon: <Home className="w-4 h-4" />,
    label: "Container plants",
    description: "Grow in small spaces",
    prefix: "/container",
    message: "Show me container-friendly vegetables",
  },
  {
    icon: <Sun className="w-4 h-4" />,
    label: "Fast growing",
    description: "Quick harvest varieties",
    prefix: "/fast",
    message: "Tell me about fast-growing varieties",
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    label: "Fruit varieties",
    description: "Fruits you can grow in pots",
    prefix: "/fruits",
    message: "What fruits can I grow in pots?",
  },
];

const Textarea = React.forwardRef(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing
              ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {showRing && isFocused && (
          <motion.span
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-emerald-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-emerald-500 rounded-full"
            style={{ animation: "none" }}
            id="textarea-ripple"
          />
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

function TypingDots() {
  return (
    <div className="flex items-center ml-1">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 0.9, 0.3],
            scale: [0.85, 1.1, 0.85],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: "easeInOut",
          }}
          style={{ boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)" }}
        />
      ))}
    </div>
  );
}

export function AnimatedAIChat({ user, onAddToGarden }) {
  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [recentCommand, setRecentCommand] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef(null);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });
  const [inputFocused, setInputFocused] = useState(false);
  const commandPaletteRef = useRef(null);

  const messagesListRef = useRef(null);
  useEffect(() => {
    if (messages.length === 0) return;
    // Scroll only the message list container, not the window
    const listEl = messagesListRef.current;
    if (listEl) {
      listEl.scrollTop = listEl.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);

  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommandPalette(true);
      const idx = commandSuggestions.findIndex((cmd) =>
        cmd.prefix.startsWith(value)
      );
      setActiveSuggestion(idx >= 0 ? idx : -1);
    } else {
      setShowCommandPalette(false);
    }
  }, [value]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(event.target)
      ) {
        setShowCommandPalette(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sendToApi = async (messageText) => {
    try {
      const response = await apiCall("/chatbot", {
        method: "POST",
        body: JSON.stringify({ message: messageText, userId: sessionId }),
      });
      if (response.success) {
        return {
          content: response.data.message,
          buttons: response.data.buttons || [],
          plants: response.data.plants || [],
          storeItems: response.data.storeItems || [],
        };
      }
      return {
        content:
          response.message ||
          "I'd love to help you discover plants! Try asking about container veggies or beginner plants.",
        buttons: ["I'm a beginner, help me start", "Show container plants"],
      };
    } catch (err) {
      console.error("Chatbot error:", err);
      return {
        content:
          "I'm having a little trouble connecting. Try asking about 'container tomatoes', 'dwarf fruit trees', or 'fast-growing lettuce'!",
        buttons: ["Try again", "Beginner tips"],
      };
    }
  };

  const handleSendMessage = () => {
    const text = value.trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      type: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setValue("");
    adjustHeight(true);
    setIsTyping(true);

    startTransition(async () => {
      const result = await sendToApi(text);
      const botMsg = {
        id: Date.now() + 1,
        type: "bot",
        content: result.content,
        timestamp: new Date(),
        buttons: result.buttons,
        plants: result.plants,
        storeItems: result.storeItems,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    });
  };

  const handleKeyDown = (e) => {
    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev < commandSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev > 0 ? prev - 1 : commandSuggestions.length - 1
        );
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const cmd = commandSuggestions[activeSuggestion];
          setShowCommandPalette(false);
          setRecentCommand(cmd.label);
          setTimeout(() => setRecentCommand(null), 3500);
          if (cmd.message) {
            handleQuickReply(cmd.message);
          } else {
            setValue(cmd.prefix + " ");
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) handleSendMessage();
    }
  };

  const selectCommandSuggestion = (index) => {
    const cmd = commandSuggestions[index];
    setShowCommandPalette(false);
    setRecentCommand(cmd.label);
    setTimeout(() => setRecentCommand(null), 2000);
    if (cmd.message) {
      handleQuickReply(cmd.message);
    } else {
      setValue(cmd.prefix + " ");
    }
  };

  const handleQuickReply = (text) => {
    setValue(text);
    adjustHeight(true);
    const userMsg = {
      id: Date.now(),
      type: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setValue(""); // clear so input shows empty after sending
    sendToApi(text).then((result) => {
      const botMsg = {
        id: Date.now() + 1,
        type: "bot",
        content: result.content,
        timestamp: new Date(),
        buttons: result.buttons,
        plants: result.plants,
        storeItems: result.storeItems,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    });
  };

  return (
    <div className="min-h-[70vh] flex flex-col w-full items-center justify-center bg-transparent text-white p-6 relative overflow-hidden lab-bg">
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-lime-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-2xl mx-auto relative flex flex-col flex-1">
        <motion.div
          className="relative z-10 space-y-2 flex-1 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="text-center space-y-2 mb-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/95 to-white/50 pb-0.5">
                How can I help you grow today?
              </h2>
              <motion.div
                className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </motion.div>
            <motion.p
              className="text-sm text-white/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Ask Sprouty about plants, containers, or growing tips
            </motion.p>
          </div>

          {/* Message list */}
          <div ref={messagesListRef} className="flex-1 overflow-y-auto min-h-[120px] max-h-[280px] space-y-3 pr-2">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-2 rounded-2xl text-sm",
                      msg.type === "user"
                        ? "bg-white/20 text-white rounded-br-md"
                        : "bg-white/[0.08] text-white/90 rounded-bl-md border border-white/10"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.buttons && msg.buttons.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {msg.buttons.slice(0, 4).map((btn, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleQuickReply(btn)}
                            className="text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    )}
                    {msg.plants && msg.plants.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.plants.slice(0, 3).map((plant, i) => (
                          <div
                            key={i}
                            className="text-xs flex items-center justify-between gap-2 bg-white/5 rounded-lg px-2 py-1"
                          >
                            <span className="truncate">{plant.name}</span>
                            {onAddToGarden && (
                              <button
                                type="button"
                                onClick={() => onAddToGarden(plant)}
                                className="shrink-0 text-emerald-300 hover:text-emerald-200"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="px-4 py-2 rounded-2xl rounded-bl-md bg-white/[0.08] border border-white/10 flex items-center gap-2">
                  <span className="text-xs text-white/60">Sprouty</span>
                  <TypingDots />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <motion.div
            className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence>
              {showCommandPalette && (
                <motion.div
                  ref={commandPaletteRef}
                  className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="py-1 bg-black/95">
                    {commandSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.prefix}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                          activeSuggestion === index
                            ? "bg-white/10 text-white"
                            : "text-white/70 hover:bg-white/5"
                        )}
                        onClick={() => selectCommandSuggestion(index)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <div className="w-5 h-5 flex items-center justify-center text-white/60">
                          {suggestion.icon}
                        </div>
                        <div className="font-medium">{suggestion.label}</div>
                        <div className="text-white/40 text-xs ml-1">
                          {suggestion.prefix}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Ask Sprouty about plants..."
                containerClassName="w-full"
                className={cn(
                  "w-full px-4 py-3",
                  "resize-none",
                  "bg-transparent",
                  "border-none",
                  "text-white/90 text-sm",
                  "focus:outline-none",
                  "placeholder:text-white/20",
                  "min-h-[60px]"
                )}
                style={{ overflow: "hidden" }}
                showRing={false}
              />
            </div>

            <div className="p-4 border-t border-white/[0.05] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3" />

              <motion.button
                type="button"
                onClick={handleSendMessage}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={isTyping || !value.trim()}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  "flex items-center gap-2",
                  value.trim()
                    ? "bg-white text-gray-900 shadow-lg shadow-white/10"
                    : "bg-white/[0.05] text-white/40"
                )}
              >
                {isTyping ? (
                  <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
                <span>Send</span>
              </motion.button>
            </div>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {commandSuggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.prefix}
                type="button"
                onClick={() => handleQuickReply(suggestion.message)}
                className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg text-sm text-white/60 hover:text-white/90 transition-all relative group"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {suggestion.icon}
                <span>{suggestion.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {inputFocused && (
        <motion.div
          className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500 blur-[96px]"
          animate={{
            x: mousePosition.x - 400,
            y: mousePosition.y - 400,
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 150,
            mass: 0.5,
          }}
        />
      )}
    </div>
  );
}
