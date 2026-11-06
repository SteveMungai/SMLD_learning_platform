import { SearchX } from "lucide-react";
import StatePage from "@/components/StatePage";
import EmptyState from "@/components/EmptyState";

// Shown for any page that doesn't exist, and for lessons or assignments the person isn't allowed
// to open. We don't say which, so that nobody can use this to find out what exists.
export default function NotFound() {
  return (
    <StatePage>
      <EmptyState
        icon={SearchX}
        title="We couldn't open that page"
        actions={[{ href: "/lessons", label: "Go to my lessons", primary: true }, { href: "/", label: "Back to home" }]}
      >
        <p>It may have moved, or it may belong to a cohort you haven&apos;t been added to.</p>
        <p className="mt-2">If your lecturer sent you this link, ask them to check that your account is in their cohort.</p>
      </EmptyState>
    </StatePage>
  );
}
