import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.318-3.95M6.53 6.53A9.97 9.97 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-4.293 5.265M15 12a3 3 0 00-3-3m0 0a3 3 0 00-2.83 2M3 3l18 18" />
    </svg>
  );
}

function getErrorMessage(error) {
  const response = error?.response?.data;
  if (typeof response?.message === "string") return response.message;
  if (typeof response?.detail === "string") return response.detail;
  if (typeof response === "string") return response;
  return error?.message || "Unable to register.";
}

function validate(values) {
  const nextErrors = {};
  if (!values.name.trim()) nextErrors.name = "Name is required.";
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
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(formData);
    setFieldErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    try {
      await register({ name: formData.name.trim(), email: formData.email.trim(), password: formData.password });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 overflow-hidden bg-slate-50">
      {/* Light soft background orbs */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-indigo-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full bg-violet-200/50 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-100/60 blur-3xl" />

      <section className="relative mx-auto grid w-full max-w-4xl gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Form card */}
        <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Get started</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Register</h2>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Start sharing expenses smarter with a premium group experience.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={updateField}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                placeholder="Alice Doe"
              />
              {fieldErrors.name && <p className="mt-2 text-sm text-red-600">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={updateField}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                placeholder="alice@example.com"
              />
              {fieldErrors.email && <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={updateField}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>}
            </div>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition">Login here</Link>
          </p>
        </div>

        {/* Promo panel */}
        <aside className="relative hidden items-stretch overflow-hidden rounded-3xl p-8 lg:flex border border-violet-100 shadow-xl bg-gradient-to-br from-indigo-500 to-violet-500">
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-52 w-52 rounded-full bg-white/15 blur-2xl" />

          <div className="relative flex w-full flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                🚀 Premium group experience
              </div>
              <h3 className="mt-5 text-4xl font-semibold leading-tight text-white">Start sharing expenses smarter.</h3>
              <p className="mt-4 text-sm leading-6 text-indigo-100">
                Create groups, split bills instantly, and never lose track of who owes what.
              </p>
              <div className="mt-6 grid gap-3">
                {[
                  { title: "Create Unlimited Groups", sub: "Invite friends, roommates, and teams." },
                  { title: "Split Expenses Fairly", sub: "Accurate splits every time." },
                  { title: "Instant Settlements", sub: "Settle up with confidence." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-white/15 p-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/25 text-white font-bold">✓</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-indigo-100">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 rounded-2xl bg-white/15 px-4 py-3 text-xs text-indigo-50">
              Join thousands simplifying shared finances.
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
