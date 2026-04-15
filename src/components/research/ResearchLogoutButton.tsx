'use client';

export default function ResearchLogoutButton() {
  return (
    <button
      type="button"
      className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
      onClick={async () => {
        await fetch('/research/api/auth', { method: 'DELETE', credentials: 'include' });
        window.location.href = '/research/login';
      }}
    >
      Log out
    </button>
  );
}
