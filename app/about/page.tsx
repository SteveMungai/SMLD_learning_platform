import React from 'react';
import { User } from 'lucide-react';
import Link from 'next/link';
import Footer from '@//components/Footer';
import Navbar from '@//components/Navbar';
// 1. The Data Contract: This exactly mirrors our future prisma schema
interface ContributorProfile {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  avatarUrl: string | null;
}

// 2. Custom SVG Components to bypass the Lucide trademark restrictions
const IconFacebook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="stroke-none">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const IconTwitter = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="stroke-none">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const IconInstagram = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

// 3. The mock database: We use this to unblock the frontend development
const MOCK_CONTRIBUTORS: ContributorProfile[] = [
  {
    id: "contributor-1",
    name: "Madam Jennifer",
    title: "Principal",
    bio: "Principal for the School of Ministry and Leadership Development.",
    avatarUrl: null,
  },
  {
    id: "contributor-2",
    name: "Rev. John Omondi",
    title: "Theology Instructor",
    bio: "Specializes in pastoral care and theological foundations.",
    avatarUrl: null,
  },
  {
    id: "contributor-3",
    name: "Dr. Alice Wanjiku",
    title: "Leadership Scholar",
    bio: "Focuses on organizational leadership and community development.",
    avatarUrl: null,
  },
  {
    id: "contributor-4",
    name: "Pst. David Mutua",
    title: "Ministry Facilitator",
    bio: "Guides practical ministry applications and student mentorship.",
    avatarUrl: null,
  },
  {
    id: "contributor-5",
    name: "Prof. Grace Odhiambo",
    title: "Curriculum Director",
    bio: "Designs and curates the educational journey for the Claycity Cohort.",
    avatarUrl: null,
  },
  {
    id: "contributor-6",
    name: "Mr. Samuel Kiptoo",
    title: "Operations Lead",
    bio: "Manages student enrollment, assignments, and platform administration.",
    avatarUrl: null,
  }
];

// 4. The UI component 
function ContributorCard({ contributor }: { contributor: ContributorProfile }) {
  return (
    <div className="flex items-center p-6 bg-white border border-gray-200 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition-all duration-200">
      <div className="flex-shrink-0 mr-5 bg-gray-50 p-3 rounded-full border border-gray-100">
        {contributor.avatarUrl ? (
          <img 
            src={contributor.avatarUrl} 
            alt={contributor.name} 
            className="w-10 h-10 rounded-full object-cover" 
          />
        ) : (
          <User size={36} className="text-gray-800 stroke-[1.25]" />
        )}
      </div>
      <div className="flex-grow min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {contributor.name}
        </h3>
        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
          {contributor.bio}
        </p>
      </div>
    </div>
  );
}

// 5. The Main Page
export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-black selection:bg-red-100 antialiased">
      <Navbar />

      {/* Main Content Layout */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-16">
        <section className="max-w-3xl mb-14">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
            Our Contributors
          </h1>
          <p className="text-[15px] text-gray-700 leading-relaxed font-normal">
            Meet the dedicated team of leaders and scholars who curate the spiritual and educational journey of School of Ministry and Leadership Development
          </p>
        </section>

        {/* Dynamic Grid mapping over our mock data */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_CONTRIBUTORS.map((contributor) => (
            <ContributorCard key={contributor.id} contributor={contributor} />
          ))}
        </section>
      </main>
        <Footer />
    </div>
  );
}