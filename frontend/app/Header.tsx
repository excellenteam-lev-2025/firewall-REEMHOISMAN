import "./globals.css";
import Image from "next/image";

const Header = () => (
    <header className="mx-auto mt-6 w-full max-w-7xl">
        <div className="rounded-2xl bg-white p-6 shadow-lg border border-zinc-200/30">
            <div className="flex items-center gap-4 mx-auto w-fit">
                <div className="w-12 h-12 bg-zinc-100 rounded-xl p-2 shadow-sm">
                    <Image
                        src="/firewall.png"
                        alt="firewall logo"
                        width={40}
                        height={40}
                        className="w-full h-full object-contain rounded-lg"
                        priority
                    />
                </div>

                <div className="leading-tight">
                    <h1 className="text-3xl font-bold tracking-wide text-zinc-950">
                        Firewall Dashboard
                    </h1>
                    <p className="text-lg text-zinc-600">
                        Welcome back, <span className="font-medium text-zinc-800">User</span>! Manage your firewall settings below
                    </p>
                </div>
            </div>
        </div>
    </header>
);

export default Header;
