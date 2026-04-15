import Link from 'next/link';

const links = [
  { href: '/research/dashboard', label: 'Overview' },
  { href: '/research/profiles', label: 'Profiles' },
  { href: '/research/dimensions', label: 'Dimensions' },
  { href: '/research/compare', label: 'Compare' },
] as const;

export default function ResearchNav() {
  return (
    <nav className="flex flex-wrap gap-3 border-b border-slate-700 pb-4 text-sm font-medium">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="rounded-md px-3 py-1.5 text-slate-200 hover:bg-slate-800 hover:text-white"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
