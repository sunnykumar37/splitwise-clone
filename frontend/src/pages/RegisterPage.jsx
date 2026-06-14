import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function getErrorMessage(error) {
  const response = error?.response?.data;

  if (typeof response?.message === "string") {
    return response.message;
  }

  if (typeof response?.detail === "string") {
    return response.detail;
  }

  if (typeof response === "string") {
    return response;
  }

  return error?.message || "Unable to register.";
}

function validate(values) {
  const nextErrors = {};

  if (!values.name.trim()) {
    nextErrors.name = "Name is required.";
  }

  if (!values.email.trim()) {
    nextErrors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    nextErrors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    nextErrors.password = "Password is required.";
  } else if (values.password.length < 8) {
    nextErrors.password = "Password must be at least 8 characters long.";
  }

  return nextErrors;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate(formData);
    setFieldErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Get started
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Register</h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Start sharing expenses smarter with a premium group experience.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={updateField}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-50"
              placeholder="Alice Doe"
            />
            {fieldErrors.name ? <p className="mt-2 text-sm text-red-600">{fieldErrors.name}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={updateField}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-50"
              placeholder="alice@example.com"
            />
            {fieldErrors.email ? <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={updateField}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-50"
              placeholder="Create a password"
            />
            {fieldErrors.password ? <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p> : null}
          </div>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-600">
            Login here
          </Link>
        </p>
      </div>

      <aside className="relative hidden items-stretch overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-soft lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600" />
        <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex w-full flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 glass-card">
              🚀 Premium group experience
            </div>

            <h3 className="mt-5 text-4xl font-semibold leading-tight text-white">Start sharing expenses smarter.</h3>
            <p className="mt-4 text-sm leading-6 text-white/80">
              Create groups, split bills instantly, and never lose track of who owes what.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="glass-card flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">✓</div>
                <div>
                  <p className="text-sm font-semibold text-white">Create Unlimited Groups</p>
                  <p className="mt-1 text-xs text-white/70">Invite friends, roommates, and teams.</p>
                </div>
              </div>

              <div className="glass-card flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">✓</div>
                <div>
                  <p className="text-sm font-semibold text-white">Split Expenses Fairly</p>
                  <p className="mt-1 text-xs text-white/70">Accurate splits every time.</p>
                </div>
              </div>

              <div className="glass-card flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">✓</div>
                <div>
                  <p className="text-sm font-semibold text-white">Instant Settlements</p>
                  <p className="mt-1 text-xs text-white/70">Settle up with confidence.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-xs text-white/85 backdrop-blur">
              Join thousands simplifying shared finances.
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
