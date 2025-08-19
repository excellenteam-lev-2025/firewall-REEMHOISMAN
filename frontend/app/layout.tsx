import "./globals.css";
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import Navbar from "@/app/Navbar";
import React from "react";

const RootLayout = ({ children }: { children: React.ReactNode }) =>(
    <html lang="en">
        <body>
            <Header />
            <Navbar />
            <main className="mx-auto mt-6 w-full max-w-4xl p-4">{children}</main>
            <Footer />
        </body>
    </html>
);

export default RootLayout;
