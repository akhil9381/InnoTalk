import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  fetchMentorConversation,
  fetchMentorInbox,
  fetchMentors,
  sendMentorMessage,
  type MentorConversationDetail,
  type MentorConversationSummary,
  type MentorDirectoryEntry,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const MentorSupport = () => {
  const { user, tokens } = useAuth();
  const [mentors, setMentors] = useState<MentorDirectoryEntry[]>([]);
  const [inbox, setInbox] = useState<MentorConversationSummary[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [conversation, setConversation] = useState<MentorConversationDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const isMentor = user?.role === "mentor";
  const accessToken = tokens?.accessToken ?? "";

  const activeMentor = useMemo(
    () => mentors.find((mentor) => mentor._id === selectedMentorId) ?? null,
    [mentors, selectedMentorId],
  );

  const activeInboxThread = useMemo(
    () => inbox.find((thread) => thread.user._id === selectedUserId) ?? null,
    [inbox, selectedUserId],
  );

  useEffect(() => {
    if (!accessToken || !user) {
      return;
    }

    let ignore = false;

    const hydrateSupport = async () => {
      setIsLoading(true);
      try {
        if (isMentor) {
          const mentorInbox = await fetchMentorInbox(accessToken);
          if (ignore) {
            return;
          }
          setInbox(mentorInbox);
          if (mentorInbox[0]) {
            setSelectedUserId((current) => current || mentorInbox[0].user._id);
          }
        } else {
          const mentorDirectory = await fetchMentors(accessToken);
          if (ignore) {
            return;
          }
          setMentors(mentorDirectory);
          if (mentorDirectory[0]) {
            setSelectedMentorId((current) => current || mentorDirectory[0]._id);
          }
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error instanceof Error ? error.message : "Unable to load mentor support.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void hydrateSupport();

    return () => {
      ignore = true;
    };
  }, [accessToken, isMentor, user]);

  useEffect(() => {
    if (!accessToken || !user) {
      return;
    }

    let ignore = false;

    const loadConversation = async () => {
      const shouldLoad = isMentor ? Boolean(selectedUserId) : Boolean(selectedMentorId);
      if (!shouldLoad) {
        setConversation(null);
        return;
      }

      try {
        const thread = await fetchMentorConversation(accessToken, {
          mentorId: isMentor ? undefined : selectedMentorId,
          userId: isMentor ? selectedUserId : undefined,
        });

        if (!ignore) {
          setConversation(thread);
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error instanceof Error ? error.message : "Unable to load messages.");
        }
      }
    };

    void loadConversation();

    return () => {
      ignore = true;
    };
  }, [accessToken, isMentor, selectedMentorId, selectedUserId, user]);

  const refreshMentorInbox = async () => {
    if (!accessToken || !isMentor) {
      return;
    }

    const mentorInbox = await fetchMentorInbox(accessToken);
    setInbox(mentorInbox);
  };

  const handleSend = async () => {
    const message = draft.trim();
    if (!message || !accessToken) {
      return;
    }

    if (isMentor && !selectedUserId) {
      toast.error("Select a founder conversation first.");
      return;
    }

    if (!isMentor && !selectedMentorId) {
      toast.error("Select a mentor first.");
      return;
    }

    setIsSending(true);
    try {
      const sentMessage = await sendMentorMessage(accessToken, {
        mentorId: isMentor ? undefined : selectedMentorId,
        userId: isMentor ? selectedUserId : undefined,
        message,
      });

      setConversation((current) => ({
        messages: [...(current?.messages ?? []), sentMessage],
        participants: current?.participants ?? null,
      }));
      setDraft("");

      if (isMentor) {
        await refreshMentorInbox();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send your message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pb-10 pt-28 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {isMentor ? "Mentor Inbox" : "Mentor Support"}
            </p>
            <h1 className="font-heading text-4xl font-bold text-foreground">
              {isMentor
                ? "Respond to founder questions and guide their next step."
                : "Reach out to a mentor when you need a sharper perspective."}
            </h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <section className="panel-luxe rounded-[2rem] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-2xl font-semibold text-foreground">
                  {isMentor ? "Founder Messages" : "Choose a Mentor"}
                </h2>
              </div>

              {isLoading ? (
                <div className="rounded-2xl border border-border/50 bg-secondary/30 px-4 py-6 text-sm text-muted-foreground">
                  Loading mentor support...
                </div>
              ) : isMentor ? (
                <div className="space-y-3">
                  {inbox.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                      No founder messages yet.
                    </div>
                  ) : (
                    inbox.map((thread) => (
                      <button
                        key={thread.conversationId}
                        type="button"
                        onClick={() => setSelectedUserId(thread.user._id)}
                        className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                          selectedUserId === thread.user._id
                            ? "border-primary bg-primary/10 shadow-[0_16px_35px_hsl(var(--primary)/0.10)]"
                            : "border-border/60 bg-secondary/25 hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-foreground">{thread.user.fullName}</div>
                            <div className="text-sm text-muted-foreground">{thread.user.email}</div>
                          </div>
                          {thread.unreadCount > 0 ? (
                            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                              {thread.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                          {thread.latestMessage.message}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {mentors.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                      No mentors are available right now.
                    </div>
                  ) : (
                    mentors.map((mentor) => (
                      <button
                        key={mentor._id}
                        type="button"
                        onClick={() => setSelectedMentorId(mentor._id)}
                        className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                          selectedMentorId === mentor._id
                            ? "border-primary bg-primary/10 shadow-[0_16px_35px_hsl(var(--primary)/0.10)]"
                            : "border-border/60 bg-secondary/25 hover:border-primary/30"
                        }`}
                      >
                        <div className="font-semibold text-foreground">{mentor.fullName}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {[mentor.designation, mentor.company].filter(Boolean).join(" • ")}
                        </div>
                        {mentor.expertise.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {mentor.expertise.slice(0, 3).map((item) => (
                              <span
                                key={item}
                                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
              )}
            </section>

            <section className="panel-luxe flex min-h-[640px] flex-col rounded-[2rem] p-5">
              <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-foreground">
                    {isMentor
                      ? activeInboxThread?.user.fullName || "Select a founder"
                      : activeMentor?.fullName || "Select a mentor"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isMentor
                      ? activeInboxThread?.user.email || "Open a founder message to reply."
                      : [activeMentor?.designation, activeMentor?.company].filter(Boolean).join(" • ") ||
                        "Choose a mentor to start the conversation."}
                  </p>
                </div>
                {!isMentor && activeMentor?.expertise.length ? (
                  <div className="hidden max-w-sm flex-wrap justify-end gap-2 md:flex">
                    {activeMentor.expertise.slice(0, 3).map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto py-6">
                {conversation?.messages?.length ? (
                  conversation.messages.map((message) => {
                    const isOwnMessage =
                      (isMentor && message.senderRole === "mentor") || (!isMentor && message.senderRole === "user");

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-2xl rounded-[1.5rem] px-4 py-3 ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground shadow-[0_18px_40px_hsl(var(--primary)/0.25)]"
                              : "bg-secondary/60 text-foreground"
                          }`}
                        >
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">
                            {message.senderName}
                          </div>
                          <p className="mt-2 text-sm leading-7">{message.message}</p>
                          <div className="mt-3 text-xs opacity-70">{formatTimestamp(message.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full min-h-[320px] items-center justify-center rounded-[1.75rem] border border-dashed border-border/60 bg-secondary/20 px-6 text-center text-sm text-muted-foreground">
                    {isMentor
                      ? "Choose a founder from the left to review and answer their questions."
                      : "Choose a mentor and send your first question to start the conversation."}
                  </div>
                )}
              </div>

              <div className="border-t border-border/50 pt-4">
                <div className="rounded-[1.5rem] border border-border/60 bg-secondary/25 p-3">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={
                      isMentor
                        ? "Send a follow-up question, challenge, or mentoring note..."
                        : "Ask your mentor about your startup, market readiness, or next step..."
                    }
                    className="min-h-[128px] w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="hero"
                      onClick={() => void handleSend()}
                      disabled={isSending || (!selectedMentorId && !selectedUserId)}
                    >
                      {isSending ? "Sending..." : isMentor ? "Reply to Founder" : "Send to Mentor"}
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MentorSupport;
