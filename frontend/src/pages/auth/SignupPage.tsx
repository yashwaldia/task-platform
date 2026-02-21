// frontend/src/pages/auth/SignupPage.tsx
import { CheckSquare } from 'lucide-react';
import SignupForm from '../../components/auth/SignupForm';

const SignupPage = () => {
  return (
    <div className="min-h-screen flex">
      {/* ── Left: Form panel ── */}
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

      {/* ── Right: Branded hero panel ── */}
      <div className="hidden lg:flex flex-1 bg-primary flex-col justify-center px-12 xl:px-16 relative overflow-hidden">
        <div className="absolute top-[-4rem] right-[-4rem] w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute bottom-[-4rem] left-[-4rem] w-56 h-56 rounded-full bg-white/10" />
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Join your team on TaskFlow
          </h2>
          <p className="text-white/75 text-base leading-relaxed">
            Collaborate in real-time, manage tasks efficiently, and never miss a
            deadline. Your entire team, in one place.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
