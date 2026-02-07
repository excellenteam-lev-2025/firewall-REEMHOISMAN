import Link from "next/link";

const Footer= () => (
        <footer className="mx-auto my-8 w-full max-w-4xl rounded-2xl bg-white p-4 text-xs text-zinc-600 shadow-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-zinc-600">© 2025 Firewall Dashboard — Built with Next.js & Tailwind</p>
                <nav aria-label="Footer sitemap">
                    <ul className="flex flex-wrap items-center gap-3">
                        <li><Link href="/" className="text-zinc-600 hover:text-zinc-950 transition">Home</Link></li>
                        <li><Link href="/firewall-rules" className="text-zinc-600 hover:text-zinc-950 transition">Rules</Link></li>
                    </ul>
                </nav>
            </div>
        </footer>
    );

export default Footer;
