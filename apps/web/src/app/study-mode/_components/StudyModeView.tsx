"use client";

import {
  ArrowLeft,
  Bot,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  GitBranch,
  GraduationCap,
  Layers3,
  Lightbulb,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelRightClose,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import MindMapCanvas from "./MindMapCanvas";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: number;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface Flashcard {
  id: string;
  type: "concept" | "term" | "question";
  front: string;
  back: string;
}

export interface KeyTakeaway {
  id: string;
  text: string;
}

export interface StudyTask {
  id: string;
  title: string;
  status: "pending" | "active" | "done";
}

const CONVERSATIONS_KEY = "study-mode-conversations";
const ACTIVE_TOPIC_KEY = "study-mode-active-topic";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const initialFlashcards: Flashcard[] = [
  {
    id: "flash-1",
    type: "concept",
    front: "Active recall",
    back: "Testing yourself from memory, then correcting gaps, builds stronger retention than rereading.",
  },
  {
    id: "flash-2",
    type: "term",
    front: "Pomodoro reset",
    back: "A short break after a focused sprint that protects attention and reduces fatigue.",
  },
  {
    id: "flash-3",
    type: "question",
    front: "What makes a study task actionable?",
    back: "It has a clear verb, a visible output, and a small enough scope to finish in one session.",
  },
];

const initialTakeaways: KeyTakeaway[] = [
  { id: "take-1", text: "Start with one narrow topic before expanding into examples." },
  { id: "take-2", text: "Convert vague goals into tasks with a visible finish line." },
  { id: "take-3", text: "Use quick quizzes to reveal what needs another pass." },
];

const initialTasks: StudyTask[] = [
  { id: "task-1", title: "Define the main concept", status: "done" },
  { id: "task-2", title: "Ask for a plain-language explanation", status: "active" },
  { id: "task-3", title: "Create five recall questions", status: "pending" },
  { id: "task-4", title: "Review flashcards", status: "pending" },
];

const quickActions = [
  { label: "Explain this topic", icon: Lightbulb },
  { label: "Quiz me", icon: GraduationCap },
  { label: "Break this into tasks", icon: Layers3 },
  { label: "Create flashcards", icon: Sparkles },
] as const;

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMockResponse(message: string, topic: string) {
  const subject = topic.trim() || "your current study goal";
  return [
    `Here is a focused study pass for **${subject}**.`,
    "",
    `1. Start by writing the core idea in one sentence: ${message.slice(0, 120) || "what you want to learn"}.`,
    "2. Split it into one concept to understand, one example to practice, and one recall question to answer without notes.",
    "3. Use a 25-minute sprint, then mark one task as done before adding more work.",
    "",
    "**Next move:** ask me to quiz you or turn this into flashcards.",
  ].join("\n");
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function loadConversations() {
  try {
    const raw = window.localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function titleFromMessages(messages: ChatMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  if (!firstUserMessage) return "New Study Session";
  return firstUserMessage.content.replace(/\s+/g, " ").slice(0, 48) || "Attached study files";
}

function groupConversations(conversations: Conversation[]) {
  const groups: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfPreviousWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

  for (const conversation of conversations) {
    if (conversation.updatedAt >= startOfToday) {
      groups.Today.push(conversation);
    } else if (conversation.updatedAt >= startOfYesterday) {
      groups.Yesterday.push(conversation);
    } else if (conversation.updatedAt >= startOfPreviousWeek) {
      groups["Previous 7 Days"].push(conversation);
    } else {
      groups.Older.push(conversation);
    }
  }

  return groups;
}

export default function StudyModeView() {
  const router = useRouter();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [viewMode, setViewMode] = useState<"chat" | "mindmap">("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [knowledgeRailOpen, setKnowledgeRailOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [masteryProgress, setMasteryProgress] = useState(42);
  const [energyLevel, setEnergyLevel] = useState(84);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [flashcards] = useState<Flashcard[]>(initialFlashcards);
  const [takeaways] = useState<KeyTakeaway[]>(initialTakeaways);
  const [tasks, setTasks] = useState<StudyTask[]>(initialTasks);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [mindMapGenerated, setMindMapGenerated] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loadedConversations = loadConversations().sort((a, b) => b.updatedAt - a.updatedAt);
    const savedTopic = window.localStorage.getItem(ACTIVE_TOPIC_KEY) ?? "";

    setConversations(loadedConversations);
    setActiveTopic(savedTopic);
    if (loadedConversations[0]) {
      setCurrentConversationId(loadedConversations[0].id);
      setMessages(loadedConversations[0].messages);
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  }, [conversations, hasLoaded]);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(ACTIVE_TOPIC_KEY, activeTopic);
  }, [activeTopic, hasLoaded]);

  useEffect(() => {
    if (!currentConversationId) return;
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === currentConversationId
          ? {
              ...conversation,
              messages,
              title: titleFromMessages(messages),
              updatedAt: Date.now(),
            }
          : conversation,
      ),
    );
  }, [currentConversationId, messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
  }, [input]);

  const groupedConversations = useMemo(
    () => groupConversations(conversations),
    [conversations],
  );

  const currentFlashcard = flashcards[currentCardIndex];

  const startNewSession = useCallback(() => {
    const newConversation: Conversation = {
      id: createId("conversation"),
      title: "New Study Session",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((previous) => [newConversation, ...previous]);
    setCurrentConversationId(newConversation.id);
    setMessages([]);
    setAttachments([]);
    setInput("");
  }, []);

  const selectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
    setMessages(conversation.messages);
  }, []);

  const deleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((previous) => previous.filter((item) => item.id !== conversationId));
      if (conversationId === currentConversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    },
    [currentConversationId],
  );

  const ensureConversation = useCallback(() => {
    if (currentConversationId) return currentConversationId;
    const newConversation: Conversation = {
      id: createId("conversation"),
      title: "New Study Session",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((previous) => [newConversation, ...previous]);
    setCurrentConversationId(newConversation.id);
    return newConversation.id;
  }, [currentConversationId]);

  const updateTasksForPrompt = useCallback((prompt: string) => {
    const normalizedPrompt = prompt.toLowerCase();
    if (normalizedPrompt.includes("task") || normalizedPrompt.includes("break")) {
      setTasks((previous) =>
        previous.map((task, index) => ({
          ...task,
          status: index === 0 ? "done" : index === 1 ? "active" : "pending",
        })),
      );
      setMindMapGenerated(true);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if ((!trimmedInput && attachments.length === 0) || isLoading) return;

    ensureConversation();
    const outgoingAttachments = attachments;
    const userMessage: ChatMessage = {
      id: createId("message"),
      role: "user",
      content:
        trimmedInput ||
        `Attached ${outgoingAttachments.length} file${outgoingAttachments.length === 1 ? "" : "s"} for study help.`,
      createdAt: Date.now(),
      attachments: outgoingAttachments.length ? outgoingAttachments : undefined,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setAttachments([]);
    setAttachmentError(null);
    setIsLoading(true);

    let aiContent = createMockResponse(userMessage.content, activeTopic);
    try {
      const response = await fetch("/api/chat-productive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: nextMessages,
          topic: activeTopic,
          attachments: outgoingAttachments,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { message?: string };
        if (data.message) aiContent = data.message;
      }
    } catch {
      aiContent = createMockResponse(userMessage.content, activeTopic);
    }

    const aiMessage: ChatMessage = {
      id: createId("message"),
      role: "ai",
      content: aiContent,
      createdAt: Date.now(),
    };

    setMessages((previous) => [...previous, aiMessage]);
    setMasteryProgress((previous) => Math.min(previous + 4, 100));
    setEnergyLevel((previous) => Math.max(previous - 2, 35));
    updateTasksForPrompt(userMessage.content);
    setIsLoading(false);
  }, [
    activeTopic,
    attachments,
    ensureConversation,
    input,
    isLoading,
    messages,
    updateTasksForPrompt,
  ]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setAttachmentError(`${oversized.name} is larger than 10MB.`);
      event.target.value = "";
      return;
    }

    setAttachments((previous) => [
      ...previous,
      ...files.map((file) => ({
        id: createId("attachment"),
        name: file.name,
        size: file.size,
        type: file.type || "unknown",
        lastModified: file.lastModified,
      })),
    ]);
    setAttachmentError(null);
    event.target.value = "";
  };

  const generateMindMap = () => {
    const source = activeTopic.trim() || messages.at(-1)?.content || "Study plan";
    const generatedTasks: StudyTask[] = [
      { id: createId("task"), title: `Map ${source.slice(0, 24)}`, status: "active" },
      { id: createId("task"), title: "List sub-concepts", status: "pending" },
      { id: createId("task"), title: "Add practice examples", status: "pending" },
      { id: createId("task"), title: "Schedule review pass", status: "pending" },
    ];
    setTasks(generatedTasks);
    setMindMapGenerated(true);
    setViewMode("mindmap");
  };

  const completeReview = () => {
    setShowReviewModal(false);
    setCurrentCardIndex(0);
    setMasteryProgress((previous) => Math.min(previous + 8, 100));
    setTasks((previous) =>
      previous.map((task) =>
        task.title.toLowerCase().includes("flashcard") ? { ...task, status: "done" } : task,
      ),
    );
  };

  return (
    <div className="h-full min-h-0 overflow-hidden bg-[#111722] text-white">
      <div className="flex h-full min-h-0 overflow-hidden">
        <AnimatePresence initial={false}>
          {sidebarOpen ? (
            <motion.aside
              key="left-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 292, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden h-full shrink-0 overflow-hidden border-r border-[#232f48] bg-[#111722]/95 shadow-2xl shadow-black/20 backdrop-blur md:flex md:flex-col"
            >
              <div className="flex items-center justify-between border-b border-[#232f48] p-4">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                  aria-label="Collapse session sidebar"
                >
                  <PanelLeftClose size={19} />
                </button>
                <button
                  type="button"
                  onClick={startNewSession}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-[0_0_22px_rgba(19,91,236,0.35)] transition hover:bg-blue-500"
                >
                  <Plus size={16} />
                  New
                </button>
              </div>

              <div className="space-y-3 border-b border-[#232f48] p-4">
                <div className="rounded-2xl border border-[#232f48] bg-[#1a2332] p-4">
                  <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                    <span className="text-[#92a4c9]">Mental Energy</span>
                    <span className="text-emerald-300">{energyLevel}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#111722]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.45)]"
                      style={{ width: `${energyLevel}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-[#556987]">Optimal for a focused study sprint</p>
                </div>

                <div className="rounded-2xl border border-[#232f48] bg-[#1a2332] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#92a4c9]">
                        Focus Session
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">21:40</p>
                    </div>
                    <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300">
                      <Clock3 size={20} />
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-[#111722]">
                    <div className="h-1.5 w-[62%] rounded-full bg-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {Object.entries(groupedConversations).map(([group, items]) =>
                  items.length ? (
                    <div key={group} className="mb-4">
                      <h3 className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#556987]">
                        {group}
                      </h3>
                      <div className="space-y-1">
                        {items.map((conversation) => (
                          <button
                            type="button"
                            key={conversation.id}
                            onClick={() => selectConversation(conversation)}
                            className={`group flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                              conversation.id === currentConversationId
                                ? "border-blue-500/40 bg-blue-600/12 text-white"
                                : "border-transparent text-[#92a4c9] hover:border-[#232f48] hover:bg-[#1a2332] hover:text-white"
                            }`}
                          >
                            <MessageSquare size={15} className="shrink-0" />
                            <span className="min-w-0 flex-1 truncate text-sm">{conversation.title}</span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteConversation(conversation.id);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  deleteConversation(conversation.id);
                                }
                              }}
                              className="rounded-lg p-1 text-[#556987] opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                              aria-label={`Delete ${conversation.title}`}
                            >
                              <Trash2 size={14} />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null,
                )}
                {!conversations.length ? (
                  <div className="rounded-2xl border border-dashed border-[#232f48] p-4 text-sm text-[#92a4c9]">
                    No sessions yet. Start by asking about a topic.
                  </div>
                ) : null}
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-[#232f48] bg-[#111722]/90 p-3 backdrop-blur sm:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2">
                {!sidebarOpen ? (
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                    aria-label="Open session sidebar"
                  >
                    <Menu size={20} />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                  aria-label="Go back"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold text-white sm:text-xl">SolStudy</h1>
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-300">
                      Study Mode
                    </span>
                  </div>
                  <p className="text-xs text-[#92a4c9]">AI chat, focus planning, and recall tools</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#232f48] bg-[#1a2332] px-3 py-2">
                  <Target size={16} className="shrink-0 text-blue-300" />
                  <input
                    value={activeTopic}
                    onChange={(event) => setActiveTopic(event.target.value)}
                    placeholder="Set active topic"
                    className="min-w-0 bg-transparent text-sm text-white placeholder:text-[#556987] outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 rounded-2xl border border-[#232f48] bg-[#1a2332] p-1 text-sm">
                  {(["chat", "mindmap"] as const).map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`rounded-xl px-3 py-2 font-semibold capitalize transition ${
                        viewMode === mode ? "bg-blue-600 text-white" : "text-[#92a4c9] hover:text-white"
                      }`}
                    >
                      {mode === "mindmap" ? "Mind Map" : "Chat"}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setKnowledgeRailOpen((open) => !open)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#232f48] bg-[#1a2332] px-3 py-2 text-sm font-semibold text-[#92a4c9] transition hover:text-white"
                >
                  <PanelRightClose size={16} />
                  Knowledge
                </button>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-hidden">
            {viewMode === "chat" ? (
              <section className="flex h-full min-h-0 flex-col">
                <div className="shrink-0 border-b border-[#232f48]/70 bg-[#111722] p-4">
                  <div className="rounded-2xl border border-[#232f48] bg-[#1a2332] p-4 shadow-lg shadow-black/15">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-500/10 p-3 text-blue-300">
                          <Brain size={22} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Mastery Progress</p>
                          <p className="text-xs text-[#92a4c9]">Focus indicator: deep work active</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-emerald-300">{masteryProgress}%</span>
                        <div className="h-2 w-40 rounded-full bg-[#111722]">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-400"
                            style={{ width: `${masteryProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                  {!messages.length ? (
                    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-14 text-center">
                      <div className="mb-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-blue-300 shadow-[0_0_40px_rgba(19,91,236,0.22)]">
                        <Bot size={34} />
                      </div>
                      <h2 className="text-2xl font-semibold text-white">Start a focused study session</h2>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-[#92a4c9]">
                        Pick a topic, attach study material, or use a quick action to begin.
                      </p>
                    </div>
                  ) : (
                    <div className="mx-auto max-w-4xl space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[min(44rem,92%)] rounded-2xl border px-4 py-3 shadow-xl shadow-black/10 ${
                              message.role === "user"
                                ? "border-blue-500/30 bg-blue-600 text-white"
                                : "border-[#232f48] bg-[#1a2332] text-[#dce6f7]"
                            }`}
                          >
                            {message.role === "ai" ? (
                              <div className="prose prose-invert max-w-none prose-p:my-2 prose-li:my-1 prose-strong:text-white">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                            )}
                            {message.attachments?.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {message.attachments.map((attachment) => (
                                  <span
                                    key={attachment.id}
                                    className="inline-flex items-center gap-2 rounded-lg bg-black/20 px-2 py-1 text-xs"
                                  >
                                    <FileText size={13} />
                                    {attachment.name}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                      {isLoading ? (
                        <div className="flex justify-start">
                          <div className="rounded-2xl border border-[#232f48] bg-[#1a2332] px-4 py-3 text-sm text-[#92a4c9]">
                            <span className="inline-flex items-center gap-2">
                              <Zap size={15} className="text-blue-300" />
                              Thinking through the next useful step...
                            </span>
                          </div>
                        </div>
                      ) : null}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                <div className="shrink-0 border-t border-[#232f48] bg-[#111722]/95 p-3 backdrop-blur sm:p-4">
                  <div className="mx-auto max-w-4xl">
                    <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                      {quickActions.map(({ label, icon: Icon }) => (
                        <button
                          type="button"
                          key={label}
                          onClick={() => setInput(label)}
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#232f48] bg-[#1a2332] px-3 py-2 text-xs font-semibold text-[#c5d3ef] transition hover:border-blue-500/40 hover:text-white"
                        >
                          <Icon size={14} className="text-blue-300" />
                          {label}
                        </button>
                      ))}
                    </div>

                    {attachments.length ? (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {attachments.map((attachment) => (
                          <span
                            key={attachment.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#232f48] bg-[#1a2332] px-3 py-2 text-xs text-[#c5d3ef]"
                          >
                            <FileText size={14} className="text-blue-300" />
                            <span>{attachment.name}</span>
                            <span className="text-[#556987]">{formatBytes(attachment.size)}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setAttachments((previous) =>
                                  previous.filter((item) => item.id !== attachment.id),
                                )
                              }
                              className="rounded-md p-0.5 text-[#92a4c9] transition hover:bg-red-500/10 hover:text-red-300"
                              aria-label={`Remove ${attachment.name}`}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {attachmentError ? (
                      <p className="mb-2 text-xs text-red-300">{attachmentError}</p>
                    ) : null}

                    <div className="flex items-end gap-2 rounded-2xl border border-[#232f48] bg-[#1a2332] p-2 shadow-2xl shadow-black/20 focus-within:border-blue-500/60">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFiles}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl p-3 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                        aria-label="Attach files"
                      >
                        <Paperclip size={19} />
                      </button>
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder="Ask a study question..."
                        className="max-h-44 min-h-12 flex-1 resize-none bg-transparent py-3 text-sm leading-6 text-white outline-none placeholder:text-[#556987]"
                      />
                      <button
                        type="button"
                        onClick={() => void sendMessage()}
                        disabled={(!input.trim() && attachments.length === 0) || isLoading}
                        className="rounded-xl bg-blue-600 p-3 text-white shadow-[0_0_22px_rgba(19,91,236,0.4)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-45"
                        aria-label="Send message"
                      >
                        <Send size={19} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <MindMapCanvas
                topic={activeTopic}
                tasks={tasks}
                generated={mindMapGenerated}
                onGenerate={generateMindMap}
              />
            )}
          </div>
        </main>

        <AnimatePresence initial={false}>
          {knowledgeRailOpen ? (
            <motion.aside
              key="knowledge-rail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 336, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden h-full shrink-0 overflow-hidden border-l border-[#232f48] bg-[#111722]/95 shadow-2xl shadow-black/20 backdrop-blur xl:flex xl:flex-col"
            >
              <div className="flex items-center justify-between border-b border-[#232f48] p-5">
                <h2 className="inline-flex items-center gap-2 font-semibold text-white">
                  <Sparkles size={18} className="text-blue-300" />
                  Knowledge Rail
                </h2>
                <button
                  type="button"
                  onClick={() => setKnowledgeRailOpen(false)}
                  className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                  aria-label="Close knowledge rail"
                >
                  <PanelRightClose size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
                <section>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#556987]">
                    Key Takeaways
                  </h3>
                  <div className="space-y-3">
                    {takeaways.map((takeaway) => (
                      <div key={takeaway.id} className="flex gap-3 rounded-xl border border-[#232f48] bg-[#1a2332] p-3">
                        <Lightbulb size={16} className="mt-0.5 shrink-0 text-blue-300" />
                        <p className="text-sm leading-5 text-[#c5d3ef]">{takeaway.text}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#556987]">
                    Generated Flashcards
                  </h3>
                  <div className="space-y-3">
                    {flashcards.map((card) => (
                      <div key={card.id} className="rounded-xl border border-[#232f48] bg-[#1a2332] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                            {card.type}
                          </span>
                          <RotateCcw size={14} className="text-[#556987]" />
                        </div>
                        <h4 className="text-sm font-semibold text-white">{card.front}</h4>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#92a4c9]">{card.back}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#556987]">
                    Task Breakdown
                  </h3>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 rounded-xl border border-[#232f48] bg-[#1a2332] p-3">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            task.status === "done"
                              ? "bg-emerald-400/10 text-emerald-300"
                              : task.status === "active"
                                ? "bg-blue-500/10 text-blue-300"
                                : "bg-[#232f48] text-[#92a4c9]"
                          }`}
                        >
                          {task.status === "done" ? <CheckCircle2 size={16} /> : <Target size={15} />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{task.title}</p>
                          <p className="text-xs capitalize text-[#556987]">{task.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="border-t border-[#232f48] p-5">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(19,91,236,0.35)] transition hover:from-blue-500 hover:to-blue-400"
                >
                  <GraduationCap size={18} />
                  Review {flashcards.length} Cards
                </button>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showReviewModal && currentFlashcard ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-[#232f48] bg-[#1a2332] p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#92a4c9]">
                    Card {currentCardIndex + 1} of {flashcards.length}
                  </p>
                  <div className="mt-2 h-2 w-40 overflow-hidden rounded-full bg-[#111722]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-400"
                      style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                  aria-label="Close review modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="rounded-2xl border border-[#232f48] bg-[#111722] p-6 text-center">
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300">
                  {currentFlashcard.type}
                </span>
                <h3 className="mt-5 text-2xl font-semibold text-white">{currentFlashcard.front}</h3>
                <p className="mt-4 text-sm leading-6 text-[#92a4c9]">{currentFlashcard.back}</p>
              </div>

              <div className="mt-5 grid grid-cols-[1fr_1fr] gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentCardIndex((index) => Math.max(index - 1, 0))}
                  disabled={currentCardIndex === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#232f48] bg-[#111722] px-4 py-3 text-sm font-semibold text-[#92a4c9] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>
                {currentCardIndex === flashcards.length - 1 ? (
                  <button
                    type="button"
                    onClick={completeReview}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#07130d] transition hover:bg-emerald-400"
                  >
                    <CheckCircle2 size={17} />
                    Complete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentCardIndex((index) => Math.min(index + 1, flashcards.length - 1))
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Next
                    <ChevronRight size={17} />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
