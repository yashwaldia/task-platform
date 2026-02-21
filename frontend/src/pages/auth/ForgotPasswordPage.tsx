// frontend/src/pages/auth/ForgotPasswordPage.tsx
import { Link } from 'react-router-dom';
import { CheckSquare, ArrowLeft } from 'lucide-react';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import { ROUTES } from '../../constants';

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
            <CheckSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">TaskFlow</span>
        </div>

        {/* Card */}
        <div className="bg-card border rounded-2xl shadow-sm p-8">
          <div className="mb-7">
            <h1 className="text-xl font-bold text-foreground mb-1">
              Forgot your password?
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send a reset link.
            </p>
          </div>

          <ForgotPasswordForm />

          <div className="mt-6 flex justify-center">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
