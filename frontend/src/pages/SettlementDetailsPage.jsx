import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchSettlementById } from "../services/settlementService";

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

export default function SettlementDetailsPage() {
  const { id } = useParams();
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSettlement = async () => {
    setLoading(true);
    setError("");

    try {
      const nextSettlement = await fetchSettlementById(id);
      setSettlement(nextSettlement);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError?.message || "Unable to load settlement details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlement();
  }, [id]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Settlement</p>
        <p className="mt-4 text-sm text-slate-600">Loading settlement details...</p>
      </section>
    );
  }

  if (error && !settlement) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Settlement</p>
        <p className="mt-4 text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={loadSettlement}
          className="mt-6 rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Try Again
        </button>
      </section>
    );
  }

  if (!settlement) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Settlement</p>
        <p className="mt-4 text-sm text-slate-600">Settlement not found.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Go to Dashboard
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Settlement</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Settlement Details</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {settlement?.group?.name ? (
                <>
                  From group <Link to={`/groups/${settlement.group.id}`} className="font-semibold text-brand-700 hover:underline">{settlement.group.name}</Link>
                </>
              ) : (
                "Settlement details"
              )}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-100 p-6 shadow-soft">
          <p className="text-sm font-medium text-indigo-600">Payer</p>
          <p className="mt-3 text-lg font-semibold text-indigo-900">{settlement?.payer?.username || "-"}</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-100 p-6 shadow-soft">
          <p className="text-sm font-medium text-emerald-600">Receiver</p>
          <p className="mt-3 text-lg font-semibold text-emerald-900">{settlement?.receiver?.username || "-"}</p>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-red-100 p-6 shadow-soft">
          <p className="text-sm font-medium text-rose-600">Amount</p>
          <p className="mt-3 text-lg font-semibold text-rose-900">{formatMoney(settlement?.amount)}</p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-100 p-6 shadow-soft">
          <p className="text-sm font-medium text-amber-600">Created At</p>
          <p className="mt-3 text-lg font-semibold text-amber-900">
            {settlement?.created_at ? new Date(settlement.created_at).toLocaleString() : "-"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Balance Impact</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-900">How the balance changed</h3>

        {settlement?.balance_impact ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">Payer delta</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {formatMoney(settlement.balance_impact.payer?.delta)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">Receiver delta</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {formatMoney(settlement.balance_impact.receiver?.delta)}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
            No balance impact data available.
          </div>
        )}
      </section>
    </div>
  );
}
