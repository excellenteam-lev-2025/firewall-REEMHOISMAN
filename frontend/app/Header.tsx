import "./globals.css";
import Image from "next/image";

const Header = () => (
    <>
        <header className="mx-auto mt-4 w-full max-w-4xl rounded-2xl p-4 text-zinc-950">
            <div className="mb-4 flex items-center gap-3 mx-auto w-fit">
                <Image src="/firewall.png" alt="firewall logo" width={40} height={40} className="rounded-lg" priority/>
                <div className="leading-tight">
                    <h1 className="text-2xl font-bold tracking-wide">Firewall Dashboard</h1>
                    <p className="text-md text-zinc-600">Welcome back user! manage and view your firewall below</p>
                </div>
            </div>
        </header>
    </>
);

export default Header;
