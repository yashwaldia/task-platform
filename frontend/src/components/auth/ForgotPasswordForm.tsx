// frontend/src/components/auth/ForgotPasswordForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../hooks/useAuth';
import { forgotPasswordSchema } from '../../validations/schemas';
import { cn } from '../../lib/utils';

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordForm = () => {
  const { forgotPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (values: ForgotPasswordValues) =>
    forgotPassword.mutate(values.email);

  const serverError =
    forgotPassword.error instanceof Error
      ? ((forgotPassword.error as any)?.response?.data?.message ??
          forgotPassword.error.message)
      : null;

  // Success state
  if (forgotPassword.isSuccess) {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div>
          <p className="font-semibold text-foreground">Check your email</p>
          <p className="text-sm text-muted-foreground mt-1">
            If an account exists, a reset link has been sent.
          </p>
        </div>
        {/* Dev-mode token reveal */}
        {forgotPassword.data?.data?.resetToken && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
              Dev mode — Reset Token
            </p>
            <code className="text-xs text-amber-600 dark:text-amber-400 break-all">
              {forgotPassword.data.data.resetToken}
            </code>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="reset-email">Email address</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          className={cn(errors.email && 'border-destructive')}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={forgotPassword.isPending}
      >
        {forgotPassword.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send reset link'
        )}
      </Button>
    </form>
  );
};

export default ForgotPasswordForm;
