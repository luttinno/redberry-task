import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-[1800px] items-center justify-between border-t border-white/8 px-6 py-5 text-[9px] text-slate-500 sm:px-10 lg:px-12">
      <Link to="/" className="font-black tracking-wide text-white">
        KINO <span className="text-[#f43b24]">XII</span>
      </Link>
      <span>© 2026 Kino XII. All rights reserved.</span>
    </footer>
  );
}
