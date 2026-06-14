import { useEffect, useMemo, useState } from "react";

const splitTypes = ["EQUAL", "UNEQUAL", "PERCENTAGE", "SHARES"];

function formatMoney(value) {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) {
    return "0.00";
  }

  return numericValue.toFixed(2);
}

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

  return error?.message || "Unable to create expense.";
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onCreate,
  isSubmitting,
  members,
  defaultPaidById,
}) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    paid_by: defaultPaidById || "",
    split_type: "EQUAL",
    participantIds: [],
    splits: {},
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const selectedMembers = useMemo(() => {
    return members.filter((member) => formData.participantIds.includes(member.user?.id));
  }, [formData.participantIds, members]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const initialParticipantIds = members.map((member) => member.user?.id).filter(Boolean);
    const selectedPayer = defaultPaidById || members[0]?.user?.id || "";

    setFormData({
      description: "",
      amount: "",
      paid_by: selectedPayer,
      split_type: "EQUAL",
      participantIds: initialParticipantIds,
      splits: initialParticipantIds.reduce((accumulator, participantId) => {
        accumulator[participantId] = "";
        return accumulator;
      }, {}),
    });
    setFieldErrors({});
    setSubmitError("");
  }, [isOpen, defaultPaidById, members]);

  if (!isOpen) {
    return null;
  }

  const updateField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const updateSplitValue = (participantId, value) => {
    setFormData((current) => ({
      ...current,
      splits: {
        ...current.splits,
        [participantId]: value,
      },
    }));
  };

  const toggleParticipant = (participantId) => {
    setFormData((current) => {
      const exists = current.participantIds.includes(participantId);
      const participantIds = exists
        ? current.participantIds.filter((id) => id !== participantId)
        : [...current.participantIds, participantId];

      return {
        ...current,
        participantIds,
        splits: {
          ...current.splits,
          [participantId]: current.splits[participantId] ?? "",
        },
      };
    });
  };

  const buildParticipantPayload = () => {
    return formData.participantIds.map((participantId) => {
      const participant = members.find((item) => item.user?.id === participantId);
      const payload = { user_id: participantId };
      const rawValue = formData.splits[participantId];

      if (formData.split_type === "UNEQUAL") {
        payload.amount = formatMoney(rawValue);
      }

      if (formData.split_type === "PERCENTAGE") {
        payload.percentage = Number(rawValue || 0).toFixed(2);
      }

      if (formData.split_type === "SHARES") {
        payload.shares = Number(rawValue || 0).toFixed(4);
      }

      if (formData.split_type === "EQUAL") {
        void participant;
      }

      return payload;
    });
  };

  const validate = () => {
    const nextErrors = {};
    const amount = Number(formData.amount);

    if (!formData.description.trim()) {
      nextErrors.description = "Description is required.";
    }

    if (!formData.amount || Number.isNaN(amount) || amount <= 0) {
      nextErrors.amount = "Amount must be greater than zero.";
    }

    if (!formData.paid_by) {
      nextErrors.paid_by = "Paid By is required.";
    }

    if (formData.participantIds.length === 0) {
      nextErrors.participants = "Select at least one participant.";
    }

    if (formData.split_type === "UNEQUAL") {
      const total = formData.participantIds.reduce(
        (sum, participantId) => sum + Number(formData.splits[participantId] || 0),
        0,
      );
      if (Math.abs(total - amount) > 0.01) {
        nextErrors.split = "Unequal split amounts must equal the expense amount.";
      }
    }

    if (formData.split_type === "PERCENTAGE") {
      const total = formData.participantIds.reduce(
        (sum, participantId) => sum + Number(formData.splits[participantId] || 0),
        0,
      );
      if (Math.abs(total - 100) > 0.01) {
        nextErrors.split = "Percentage split must total 100%.";
      }
    }

    if (formData.split_type === "SHARES") {
      const total = formData.participantIds.reduce(
        (sum, participantId) => sum + Number(formData.splits[participantId] || 0),
        0,
      );
      if (total <= 0) {
        nextErrors.split = "Shares must total more than zero.";
      }
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
      await onCreate({
        description: formData.description.trim(),
        amount: Number(formData.amount).toFixed(2),
        paid_by: Number(formData.paid_by),
        split_type: formData.split_type,
        participants: buildParticipantPayload(),
      });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              New expense
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Add Expense</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
              <input
                type="text"
                value={formData.description}
                onChange={(event) => updateField("description", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600"
                placeholder="Dinner"
              />
              {fieldErrors.description ? <p className="mt-2 text-sm text-red-600">{fieldErrors.description}</p> : null}
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
                placeholder="120.00"
              />
              {fieldErrors.amount ? <p className="mt-2 text-sm text-red-600">{fieldErrors.amount}</p> : null}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Paid By</span>
              <select
                value={formData.paid_by}
                onChange={(event) => updateField("paid_by", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600"
              >
                <option value="">Select payer</option>
                {members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.username}
                  </option>
                ))}
              </select>
              {fieldErrors.paid_by ? <p className="mt-2 text-sm text-red-600">{fieldErrors.paid_by}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Split Type</span>
              <select
                value={formData.split_type}
                onChange={(event) => updateField("split_type", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600"
              >
                {splitTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-700">Participants</span>
              {fieldErrors.participants ? <p className="text-sm text-red-600">{fieldErrors.participants}</p> : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {members.map((member) => {
                const checked = formData.participantIds.includes(member.user.id);
                return (
                  <label
                    key={member.user.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleParticipant(member.user.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                    />
                    <span className="text-sm text-slate-700">
                      {member.user.username} {member.user.email ? `(${member.user.email})` : ""}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {formData.split_type !== "EQUAL" ? (
            <div className="rounded-3xl border border-slate-200 p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h4 className="text-lg font-semibold text-slate-900">Split Inputs</h4>
                {fieldErrors.split ? <p className="text-sm text-red-600">{fieldErrors.split}</p> : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {selectedMembers.map((member) => (
                  <label key={member.user.id} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      {member.user.username}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step={formData.split_type === "SHARES" ? "0.0001" : formData.split_type === "PERCENTAGE" ? "0.01" : "0.01"}
                      value={formData.splits[member.user.id] ?? ""}
                      onChange={(event) => updateSplitValue(member.user.id, event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600"
                      placeholder={formData.split_type === "UNEQUAL" ? "40.00" : formData.split_type === "PERCENTAGE" ? "25.00" : "1"}
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}

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
              {isSubmitting ? "Saving..." : "Create Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
