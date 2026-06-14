import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AddExpenseModal from "../components/AddExpenseModal";
import SettleUpModal from "../components/SettleUpModal";
import {
  addGroupMember,
  fetchGroupById,
  fetchGroupBalances,
  removeGroupMember,
} from "../services/groupService";
import { createExpense, fetchGroupExpenses } from "../services/expenseService";
import { createSettlement, fetchGroupSettlements } from "../services/settlementService";

export default function GroupDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [settlementsLoading, setSettlementsLoading] = useState(true);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [error, setError] = useState("");
  const [expensesError, setExpensesError] = useState("");
  const [settlementsError, setSettlementsError] = useState("");
  const [balancesError, setBalancesError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseActionLoading, setExpenseActionLoading] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settlementActionLoading, setSettlementActionLoading] = useState(false);

  const loadExpenses = async () => {
    setExpensesLoading(true);
    setExpensesError("");

    try {
      const nextExpenses = await fetchGroupExpenses(id);
      setExpenses(nextExpenses);
    } catch (loadError) {
      setExpensesError(loadError?.response?.data?.message || loadError?.message || "Unable to load expenses.");
    } finally {
      setExpensesLoading(false);
    }
  };

  const loadSettlements = async () => {
    setSettlementsLoading(true);
    setSettlementsError("");

    try {
      const nextSettlements = await fetchGroupSettlements(id);
      setSettlements(nextSettlements);
    } catch (loadError) {
      setSettlementsError(loadError?.response?.data?.message || loadError?.message || "Unable to load settlements.");
    } finally {
      setSettlementsLoading(false);
    }
  };

  const loadBalances = async () => {
    setBalancesLoading(true);
    setBalancesError("");

    try {
      const nextBalances = await fetchGroupBalances(id);
      setBalances(nextBalances);
    } catch (loadError) {
      setBalancesError(loadError?.response?.data?.message || loadError?.message || "Unable to load balances.");
    } finally {
      setBalancesLoading(false);
    }
  };

  const loadGroup = async () => {
    setLoading(true);
    setError("");

    try {
      const nextGroup = await fetchGroupById(id);
      setGroup(nextGroup);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError?.message || "Unable to load group details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([loadGroup(), loadExpenses(), loadSettlements(), loadBalances()]);
    };

    initialize();
  }, [id]);

  const creatorId = group?.created_by;
  const isCreator = Boolean(currentUser?.id && creatorId && currentUser.id === creatorId);
  const currentUserId = currentUser?.id || "";
  const creator = useMemo(
    () => group?.members?.find((member) => member.user?.id === creatorId)?.user ?? null,
    [creatorId, group],
  );

  const expenseMembers = group?.members ?? [];

  const refreshGroupData = async () => {
    await Promise.all([loadGroup(), loadExpenses(), loadSettlements(), loadBalances()]);
  };

  const handleCreateExpense = async (payload) => {
    setExpenseActionLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await createExpense(id, payload);
      setSuccessMessage("Expense created successfully.");
      setIsExpenseModalOpen(false);
      await refreshGroupData();
    } catch (expenseError) {
      setError(expenseError?.response?.data?.message || expenseError?.message || "Unable to create expense.");
      throw expenseError;
    } finally {
      setExpenseActionLoading(false);
    }
  };

  const handleCreateSettlement = async (payload) => {
    setSettlementActionLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await createSettlement(id, payload);
      setSuccessMessage("Settlement recorded successfully.");
      setIsSettleModalOpen(false);
      await refreshGroupData();
    } catch (settlementError) {
      setError(settlementError?.response?.data?.message || settlementError?.message || "Unable to record settlement.");
      throw settlementError;
    } finally {
      setSettlementActionLoading(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    setMemberActionLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await addGroupMember(id, {
        email: memberEmail.trim(),
        role: memberRole,
      });
      setMemberEmail("");
      setMemberRole("MEMBER");
      setSuccessMessage("Member added successfully.");
      await refreshGroupData();
    } catch (memberError) {
      setError(memberError?.response?.data?.message || memberError?.message || "Unable to add member.");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setMemberActionLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await removeGroupMember(id, { user_id: userId });
      setSuccessMessage("Member removed successfully.");
      await refreshGroupData();
    } catch (memberError) {
      setError(memberError?.response?.data?.message || memberError?.message || "Unable to remove member.");
    } finally {
      setMemberActionLoading(false);
    }
  };
const members = group?.members ?? [];

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

const settlementMembers = members;

const defaultPayerId = useMemo(() => {
  if (!currentUser || !balances) return "";

  const net = Number(balances.net_balance || 0);

  if (net < 0) {
    return currentUser.id;
  } else if (net > 0) {
    const debtor = balances.member_balances?.find(
      (mb) => Number(mb.balance || 0) < 0
    );

    return debtor
      ? debtor.user_id
      : (members.find((m) => m.user?.id !== currentUser.id)?.user?.id || "");
  }

  return currentUser.id;
}, [currentUser, balances, members]);

const defaultReceiverId = useMemo(() => {
  if (!currentUser || !balances) return "";

  const net = Number(balances.net_balance || 0);

  if (net > 0) {
    return currentUser.id;
  } else if (net < 0) {
    const creditor = balances.member_balances?.find(
      (mb) => Number(mb.balance || 0) > 0
    );

    return creditor
      ? creditor.user_id
      : (members.find((m) => m.user?.id !== currentUser.id)?.user?.id || "");
  }

  return (
    members.find((m) => m.user?.id !== currentUser.id)?.user?.id || ""
  );
}, [currentUser, balances, members]);

if (loading) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
        Group
      </p>
      <p className="mt-4 text-sm text-slate-600">
        Loading group details...
      </p>
    </section>
  );
}

if (error && !group) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
        Group
      </p>

      <p className="mt-4 text-sm text-red-600">
        {error}
      </p>

      <button
        type="button"
        onClick={loadGroup}
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
          Group
        </p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">{group?.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {group?.description || "No description provided."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              {members.length} members
            </span>
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Add Expense
            </button>
            <button
              type="button"
              onClick={() => setIsSettleModalOpen(true)}
              className="rounded-2xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Settle Up
            </button>
          </div>
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

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Total You Owe</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {balancesLoading ? "Loading..." : balancesError ? "Error" : formatMoney(balances?.you_owe)}
          </p>
          {balancesError && <p className="mt-1 text-xs text-red-600">{balancesError}</p>}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Total You Are Owed</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {balancesLoading ? "Loading..." : balancesError ? "Error" : formatMoney(balances?.you_are_owed)}
          </p>
          {balancesError && <p className="mt-1 text-xs text-red-600">{balancesError}</p>}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Net Balance</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {balancesLoading ? "Loading..." : balancesError ? "Error" : formatMoney(balances?.net_balance)}
          </p>
          {balancesError && <p className="mt-1 text-xs text-red-600">{balancesError}</p>}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Expenses
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Group Expenses</h3>
          </div>
        </div>

        {expensesLoading ? (
          <p className="mt-6 text-sm text-slate-600">Loading expenses...</p>
        ) : expensesError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{expensesError}</span>
            <button
              type="button"
              onClick={loadExpenses}
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
            No expenses yet. Add the first expense to get started.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Paid By</th>
                  <th className="px-4 py-3 font-medium">Split Type</th>
                  <th className="px-4 py-3 font-medium">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link to={`/expenses/${expense.id}`} className="text-brand-700 hover:underline">
                        {expense.description}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatMoney(expense.amount)}</td>
                    <td className="px-4 py-3 text-slate-600">{expense.paid_by?.username || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{expense.split_type}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {expense.created_at ? new Date(expense.created_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Settlements
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Settlement History</h3>
          </div>
        </div>

        {settlementsLoading ? (
          <p className="mt-6 text-sm text-slate-600">Loading settlements...</p>
        ) : settlementsError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{settlementsError}</span>
            <button
              type="button"
              onClick={loadSettlements}
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : settlements.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
            No settlements recorded yet.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Payer</th>
                  <th className="px-4 py-3 font-medium">Receiver</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {settlements.map((settlement) => (
                  <tr
                    key={settlement.id}
                    onClick={() => navigate(`/settlements/${settlement.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 hover:text-brand-700 hover:underline">
                      {settlement.payer?.username || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{settlement.receiver?.username || "-"}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{formatMoney(settlement.amount)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {settlement.created_at ? new Date(settlement.created_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Creator</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {creator ? `${creator.username}${creator.email ? ` (${creator.email})` : ""}` : `User #${creatorId || "-"}`}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Created At</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {group?.created_at ? new Date(group.created_at).toLocaleString() : "-"}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Role</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {isCreator ? "Creator" : "Member"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Members
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Group Members</h3>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
            No members available.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined At</th>
                  {isCreator ? <th className="px-4 py-3 font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{member.user?.username}</td>
                    <td className="px-4 py-3 text-slate-600">{member.user?.email || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{member.role}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {member.joined_at ? new Date(member.joined_at).toLocaleString() : "-"}
                    </td>
                    {isCreator ? (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={memberActionLoading || member.user?.id === creatorId}
                          onClick={() => handleRemoveMember(member.user.id)}
                          className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isCreator ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Member Management
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Add Member</h3>
            <p className="mt-3 text-sm text-slate-600">
              Only the group creator can add or remove members.
            </p>
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-[1fr_200px_auto]" onSubmit={handleAddMember}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600"
                placeholder="Enter registered email"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Role</span>
              <select
                value={memberRole}
                onChange={(event) => setMemberRole(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={memberActionLoading}
                className="w-full rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {memberActionLoading ? "Saving..." : "Add Member"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onCreate={handleCreateExpense}
        isSubmitting={expenseActionLoading}
        members={expenseMembers}
        defaultPaidById={currentUserId}
      />

      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        onSubmit={handleCreateSettlement}
        isSubmitting={settlementActionLoading}
        members={settlementMembers}
        defaultPayerId={defaultPayerId}
        defaultReceiverId={defaultReceiverId}
      />
    </div>
  );
}
