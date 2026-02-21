// frontend/src/pages/auth/SignupPage.tsx
import { CheckSquare } from 'lucide-react';
import SignupForm from '../../components/auth/SignupForm';

// ── Team preview data ───────────────────────────────────────────────────────────
const MEMBERS = [
  {
    initials: 'AT',
    name: 'Admin Tester',
    email: 'admin@test.com',
    role: 'Admin',
    roleColor: 'text-violet-400 bg-violet-400/15',
    avatarBg: 'bg-violet-500/70',
  },
  {
    initials: 'MT',
    name: 'Manager Tester',
    email: 'manager@test.com',
    role: 'Manager',
    roleColor: 'text-sky-400 bg-sky-400/15',
    avatarBg: 'bg-sky-500/70',
  },
  {
    initials: 'UT',
    name: 'User Tester',
    email: 'user@test.com',
    role: 'Member',
    roleColor: 'text-slate-400 bg-slate-400/15',
    avatarBg: 'bg-orange-500/70',
  },
];

const AVATAR_DOT_COLORS = [
  'bg-violet-500/70',
  'bg-sky-500/70',
  'bg-emerald-500/70',
  'bg-orange-500/70',
];

// ── Team preview visual ─────────────────────────────────────────────────────────
const TeamPreview = () => (
  <div className="relative mt-8">
    <div className="absolute -inset-4 bg-indigo-500/10 rounded-3xl blur-2xl pointer-events-none" />
    <div className="relative bg-white/[0.07] border border-white/[0.12] rounded-2xl p-4 shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-white/70 text-[10px] font-semibold tracking-widest">YOUR TEAM</span>
        </div>
        <div className="flex -space-x-1.5">
          {AVATAR_DOT_COLORS.map((bg, i) => (
            <div key={i} className={`w-5 h-5 rounded-full ${bg} border-2 border-[#020617]`} />
          ))}
          <div className="w-5 h-5 rounded-full bg-white/10 border-2 border-[#020617] flex items-center justify-center">
            <span className="text-[7px] text-white/50 font-bold">+8</span>
          </div>
        </div>
      </div>

      {/* Member rows */}
      <div className="space-y-2">
        {MEMBERS.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-2.5 bg-white/[0.05] rounded-xl p-2.5 border border-white/[0.08]"
          >
            <div className={`w-7 h-7 rounded-full ${m.avatarBg} flex items-center justify-center flex-shrink-0`}>
              <span className="text-[9px] text-white font-bold">{m.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white/90 text-[11px] font-medium truncate">{m.name}</div>
              <div className="text-white/35 text-[9px] truncate">{m.email}</div>
            </div>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${m.roleColor}`}>
              {m.role}
            </span>
          </div>
        ))}
      </div>

      {/* Invite row */}
      <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center gap-2">
        <div className="flex-1 h-7 bg-white/[0.04] border border-dashed border-white/10 rounded-lg flex items-center gap-1.5 px-2.5">
          <div className="w-3 h-3 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[8px] text-white/30 leading-none">+</span>
          </div>
          <span className="text-white/25 text-[9px]">Invite a team member...</span>
        </div>
        <div className="w-7 h-7 rounded-lg bg-indigo-500/30 border border-indigo-400/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white/80 text-sm font-bold leading-none">+</span>
        </div>
      </div>

      {/* Stats footer */}
      <div className="mt-3 pt-3 border-t border-white/[0.08] grid grid-cols-3 gap-1 text-center">
        {[
          { val: '12', label: 'Members', cls: 'text-white/80'    },
          { val: '3',  label: 'Roles',   cls: 'text-indigo-400'  },
          { val: '48', label: 'Tasks',   cls: 'text-emerald-400' },
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

// ── Page ───────────────────────────────────────────────────────────────────────
const SignupPage = () => {
  return (
    <div className="min-h-screen flex">

      {/* Left: Form panel */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-background">
        <div className="max-w-sm w-full mx-auto">

          <div className="flex items-center gap-2.5 mb-10">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
              <CheckSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">TaskFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Create your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Get started with TaskFlow for free today
            </p>
          </div>

          <SignupForm />

        </div>
      </div>

      {/* Right: Branded hero panel */}
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
          <div className="flex items-center gap-2.5 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 border border-white/20">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">TaskFlow</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Join your team on TaskFlow
          </h2>
          <p className="text-white/60 text-sm mb-5 leading-relaxed">
            Collaborate in real-time, manage tasks efficiently, and never miss a
            deadline. Your entire team, in one place.
          </p>

          {/* Role badges */}
          <div className="flex gap-2 mb-1">
            {[
              { label: 'Admin',   cls: 'text-violet-400 bg-violet-400/15 border-violet-400/20' },
              { label: 'Manager', cls: 'text-sky-400    bg-sky-400/15    border-sky-400/20'    },
              { label: 'Member',  cls: 'text-slate-300  bg-white/[0.07]  border-white/15'      },
            ].map((r) => (
              <span key={r.label} className={`text-xs font-semibold px-3 py-1 rounded-full border ${r.cls}`}>
                {r.label}
              </span>
            ))}
          </div>

          {/* Team preview visual */}
          <TeamPreview />

        </div>
      </div>

    </div>
  );
};

export default SignupPage;
