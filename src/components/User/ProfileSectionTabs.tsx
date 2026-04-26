import React, { useEffect, useRef, useState } from 'react';

interface ProfileSectionTabsProps {
  sections: string[];
}

const SECTION_LABELS: Record<string, string> = {
  me: 'me!',
  recent_activity: 'Recent',
  top_ranks: 'Ranks',
  medals: 'Medals',
  historical: 'Historical',
  beatmaps: 'Beatmaps',
  kudosu: 'Kudosu!',
};

const ProfileSectionTabs: React.FC<ProfileSectionTabsProps> = ({ sections }) => {
  const [activeSection, setActiveSection] = useState<string>(sections[0] ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Observe each section div by its key
    const sectionEls = sections
      .map(s => document.getElementById(`section-${s}`))
      .filter(Boolean) as HTMLElement[];

    if (sectionEls.length === 0) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.id.replace('section-', '');
          setActiveSection(id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    sectionEls.forEach(el => observerRef.current!.observe(el));
    return () => observerRef.current?.disconnect();
  }, [sections]);

  const scrollTo = (section: string) => {
    const el = document.getElementById(`section-${section}`);
    if (el) {
      const offset = 80; // account for sticky header
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setActiveSection(section);
  };

  return (
    <div className="sticky top-0 z-20 bg-card border-b border-card overflow-x-auto">
      <div className="flex items-center px-3 md:px-6 lg:px-8 min-w-max">
        {sections.map(section => {
          const label = SECTION_LABELS[section] ?? section;
          const isActive = activeSection === section;
          return (
            <button
              key={section}
              onClick={() => scrollTo(section)}
              className={`
                relative px-3 md:px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
                ${isActive
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }
              `}
            >
              {label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-osu-pink rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileSectionTabs;