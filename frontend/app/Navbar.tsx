"use client";
import Link from "next/link";
import { TABS } from "@/app/types/tabsTypes";

const Navbar = () => (
    <nav className="mx-auto w-fit rounded-lg bg-zinc-300 shadow-md">
        <div className="flex gap-1 rounded-lg p-2">
            {TABS.map((tab) => (
                <Link key={tab.key} href={tab.href}
                    className="rounded-md px-4 py-2 text-sm font-medium
                            text-zinc-700 transition hover:bg-zinc-100 hover:text-slate-800">
                    {tab.label}
                </Link>
            ))}
        </div>
    </nav>
);

export default Navbar;
