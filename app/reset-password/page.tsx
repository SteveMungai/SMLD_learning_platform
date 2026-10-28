import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import ResetPasswordForm from "@/components/ResetPasswordForm";

type PageProps = { searchParams: Promise<{ token?: string; email?: string }> };

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <AuthCard title="Link not valid">
        <p className="text-sm text-gray-600 text-center">
          This reset link is incomplete.{" "}
          <Link href="/forgot-password" className="font-semibold" style={{ color: "#E02020" }}>Request a new one</Link>.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle={email}>
      <ResetPasswordForm token={token} email={email} />
    </AuthCard>
  );
}
