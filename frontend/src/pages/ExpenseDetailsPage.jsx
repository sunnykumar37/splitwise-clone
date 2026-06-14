import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deleteExpenseById, fetchExpenseById } from "../services/expenseService";
import { getAccessToken } from "../api/axios";
import { fetchExpenseMessages } from "../services/chatService";

export default function ExpenseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Chat integration states
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [denied, setDenied] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const loadExpense = async () => {
    setLoading(true);
    setError("");

    try {
      const nextExpense = await fetchExpenseById(id);
      setExpense(nextExpense);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError?.message || "Unable to load expense details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpense();
  }, [id]);

  // WebSocket and chat history loading
  useEffect(() => {
    let socket = null;
    let reconnectTimeout = null;
    let isMounted = true;
    let isDenied = false;

    setMessages([]);
    setChatLoading(true);
    setChatError("");
    setConnectionError("");
    setDenied(false);

    const loadHistory = async () => {
      try {
        const history = await fetchExpenseMessages(id);
        if (isMounted) {
          setMessages(history);
        }
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 403) {
            setDenied(true);
            isDenied = true;
          } else {
            setChatError(err.response?.data?.message || err.message || "Failed to load chat history.");
          }
        }
      } finally {
        if (isMounted) {
          setChatLoading(false);
        }
      }
    };

    const connectWebSocket = () => {
      if (!isMounted || isDenied) return;

      const token = getAccessToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const wsBase = apiBase.replace(/^http/, "ws");
      const wsUrl = `${wsBase.replace(/\/+$/, "")}/ws/expenses/${id}/?token=${encodeURIComponent(token || "")}`;

      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        setConnected(true);
        setConnectionError("");
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const incoming = JSON.parse(event.data);
          if (incoming.type === "error") {
            setChatError(incoming.message);
          } else {
            setMessages((prev) => [...prev, incoming]);
          }
        } catch (parseErr) {
          console.error("Error parsing chat message:", parseErr);
        }
      };

      socket.onerror = () => {
        if (!isMounted) return;
        setConnectionError("Unable to connect to chat server.");
      };

      socket.onclose = (event) => {
        if (!isMounted) return;
        setConnected(false);

        if (event.code === 4403 || event.code === 403) {
          setDenied(true);
          isDenied = true;
        } else {
          setConnectionError("Chat disconnected. Attempting to reconnect...");
          reconnectTimeout = setTimeout(() => {
            if (isMounted && !isDenied) {
              connectWebSocket();
            }
          }, 3000);
        }
      };
    };

    loadHistory().then(() => {
      if (isMounted && !isDenied) {
        connectWebSocket();
      }
    });

    return () => {
      isMounted = false;
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [id]);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const cleanMsg = newMessage.trim();
    if (!cleanMsg) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message: cleanMsg }));
      setNewMessage("");
    } else {
      setConnectionError("Cannot send message. Chat is currently disconnected.");
    }
  };

  const isCreator = Boolean(currentUser?.id && expense?.created_by?.id === currentUser.id);
  const participants = expense?.participants ?? [];
  const splitBreakdown = expense?.split_breakdown ?? [];

  const formatMoney = (value) => {
    const numericValue = Number(value ?? 0);
    if (Number.isNaN(numericValue)) {
      return value ?? "0.00";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const getParticipantName = (participant) => participant.user?.username || `User #${participant.user?.id ?? "-"}`;

  const breakdownText = useMemo(() => {
    if (!expense) {
      return [];
    }

    return splitBreakdown.map((item) => {
      const participant = participants.find((current) => current.user?.id === item.user);
      const name = participant?.user?.username || `User #${item.user}`;
      const owed = item.amount_owed ? formatMoney(item.amount_owed) : formatMoney(0);
      return `${name} owes ${owed}`;
    });
  }, [expense, participants, splitBreakdown]);

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    setSuccessMessage("");

    try {
      await deleteExpenseById(id);
      setSuccessMessage("Expense deleted successfully.");
      navigate(`/groups/${expense.group.id}`, { replace: true });
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || deleteError?.message || "Unable to delete expense.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Expense</p>
        <p className="mt-4 text-sm text-slate-600">Loading expense details...</p>
      </section>
    );
  }

  if (error && !expense) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Expense</p>
        <p className="mt-4 text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={loadExpense}
          className="mt-6 rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Try Again
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Expense
        </p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">{expense?.description}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {expense?.group?.name ? (
                <>
                  From group <Link to={`/groups/${expense.group.id}`} className="font-semibold text-brand-700 hover:underline">{expense.group.name}</Link>
                </>
              ) : (
                "Expense details"
              )}
            </p>
          </div>

          {isCreator ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-2xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {deleting ? "Deleting..." : "Delete Expense"}
            </button>
          ) : null}
        </div>

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Amount</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">{formatMoney(expense?.amount)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Paid By</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">{expense?.paid_by?.username || "-"}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Split Type</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">{expense?.split_type || "-"}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Created At</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {expense?.created_at ? new Date(expense.created_at).toLocaleString() : "-"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Participants
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Who Paid What</h3>
        </div>

        {participants.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
            No participant data available.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">Amount Owed</th>
                  <th className="px-4 py-3 font-medium">Percentage</th>
                  <th className="px-4 py-3 font-medium">Shares</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {participants.map((participant) => (
                  <tr key={participant.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{getParticipantName(participant)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatMoney(participant.amount_owed)}</td>
                    <td className="px-4 py-3 text-slate-600">{participant.percentage ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{participant.shares ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Split Breakdown
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-900">Clear Owing Summary</h3>

        {breakdownText.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
            No split breakdown available.
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {breakdownText.map((line, index) => (
              <li key={index} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                {line}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Expense Chat Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft flex flex-col h-[550px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Chat
          </p>
          <div className="flex items-center justify-between mt-2 border-b border-slate-100 pb-4">
            <h3 className="text-2xl font-semibold text-slate-900">Expense Chat</h3>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {connected ? "Connected" : denied ? "Access Denied" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>

        {/* Banners for errors */}
        {connectionError && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            {connectionError}
          </div>
        )}

        {chatError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800">
            {chatError}
          </div>
        )}

        {denied && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800">
            You must be a participant of this expense to access the chat.
          </div>
        )}

        {/* Chat message display area */}
        <div className="flex-1 overflow-y-auto mt-6 pr-2 space-y-4">
          {chatLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-700 mb-2" />
              Loading messages...
            </div>
          ) : denied ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
              Access restricted.
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm italic">
              No messages yet. Send a message to start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender?.id === currentUser?.id || msg.sender?.username === currentUser?.username;
              return (
                <div key={msg.id || Math.random()} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <span className="text-xs font-medium text-slate-500 ml-2 mb-1">
                      {msg.sender?.username || "Unknown"}
                    </span>
                  )}
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    isMe
                      ? "bg-brand-700 text-white rounded-tr-none"
                      : "bg-slate-100 text-slate-900 rounded-tl-none"
                  }`}>
                    <p className="break-words leading-relaxed">{msg.message}</p>
                  </div>
                  <span className={`text-[10px] text-slate-400 mt-1 ${isMe ? "mr-2" : "ml-2"}`}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form className="mt-4 border-t border-slate-100 pt-4 flex gap-2" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            disabled={denied || chatLoading}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-brand-600 disabled:bg-slate-50 disabled:cursor-not-allowed"
            placeholder={denied ? "Chat input disabled" : "Type a message..."}
          />
          <button
            type="submit"
            disabled={denied || chatLoading || !newMessage.trim()}
            className="rounded-2xl bg-brand-700 hover:bg-brand-600 text-white font-semibold text-sm px-6 py-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}

