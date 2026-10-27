import type { Metadata } from 'next';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Request password reset instructions for your District Hospital Araria account.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
