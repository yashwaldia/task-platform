// frontend/src/pages/auth/LoginPage.tsx
import { CheckSquare } from 'lucide-react';
import LoginForm from '../../components/auth/LoginForm';

// ── Mini Kanban preview — right-panel visual asset ─────────────────────────────
const DashboardPreview = () => (
  <div className="relative mt-6">
    <div className="absolute -inset-4 bg-indigo-500/10 rounded-3xl blur-2xl pointer-events-none" />
    <div className="relative bg-white/[0.07] border border-white/[0.12] rounded-2xl p-4 shadow-2xl">

      {/* Header bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-white/70 text-[10px] font-semibold tracking-widest">TASK BOARD</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-16 bg-white/10 rounded-md" />
          <div className="h-3.5 w-3.5 bg-white/10 rounded-md" />
        </div>
      </div>

      {/* Three Kanban columns */}
      <div className="grid grid-cols-3 gap-2">

        {/* TO DO */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-white/40 text-[9px] font-bold">TO DO</span>
            <span className="ml-auto text-[9px] text-white/30 bg-white/10 px-1 rounded">2</span>
          </div>
          <div className="space-y-1.5">
            <div className="bg-white/[0.07] rounded-xl p-2 border border-white/10">
              <div className="flex justify-between items-center mb-1.5">
                <div className="h-1.5 w-14 bg-white/35 rounded-full" />
                <span className="text-[8px] font-semibold text-red-400 bg-red-400/15 px-1 rounded-full">High</span>
              </div>
              <div className="h-1 w-10 bg-white/15 rounded-full mb-2" />
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 rounded-full bg-violet-500/70 flex items-center justify-center">
                  <span className="text-[7px] text-white font-bold">AT</span>
                </div>
                <div className="h-1 w-8 bg-white/10 rounded-full" />
              </div>
            </div>
            <div className="bg-white/[0.07] rounded-xl p-2 border border-white/10">
              <div className="flex justify-between items-center mb-1.5">
                <div className="h-1.5 w-10 bg-white/35 rounded-full" />
                <span className="text-[8px] font-semibold text-amber-400 bg-amber-400/15 px-1 rounded-full">Med</span>
              </div>
              <div className="h-1 w-7 bg-white/15 rounded-full mb-2" />
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 rounded-full bg-sky-500/70 flex items-center justify-center">
                  <span className="text-[7px] text-white font-bold">MT</span>
                </div>
                <div className="h-1 w-6 bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* IN PROGRESS */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-white/40 text-[9px] font-bold">ACTIVE</span>
            <span className="ml-auto text-[9px] text-white/30 bg-white/10 px-1 rounded">3</span>
          </div>
          <div className="space-y-1.5">
            <div className="bg-white/[0.07] rounded-xl p-2 border border-indigo-400/25">
              <div className="flex justify-between items-center mb-1.5">
                <div className="h-1.5 w-12 bg-white/35 rounded-full" />
                <span className="text-[8px] font-semibold text-red-400 bg-red-400/15 px-1 rounded-full">High</span>
              </div>
              <div className="h-1 w-9 bg-white/15 rounded-full mb-2" />
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 rounded-full bg-emerald-500/70 flex items-center justify-center">
                  <span className="text-[7px] text-white font-bold">YW</span>
                </div>
                <div className="h-1 w-7 bg-white/10 rounded-full" />
              </div>
            </div>
            <div className="bg-white/[0.07] rounded-xl p-2 border border-white/10">
              <div className="flex justify-between items-center mb-1.5">
                <div className="h-1.5 w-9 bg-white/35 rounded-full" />
                <span className="text-[8px] font-semibold text-green-400 bg-green-400/15 px-1 rounded-full">Low</span>
              </div>
              <div className="h-1 w-6 bg-white/15 rounded-full mb-2" />
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 rounded-full bg-orange-500/70 flex items-center justify-center">
                  <span className="text-[7px] text-white font-bold">UT</span>
                </div>
                <div className="h-1 w-4 bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* DONE */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-white/40 text-[9px] font-bold">DONE</span>
            <span className="ml-auto text-[9px] text-white/30 bg-white/10 px-1 rounded">4</span>
          </div>
          <div className="space-y-1.5">
            <div className="bg-white/[0.05] rounded-xl p-2 border border-white/[0.07]">
              <div className="flex justify-between items-center mb-1.5">
                <div className="h-1.5 w-11 bg-white/20 rounded-full" />
                <span className="text-[8px] font-semibold text-amber-400/60 bg-amber-400/10 px-1 rounded-full">Med</span>
              </div>
              <div className="h-1 w-8 bg-white/10 rounded-full mb-2" />
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 rounded-full bg-violet-500/50 flex items-center justify-center">
                  <span className="text-[7px] text-white/70 font-bold">AT</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
            <div className="bg-white/[0.05] rounded-xl p-2 border border-white/[0.07]">
              <div className="flex justify-between items-center mb-1.5">
                <div className="h-1.5 w-8 bg-white/20 rounded-full" />
                <span className="text-[8px] font-semibold text-green-400/60 bg-green-400/10 px-1 rounded-full">Low</span>
              </div>
              <div className="h-1 w-5 bg-white/10 rounded-full mb-2" />
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 rounded-full bg-sky-500/50 flex items-center justify-center">
                  <span className="text-[7px] text-white/70 font-bold">MT</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Stats footer */}
      <div className="mt-3 pt-3 border-t border-white/[0.08] grid grid-cols-4 gap-1 text-center">
        {[
          { val: '12', label: 'Total',   cls: 'text-white/80'    },
          { val: '5',  label: 'Active',  cls: 'text-amber-400'   },
          { val: '4',  label: 'Done',    cls: 'text-emerald-400' },
          { val: '3',  label: 'Overdue', cls: 'text-red-400'     },
        ].map((s) => (
          <div key={s.label}>
            <div className={`text-sm font-bold ${s.cls}`}>{s.val}</div>
            <div className="text-[9px] text-white/35">{s.label}</div>
          </div>
        ))}
      </div>

    </div>
  </div>
);

// ── Feature pill labels ─────────────────────────────────────────────────────────
const FEATURES = [
  'Real-time Kanban board',
  'Role-based access control',
  'Live collaboration',
];

// ── Page ───────────────────────────────────────────────────────────────────────
const LoginPage = () => {
  return (
    <div className="min-h-screen flex">

      {/* Left: Form panel */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-background">
        <div className="max-w-sm w-full mx-auto">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
              <CheckSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">TaskFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue to your workspace
            </p>
          </div>

          <LoginForm />

        </div>
      </div>

      {/* Right: Branded hero panel (desktop only) */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 50%, #020617 100%)' }}
      >
        {/* Decorative glows */}
        <div className="absolute top-[-4rem] right-[-4rem] w-80 h-80 rounded-full bg-indigo-600/15 blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-4rem] left-[-4rem] w-64 h-64 rounded-full bg-violet-600/15 blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full bg-indigo-500/[0.06] blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md">

          {/* Brand mark */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 border border-white/20">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">TaskFlow</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
            Manage your team&apos;s tasks with confidence
          </h2>

          {/* Description */}
          <p className="text-white/60 text-sm leading-relaxed">
            A production-ready task management platform built with real-time
            WebSockets, role-based access, and a full Kanban board.
          </p>

          {/* ① Dashboard preview card — appears first */}
          <DashboardPreview />

          {/* ② Feature pill tags — appears below the card */}
          <div className="flex flex-wrap gap-2 mt-5">
            {FEATURES.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 text-xs text-white/65 bg-white/[0.07] border border-white/10 rounded-full px-3 py-1"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                {f}
              </span>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;
