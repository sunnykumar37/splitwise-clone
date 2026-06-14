import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const baseLinkClasses =
  "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200";

const linkClasses = ({ isActive }) =>
  `${baseLinkClasses} ${
    isActive
      ? "bg-slate-900 text-white shadow-soft"
      : "text-slate-600 hover:bg-white hover:text-slate-900"
  }`;

export default function AppLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative min-h-screen text-slate-900">
      {/* Subtle page-wide background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-white via-indigo-50/60 to-violet-50/50" />
      <div className="pointer-events-none fixed -top-40 -right-40 -z-10 h-[480px] w-[480px] rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 -z-10 h-[480px] w-[480px] rounded-full bg-violet-200/30 blur-3xl" />
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
              SplitWise Clone
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              Shared expenses made simple.
            </h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/dashboard" className={linkClasses}>
              Dashboard
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-700"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
