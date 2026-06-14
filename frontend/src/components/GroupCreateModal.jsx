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

  return error?.message || "Unable to create group.";
}

export default function GroupCreateModal({ isOpen, onClose, onCreate, isSubmitting }) {
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: "", description: "" });
      setFieldErrors({});
      setSubmitError("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Group name is required.";
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
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              New group
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Create Group</h3>
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
            <span className="mb-2 block text-sm font-medium text-slate-700">Group Name</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={updateField}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600"
              placeholder="Goa Trip"
            />
            {fieldErrors.name ? <p className="mt-2 text-sm text-red-600">{fieldErrors.name}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              name="description"
              value={formData.description}
              onChange={updateField}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand-600"
              placeholder="Vacation expenses"
            />
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
              {isSubmitting ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
