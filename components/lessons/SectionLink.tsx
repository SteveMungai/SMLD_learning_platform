import Link from "next/link";

// The small outlined "Notes >" / "Continue to questions >" button under each section.
export default function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-center mt-10">
      <Link href={href} className="rounded px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" style={{ border: "0.5px solid #d1d5db" }}>
        {children}{" "}
        <span aria-hidden="true">&gt;</span>
      </Link>
    </div>
  );
}
