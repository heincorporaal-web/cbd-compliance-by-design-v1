import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, Loader2, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";

const AGENT_NAME = "sod_violation_finder";

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={`max-w-[85%] rounded-lg px-3 py-2 ${isUser ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"}`}>
        {message.content && (
          isUser
            ? <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            : <ReactMarkdown className="text-sm prose prose-sm max-w-none">{message.content}</ReactMarkdown>
        )}
        {message.tool_calls?.map((tc, idx) => {
          const failed = tc.status === "failed" || tc.status === "error";
          return (
            <div key={idx} className="mt-2 text-xs border border-slate-200 rounded p-2 bg-white">
              <div className="flex items-center gap-1.5">
                {failed
                  ? <Loader2 className="w-3 h-3 text-red-500" />
                  : tc.status === "completed" || tc.status === "success"
                    ? <ShieldAlert className="w-3 h-3 text-green-500" />
                    : <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                }
                <span className="font-medium text-slate-600">
                  {tc.name || "tool"} — {tc.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SodAgentChat({ open, onClose, processContext }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const scrollRef = useRef(null);

  // Create or reuse a conversation when the dialog opens
  useEffect(() => {
    if (!open) return;
    if (conversation) return;
    setCreating(true);
    (async () => {
      try {
        const existing = await base44.agents.listConversations({ agent_name: AGENT_NAME });
        if (existing && existing.length > 0) {
          const conv = await base44.agents.getConversation(existing[0].id);
          setConversation(conv);
          setMessages(conv.messages || []);
        } else {
          const meta = {
            name: "SOD Violation Finder",
            description: "Segregation of Duties analysis",
          };
          if (processContext) {
            meta.process_id = processContext.processId;
            meta.process_name = processContext.processName;
            meta.company_id = processContext.companyId;
          }
          const conv = await base44.agents.createConversation({ agent_name: AGENT_NAME, metadata: meta });
          setConversation(conv);
          setMessages([]);
        }
      } catch {
      } finally {
        setCreating(false);
      }
    })();
  }, [open]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !conversation || loading) return;
    const msg = input.trim();
    setInput("");
    setLoading(true);
    try {
      const updated = await base44.agents.addMessage(conversation, { role: "user", content: msg });
      setMessages(updated.messages || [...messages, { role: "user", content: msg }]);
    } catch {
      setLoading(false);
    }
  }, [input, conversation, loading, messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedPrompts = [
    "Scan the current process for SOD violations",
    processContext?.processId
      ? `Analyze process ${processContext.processCode || ""} for segregation of duties issues`
      : "What SOD patterns should I look for?",
    "Explain the Preparer/Approver conflict pattern",
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            SOD Violation Finder Agent
            <Badge variant="secondary" className="text-xs">OBD</Badge>
          </DialogTitle>
        </DialogHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-2 min-h-[300px] max-h-[50vh]">
          {creating ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Starting conversation…
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <ShieldAlert className="w-10 h-10 mx-auto text-indigo-300" />
              <p className="text-sm text-slate-500">
                Ask me to analyse your process steps for Segregation of Duties violations.
                I can identify incompatible duty pairs and add them to your Process Step Conflicts.
              </p>
              <div className="flex flex-col gap-1.5 items-center">
                {suggestedPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(p)}
                    className="text-xs text-indigo-600 hover:underline max-w-md text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => <MessageBubble key={idx} message={m} />)
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-200">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about SOD violations…"
            disabled={loading || creating}
          />
          <Button onClick={handleSend} disabled={!input.trim() || loading || creating} className="gap-1.5">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}