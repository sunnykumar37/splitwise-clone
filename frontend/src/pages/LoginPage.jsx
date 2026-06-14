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
          Use your email address to sign in and continue to your groups and expenses.
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
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-50"
              placeholder="alice@example.com"
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
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-50"
              placeholder="Enter your password"
            />
            {fieldErrors.password ? <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p> : null}
          </div>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Need an account?{" "}
          <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-600">
            Register here
          </Link>
        </p>
      </div>

      <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-50/80">
          Backend contract
        </p>
        <h3 className="mt-3 text-2xl font-semibold">Login endpoint</h3>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          This form posts to <span className="font-semibold text-white">POST /api/auth/login/</span>
          and expects the documented <span className="font-semibold text-white">login</span> and
          <span className="font-semibold text-white">password</span> fields.
        </p>
      </aside>
    </section>
  );
}
