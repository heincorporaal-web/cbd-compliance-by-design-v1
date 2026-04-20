import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bot, Send, Loader2, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";

export default function FrameworkControlMapper() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState("");
  const messagesEndRef = useRef(null);

  const { data: frameworks = [] } = useQuery({
    queryKey: ["frameworks"],
    queryFn: () => base44.entities.Framework.list(),
  });

  // Initialize conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      const conv = await base44.agents.createConversation({
        agent_name: "framework_control_mapper",
        metadata: { name: "Framework → Control Mapping Session" },
      });
      setConversation(conv);
    };
    initConversation();
  }, []);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      // Stop loading when assistant last message has content
      const lastMsg = data.messages?.[data.messages.length - 1];
      if (lastMsg?.role === "assistant" && lastMsg?.content) {
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, [conversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || !conversation || isLoading) return;
    setIsLoading(true);
    setInput("");
    await base44.agents.addMessage(conversation, { role: "user", content: text });
  };

  const analyzeFramework = () => {
    const framework = frameworks.find(f => f.id === selectedFrameworkId);
    if (!framework) return;
    const prompt = `Please analyze the framework "${framework.name}" (category: ${framework.category || "N/A"}, description: "${framework.description || "No description provided"}") and map it to existing controls. Show me which controls are a strong, partial, or weak match and explain your reasoning.`;
    sendMessage(prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const visibleMessages = messages.filter(m => m.role !== "system");

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Frameworks")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Framework → Control Mapper</h1>
            <p className="text-slate-500 text-sm">AI-powered mapping of framework content to existing controls</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: quick-start */}
        <div className="space-y-4">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                Quick Analyze
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-slate-500">Select a framework to instantly start a mapping analysis.</p>
              <Select value={selectedFrameworkId} onValueChange={setSelectedFrameworkId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a framework..." />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      <div className="flex flex-col">
                        <span>{f.name}</span>
                        {f.category && <span className="text-xs text-slate-400">{f.category.replace(/_/g, " ")}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={analyzeFramework}
                disabled={!selectedFrameworkId || isLoading || !conversation}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze & Map
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Suggested Prompts</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {[
                "List all controls that match ISO 27001",
                "Which controls have no framework assigned?",
                "Map all security controls to relevant frameworks",
                "Find controls that overlap between frameworks",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading || !conversation}
                  className="w-full text-left text-xs text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right panel: chat */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-lg flex flex-col" style={{ height: "70vh" }}>
            <CardHeader className="border-b border-slate-100 pb-3 shrink-0">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-600" />
                AI Mapping Assistant
                {isLoading && (
                  <Badge variant="outline" className="text-xs text-violet-600 border-violet-200 bg-violet-50 ml-auto">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing...
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {visibleMessages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-3">
                  <Sparkles className="w-10 h-10 text-indigo-200" />
                  <p className="text-sm font-medium">Ready to map frameworks to controls</p>
                  <p className="text-xs">Select a framework on the left or type your question below.</p>
                </div>
              )}

              {visibleMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-slate-800 text-white"
                      : "bg-white border border-slate-200 text-slate-800"
                  }`}>
                    {msg.role === "user" ? (
                      <p>{msg.content}</p>
                    ) : (
                      <ReactMarkdown
                        className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                        components={{
                          p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="my-0.5">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                          h3: ({ children }) => <h3 className="font-semibold text-slate-900 my-2">{children}</h3>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                    {msg.tool_calls?.filter(tc => tc.status === "completed").map((tc, j) => (
                      <div key={j} className="mt-1 text-xs text-slate-400 italic">
                        ✓ {tc.name?.split(".").reverse().join(" ")}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {isLoading && visibleMessages[visibleMessages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-2 shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="border-t border-slate-100 p-4 shrink-0">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about framework-control mappings..."
                  rows={2}
                  disabled={isLoading || !conversation}
                  className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading || !conversation}
                  className="bg-indigo-600 hover:bg-indigo-700 self-end"
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}