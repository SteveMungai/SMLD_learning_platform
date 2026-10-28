import React from 'react';
import { User, BookOpenText, Building2, Users, MessageSquareText, ImageIcon } from 'lucide-react';
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

interface FocusArea {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
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
    name: "Calisto Odede",
    title: "Presdiding Bishop",
    bio: "Principal for the School of Ministry and Leadership Development.",
    avatarUrl: null,
  },
  {
    id: "contributor-2",
    name: "Patrick Kuchio",
    title: "Head of SAAG",
    bio: "Specializes in pastoral care and theological foundations.",
    avatarUrl: null,
  },
  {
    id: "contributor-3",
    name: "Jotham Munene",
    title: "Senior Pastor",
    bio: "Focuses on organizational leadership and community development.",
    avatarUrl: null,
  },
  {
    id: "contributor-4",
    name: "Dr John Ng'ang'a",
    title: "Businessman",
    bio: "Guides practical ministry applications and student mentorship.",
    avatarUrl: null,
  },
  {
    id: "contributor-5",
    name: "Gordon Odira",
    title: "Senior Pastor",
    bio: "Designs and curates the educational journey for the Claycity Cohort.",
    avatarUrl: null,
  },
  {
    id: "contributor-6",
    name: "Helen Maleche",
    title: "Operations Lead",
    bio: "Manages student enrollment, assignments, and platform administration.",
    avatarUrl: null,
  },

  {
    id: "contributor-7",
    name: " Maithya Muthama",
    title: "Senior Pastor",
    bio: "Oversees curriculum development and academic quality assurance.",
    avatarUrl: null,
  }
];

const FOCUS_AREAS: FocusArea[] = [
  {
    id: 'focus-1',
    title: 'BIBLICAL & THEOLOGICAL FOUNDATION',
    description: 'Builds a believer’s foundation through solid doctrine and intentional discipleship.',
    icon: <BookOpenText size={70} className="text-red-600 stroke-[1.5]" />,
  },
  {
    id: 'focus-2',
    title: 'CITAM AS AN ORGANISATION',
    description: 'Links biblical truth to the church and equips leaders to better grasp the context of their ministry.',
    icon: <Building2 size={70} className="text-red-600 stroke-[1.5]" />,
  },
  {
    id: 'focus-3',
    title: 'LEADERSHIP DEVELOPMENT',
    description: 'Prepares leaders to make discerning, ethical choices and serve with a Christ-centered vision.',
    icon: <Users size={70} className="text-red-600 stroke-[1.5]" />,
  },
  {
    id: 'focus-4',
    title: 'COMMUNICATION DEVELOPMENT & SOFT SKILLS',
    description: 'Helps leaders build clear communication abilities that strengthen ministry impact and collaboration.',
    icon: <MessageSquareText size={70} className="text-red-600 stroke-[1.5]" />,
  },
];

const FOCUS_CARD_STYLES = [
  {
    outer: 'border-red-100 bg-white shadow-[0_14px_30px_rgba(239,68,68,0.10)] hover:shadow-[0_20px_40px_rgba(239,68,68,0.14)]',
    iconWrap: 'bg-red-50 text-red-600 ring-red-100',
    title: 'text-red-950',
    chip: 'bg-red-100 text-red-700',
  },
  {
    outer: 'border-stone-200 bg-white shadow-[0_14px_30px_rgba(41,37,36,0.08)] hover:shadow-[0_20px_40px_rgba(41,37,36,0.12)]',
    iconWrap: 'bg-stone-100 text-stone-700 ring-stone-200',
    title: 'text-stone-900',
    chip: 'bg-stone-100 text-stone-700',
  },
  {
    outer: 'border-rose-100 bg-white shadow-[0_14px_30px_rgba(244,63,94,0.10)] hover:shadow-[0_20px_40px_rgba(244,63,94,0.14)]',
    iconWrap: 'bg-rose-50 text-rose-600 ring-rose-100',
    title: 'text-rose-950',
    chip: 'bg-rose-100 text-rose-700',
  },
  {
    outer: 'border-zinc-200 bg-white shadow-[0_14px_30px_rgba(39,39,42,0.08)] hover:shadow-[0_20px_40px_rgba(39,39,42,0.12)]',
    iconWrap: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
    title: 'text-zinc-900',
    chip: 'bg-zinc-100 text-zinc-700',
  },
];

// 4. The UI component 
function ContributorCard({ contributor }: { contributor: ContributorProfile }) {
  return (
    <article className="group h-full border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-5 py-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-[#f5f5f5] ring-1 ring-white">
          {contributor.avatarUrl ? (
            <img
              src={contributor.avatarUrl}
              alt={contributor.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={30} className="text-gray-800 stroke-[1.25]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[19px] font-bold tracking-[-0.02em] text-gray-900">
            {contributor.name}
          </h3>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-600">
            {contributor.title}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-5">
        <div className="mb-5 h-px w-20 bg-red-600" />
        <p className="text-[15px] leading-relaxed text-gray-700">
          {contributor.bio}
        </p>

        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            aria-label={`${contributor.name} on Facebook`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-white transition-colors duration-200 hover:bg-red-600"
          >
            <IconFacebook />
          </button>
          <button
            type="button"
            aria-label={`${contributor.name} on Twitter`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-white transition-colors duration-200 hover:bg-red-600"
          >
            <IconTwitter />
          </button>
          <button
            type="button"
            aria-label={`${contributor.name} on Instagram`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-white transition-colors duration-200 hover:bg-red-600"
          >
            <IconInstagram />
          </button>
        </div>
      </div>
    </article>
  );
}

// 5. The Main Page
export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-black selection:bg-red-100 antialiased">
      <Navbar />

      {/* Main Content Layout */}
      
      <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-16">

                {/* Speakers Section */}

        <section className="max-w-3xl mb-14">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
            Our Speakers
          </h1>
          <p className="text-[15px] text-gray-700 leading-relaxed font-normal">
            Meet some of the speakers who in the areas of leadership, ministry, and personal development. They bring a wealth of experience and knowledge to our platform, providing valuable insights and guidance to our learners.
          </p>
        </section>

                {/* Dynamic Grid mapping over our mock data for speakers */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_CONTRIBUTORS.map((contributor) => (
            <ContributorCard key={contributor.id} contributor={contributor} />
          ))}
        </section>

        {/* Aread of focus Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
              Areas of Focus 
            </h2>
            <p className="text-[18px] text-gray-700 leading-relaxed">
              Our program has been specially crafted to equip ministry workers with vital skills to serve the body of Christ with excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FOCUS_AREAS.map((area) => {
              return (
                <article
                  key={area.id}
                  className="group h-full border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-5 flex justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-gray-200 bg-[#f5f5f5]">
                      {area.icon}
                    </div>
                  </div>

                  <h3 className="text-center text-[18px] font-extrabold uppercase leading-tight tracking-[-0.02em] text-gray-900">
                    {area.title}
                  </h3>

                  <p className="mt-4 text-center text-[15px] leading-relaxed text-gray-700">
                    {area.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="-mx-6  py-6 ">
          <div className="grid items-center gap-8 md:grid-cols-[1.3fr_0.7fr]">
            <div>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-[#3a1e1d]">Leadership Development</h2>
              <div className="space-y-4 text-[15px] leading-relaxed text-[#2f2424]">
                <p>
                  The School of Ministry and Leadership Development (SMLD) is a pioneering initiative dedicated to nurturing the next generation of spiritual leaders. This falls under pillar 4 of the CITAM strategic plan (2016-2025). Our mission is to provide comprehensive training that combines theological education with practical leadership skills, empowering individuals to make a meaningful impact in their communities and beyond.
                </p>
                <ul className="list-disc space-y-2 pl-5 text-[#362728]">
                  <li>Discipleship, fellowship and pastoral care</li>
                  <li>To enhance growth transformation and multiplication of believers through intentional discipleship [SMLD is aligned to strategic objective 4 of pillar 4]</li>
                  <li>Develop ministry leaders and staff for effective ministry and service [It is one of the strategies of Strategic Objective 4]</li>
                </ul>
                <p>
                  Generally, leaders will go through a training programme to prepare them for service in their specific areas of ministry. The training will be done through a combination of online and in-person sessions, practical assignments, and mentorship opportunities. Our curriculum is designed to be flexible and accessible, allowing participants to learn at their own pace while still receiving the support and guidance they need to succeed.
                </p>
              </div>
            </div>

            <div className="flex h-full min-h-[260px] items-center justify-center overflow-hidden rounded-[24px] border border-[#efd6d1] bg-gradient-to-br from-[#f2dfdd] via-[#f9f3f1] to-[#f3e4e2] p-4 shadow-inner">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-[18px] border border-dashed border-[#c77a74] bg-[#fefcfb] text-center text-[#4d2d2d]">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f7e7e4] text-[#a63d3d]">
                  <ImageIcon size={32} className="stroke-[1.25]" />
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#8a4e4f]">Image Slot</p>
                <p className="mt-2 max-w-[180px] text-xs leading-relaxed text-[#5e4040]">
                  Add a leadership development image here.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Organizing team  Layout */}
      <div className="flex-grow max-w-6xl mx-auto w-full px-6 py-16">
        <section className="max-w-3xl mb-14">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
            Organizing team
          </h1>
          <p className="text-[15px] text-gray-700 leading-relaxed font-normal">
            Meet the team that has been instrumental in shaping the vision and execution of the School of Ministry and Leadership Development. Their dedication and expertise ensure that our programs are impactful, relevant, and transformative for all participants.
          </p>
        </section>

         {/* Dynamic Grid mapping over our mock data for contributors */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      id: "Emmanuel Mwaghesha",
                      name: "Emmanuel Mwaghesha",
                      title: "Guest Speaker",
                      bio: "Profile details coming soon.",
                      avatarUrl: null,
                    },
                    {
                      id: "new-contributor-2",
                      name: "Benard Awara",
                      title: "Guest Facilitator",
                      bio: "Profile details coming soon.",
                      avatarUrl: null,
                    },
                    {
                      id: "new-contributor-3",
                      name: "Joseph Mutuma",
                      title: "Guest Mentor",
                      bio: "Profile details coming soon.",
                      avatarUrl: null,
                    },
                    {
                      id: "new-contributor-4",
                      name: "Lucy Gikuma",
                      title: "Guest Mentor",
                      bio: "Profile details coming soon.",
                      avatarUrl: null,
                    },
                  ].map((contributor) => (
            <ContributorCard key={contributor.id} contributor={contributor} />
          ))}
        </section>

      </div>
      </main>

      <Footer />
    </div>
  );
}