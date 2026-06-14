import { useEffect, useState } from "react";

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

  return error?.message || "Unable to record settlement.";
}

export default function SettleUpModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  members,
  defaultPayerId,
  defaultReceiverId,
}) {
  const [formData, setFormData] = useState({
    payer: defaultPayerId || "",
    receiver: defaultReceiverId || "",
    amount: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData({
      payer: defaultPayerId || "",
      receiver: defaultReceiverId || "",
      amount: "",
    });
    setFieldErrors({});
    setSubmitError("");
  }, [isOpen, defaultPayerId, defaultReceiverId]);

  if (!isOpen) {
    return null;
  }

  const validate = () => {
    const nextErrors = {};

    if (!formData.payer) {
      nextErrors.payer = "Payer is required.";
    }

    if (!formData.receiver) {
      nextErrors.receiver = "Receiver is required.";
    }

    if (formData.payer && formData.receiver && Number(formData.payer) === Number(formData.receiver)) {
      nextErrors.receiver = "Payer and receiver must be different users.";
    }

    const amount = Number(formData.amount);
    if (!formData.amount || Number.isNaN(amount) || amount <= 0) {
      nextErrors.amount = "Amount must be greater than zero.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate();
    setFieldErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await onSubmit({
        payer: Number(formData.payer),
        receiver: Number(formData.receiver),
        amount: Number(formData.amount).toFixed(2),
      });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  const updateField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Settle up
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Record Settlement</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Payer</span>
            <select
              value={formData.payer}
              onChange={(event) => updateField("payer", event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600"
            >
              <option value="">Select payer</option>
              {members.map((member) => {
                if (!member.user) return null;
                return (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.username}
                  </option>
                );
              })}
            </select>
            {fieldErrors.payer ? <p className="mt-2 text-sm text-red-600">{fieldErrors.payer}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Receiver</span>
            <select
              value={formData.receiver}
              onChange={(event) => updateField("receiver", event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600"
            >
              <option value="">Select receiver</option>
              {members.map((member) => {
                if (!member.user) return null;
                return (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.username}
                  </option>
                );
              })}
            </select>
            {fieldErrors.receiver ? <p className="mt-2 text-sm text-red-600">{fieldErrors.receiver}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Amount</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={(event) => updateField("amount", event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600"
              placeholder="400.00"
            />
            {fieldErrors.amount ? <p className="mt-2 text-sm text-red-600">{fieldErrors.amount}</p> : null}
          </label>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Record Settlement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
