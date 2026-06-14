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

  return error?.message || "Unable to log in.";
}

function validate(values) {
  const nextErrors = {};

  if (!values.login.trim()) {
    nextErrors.login = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.login.trim())) {
    nextErrors.login = "Enter a valid email address.";
  }

  if (!values.password) {
    nextErrors.password = "Password is required.";
  }

  return nextErrors;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ login: "", password: "" });
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
      await login({
        login: formData.login.trim(),
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
          Welcome back
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Login</h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Sign in to manage shared expenses, settle balances, and message your group.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="login">
              Email
            </label>
            <input
              id="login"
              name="login"
              type="email"
              autoComplete="email"
              value={formData.login}
              onChange={updateField}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-slate-900 outline-none transition focus:ring-4 focus:ring-brand-50 ${
                fieldErrors.login ? "border-red-300 focus:border-red-600 focus:ring-red-50" : "border-slate-300 focus:border-brand-600"
              }`}
              placeholder="alice@example.com"
              aria-invalid={Boolean(fieldErrors.login)}
            />
            {fieldErrors.login ? <p className="mt-2 text-sm text-red-600">{fieldErrors.login}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={updateField}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-slate-900 outline-none transition focus:ring-4 focus:ring-brand-50 ${
                fieldErrors.password ? "border-red-300 focus:border-red-600 focus:ring-red-50" : "border-slate-300 focus:border-brand-600"
              }`}
              placeholder="Enter your password"
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password ? <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p> : null}
          </div>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Need an account?{" "}
          <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-600 transition">
            Register here
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
            <div className="glass-card inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90">
              <span aria-hidden="true">✨</span>
              SaaS-ready expense sharing
            </div>

            <h3 className="mt-5 text-4xl font-semibold leading-tight text-white">
              Split expenses.
              <br />
              Stay connected.
            </h3>
            <p className="mt-4 text-sm leading-6 text-white/80">
              Track shared expenses, settle balances effortlessly, and chat with your group members in real time.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="glass-card flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">✓</div>
                <div>
                  <p className="text-sm font-semibold text-white">Real-time Expense Chat</p>
                  <p className="mt-1 text-xs text-white/70">Coordinate in-app without leaving the flow.</p>
                </div>
              </div>

              <div className="glass-card flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">✓</div>
                <div>
                  <p className="text-sm font-semibold text-white">Smart Balance Tracking</p>
                  <p className="mt-1 text-xs text-white/70">See net balances and who owes whom.</p>
                </div>
              </div>

              <div className="glass-card flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">✓</div>
                <div>
                  <p className="text-sm font-semibold text-white">Group Expense Management</p>
                  <p className="mt-1 text-xs text-white/70">Add members, create expenses, and settle up.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-xs text-white/85 backdrop-blur">
              Trusted by students, roommates, travellers, and teams.
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
