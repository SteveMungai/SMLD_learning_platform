import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/** A full page (top bar and footer included) around a single message, for empty and error states. */
export default function StatePage({ heading, children }: { heading?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans antialiased">
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {heading && <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-6">{heading}</h1>}
        {children}
      </main>
      <Footer />
    </div>
  );
}
