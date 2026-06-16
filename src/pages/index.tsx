import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import RibaWarriorScore from "@/components/ribaWarrior";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} font-jakarta w-full`}
    >
      <main className="">
        <RibaWarriorScore />
      </main>
      {/* FOOTER */}
      <footer className="flex items-center justify-center border-t border-slate-200 pt-5 bg-white dark:bg-slate-900 text-black dark:text-white font-semibold">
        <div className="max-w-6xl mx-auto px-4 text-sm opacity-80 py-5">
          © {new Date().getFullYear()} Riba Free Foundation •{" "}
          <a
            className="underline"
            href="https://www.ribafree.org.uk"
            target="_blank"
            rel="noreferrer noopener"
          >
            ribafree.org.uk
          </a>
        </div>
      </footer>
    </div>
  );
}
