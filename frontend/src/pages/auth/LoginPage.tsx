// frontend/src/pages/auth/LoginPage.tsx
import { CheckSquare } from 'lucide-react';
import LoginForm from '../../components/auth/LoginForm';

const FEATURES = [
  { title: 'Real-time Kanban board', desc: 'Drag and drop tasks with instant sync across all users' },
  { title: 'Role-based access control', desc: 'Admin, Manager, and User permission levels' },
  { title: 'Live collaboration', desc: 'WebSocket-powered updates — no page refresh needed' },
];

const LoginPage = () => {
  return (
    <div className="min-h-screen flex">
      {/* ── Left: Form panel ── */}
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

      {/* ── Right: Branded hero panel (desktop only) ── */}
      <div className="hidden lg:flex flex-1 bg-primary flex-col justify-center px-12 xl:px-16 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-4rem] right-[-4rem] w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute bottom-[-4rem] left-[-4rem] w-56 h-56 rounded-full bg-white/10" />

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">TaskFlow</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Manage your team's tasks with confidence
          </h2>
          <p className="text-white/75 text-base mb-10 leading-relaxed">
            A production-ready task management platform built with real-time
            WebSockets, role-based access, and a full Kanban board.
          </p>

          <div className="space-y-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{f.title}</p>
                  <p className="text-white/60 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
