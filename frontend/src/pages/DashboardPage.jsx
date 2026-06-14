import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import GroupCreateModal from "../components/GroupCreateModal";
import { createGroup, fetchDashboardSummary, fetchGroups } from "../services/groupService";

function getErrorMessage(error) {
  const response = error?.response?.data;

  if (typeof response?.message === "string") {
    return response.message;
  }

  if (Array.isArray(response?.errors) && response.errors.length > 0) {
    return response.errors.join(" ");
  }

  if (typeof response === "string") {
    return response;
  }

  return error?.message || "Unable to load dashboard data.";
}

function formatMoney(value) {
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
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [dashboardSummary, groupList] = await Promise.all([
        fetchDashboardSummary(),
        fetchGroups(),
      ]);
      setSummary(dashboardSummary);
      setGroups(groupList);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateGroup = async (payload) => {
    setCreatingGroup(true);
    setError("");
    setSuccessMessage("");

    try {
      await createGroup(payload);
      const updatedGroups = await fetchGroups();
      setGroups(updatedGroups);
      setSuccessMessage("Group created successfully.");
      setIsGroupModalOpen(false);
    } catch (createError) {
      setError(getErrorMessage(createError));
      throw createError;
    } finally {
      setCreatingGroup(false);
    }
  };

  const totalMembers = useMemo(
    () => groups.reduce((count, group) => count + (group.member_count || 0), 0),
    [groups],
  );

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Overview</p>
        <p className="mt-4 text-sm text-slate-600">Loading dashboard summary and groups...</p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Overview
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">Dashboard</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review your total balance, your groups, and create new groups from here.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsGroupModalOpen(true)}
            className="rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Create Group
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 to-rose-100 p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-base">💸</span>
            <p className="text-sm font-medium text-red-600">Total You Owe</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-red-700">
            {formatMoney(summary?.total_you_owe)}
          </p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-100 p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-base">💰</span>
            <p className="text-sm font-medium text-emerald-600">Total You Are Owed</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-emerald-700">
            {formatMoney(summary?.total_you_are_owed)}
          </p>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-base">⚖️</span>
            <p className="text-sm font-medium text-blue-600">Net Balance</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-blue-700">
            {formatMoney(summary?.net_balance)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Groups
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Your Groups</h3>
          </div>
          <p className="text-sm text-slate-500">{groups.length} groups · {totalMembers} members</p>
        </div>

        <div className="mt-6">
          {groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
              No groups yet. Create your first group to start tracking expenses.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group, idx) => {
                const palettes = [
                  { border: "border-l-indigo-400", badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400" },
                  { border: "border-l-emerald-400", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
                  { border: "border-l-rose-400", badge: "bg-rose-100 text-rose-700", dot: "bg-rose-400" },
                  { border: "border-l-amber-400", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
                  { border: "border-l-purple-400", badge: "bg-purple-100 text-purple-700", dot: "bg-purple-400" },
                  { border: "border-l-cyan-400", badge: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-400" },
                ];
                const p = palettes[idx % palettes.length];
                return (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className={`rounded-2xl border border-slate-200 border-l-4 ${p.border} p-5 transition hover:shadow-md hover:border-slate-300 bg-white`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">{group.name}</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {group.description || "No description provided."}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.badge}`}>
                      {group.member_count || 0} members
                    </span>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <GroupCreateModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreate={handleCreateGroup}
        isSubmitting={creatingGroup}
      />
    </div>
  );
}

