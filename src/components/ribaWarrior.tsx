/* eslint-disable @typescript-eslint/no-explicit-any */
import { Selection, ViewType } from "@/types";
import Head from "next/head";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import bgImg from "@/lib/lightMain.png";
import bgImg2 from "@/lib/darkMain.png"
import Llogo from "@/lib/logoLight.png"
import { Menu, X } from "lucide-react";
import { ThemeToggleSwitch } from "./toggleSwitch";

export default function RibaWarriorScore() {
  // --- UI routing ---
  const [view, setView] = useState<ViewType>("home");
  const [stage, setStage] = useState(1); // 1..4 (5th is results)
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [dark, setDark] = useState(false);

  // --- selections / answers ---
  const [sel, setSel] = useState<Selection>({
    pensionAmt: "",
    insAmt: "",
    savAmt: "",
    studAmt: "",
    mortAmt: "",
    plAmt: "",
    ccAmt: "",
    carAmt: "",
    stocksAmt: "",
    bondsAmt: "",
    reitAmt: "",
    cryptoAmt: "",
  });

  // --- refs ---
  const heroRef = useRef<HTMLCanvasElement | null>(null);
  const resultRef = useRef<HTMLCanvasElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  // --- theme toggle ---
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    // redraw hero donut when theme flips
    drawHero();
  }, [dark]);

  // --- draw hero donut (full ring, 1000 + RibaWarrior) ---
  const drawHero = () => {
    const c = heroRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = (c.width = 380);
    const h = (c.height = 380);
    const cx = w / 2,
      cy = h / 2,
      r = Math.min(cx, cy) - 20;
    ctx.clearRect(0, 0, w, h);
    const gradient = ctx.createLinearGradient(w, 0, 0, h);
    gradient.addColorStop(0, "#fafafa"); // Light teal/white highlight at top-right
    gradient.addColorStop(0.3, "#bceece"); // Bright green transitioning down
    gradient.addColorStop(1, "#017d4a"); // Deep emerald green at bottom-left
    ctx.lineWidth = 22;
    ctx.strokeStyle = gradient; // emerald-500
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    // slate-200 / slate-900
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font =
      "800 64px Manrope, system-ui, font-jakarta, font-extrabold, leading-none text-bgdrop";
    ctx.fillStyle = "#308865";
    ctx.fillText("1000", cx, cy - 24);
    ctx.fillStyle = dark ? "#e2e8f0" : "#0f172a"; 
    ctx.font = "700 36px Inter, system-ui, font-jakarta";
    ctx.fillText("RibaWarrior", cx, cy + 34);
  };
  useEffect(drawHero, [dark]);

  // --- helper: set selection in groups ---
  const setChoice = (group: string, value: string) => {
    setSel((prev) => ({
      ...prev,
      [group]: value,
    }));
  };
  const isYes = (g: string) => sel[g] === "yes";

  // --- stage validation ---
  const validateStage = (n: number) => {
    if (n === 1) {
      return (
        sel.gender &&
        sel.ageBand &&
        sel.employment &&
        sel.household &&
        (sel.country ?? "") !== ""
      );
    }
    if (n === 2) {
      return sel.pension && sel.ins && sel.sav;
    }
    if (n === 3) {
      const need = ["stud", "mort", "pl", "cc", "car", "od", "bnpl", "missed"];
      return need.every((k) => !!sel[k]);
    }
    if (n === 4) {
      return sel.stocks && sel.bonds && sel.reit && sel.crypto;
    }
    return true;
  };

  // --- scoring (computed only on Finish) ---
  function computeScore() {
    // b3 Self‑inflicted
    let b3 = 0;
    let m = 0; // multiplicity count of active self‑inflicted
    if (sel.stud === "yes" && sel.studInterest === "yes") {
      b3 += 100;
      m++;
    }
    if (sel.mort === "yes" && sel.mortIslamic === "no") {
      b3 += sel.mortMulti === "yes" ? 300 : 200; // split rule
      m++;
    }
    if (sel.pl === "yes" && sel.plType === "interest") {
      b3 += 150;
      m++;
    }
    if (sel.cc === "yes" && sel.ccPayFull === "no") {
      b3 += 150;
      m++;
    }
    if (sel.car === "yes" && sel.carIslamic === "no") {
      b3 += 100;
      m++;
    }
    if (sel.od === "yes") {
      b3 += 75;
      m++;
    }
    if (sel.bnpl === "yes") {
      b3 += 50;
      m++;
    }
    if (sel.missed === "few") b3 += 50;
    else if (sel.missed === "many") b3 += 100;
    const surcharge = Math.min(150, Math.max(0, (m - 2) * 25));
    b3 += surcharge;
    // overload guard (kept to mirror prior spec; already inside max, left as note)
    if (b3 > 500) b3 = 500;

    // b4 Investments
    let b4 = 0;
    if (sel.stocks === "yes" && sel.stocksSharia === "no") b4 += 75;
    if (sel.bonds === "yes" && sel.bondsType === "conv") b4 += 100;
    if (sel.reit === "yes" && sel.reitType === "debtHeavy") b4 += 75;
    if (sel.crypto === "yes" && sel.cryptoCore === "yes") b4 += 25;
    if (sel.crypto === "yes" && sel.cryptoRisk === "yes") b4 += 75;
    if (b4 > 300) b4 = 300;

    // b2 Regulated / need‑based
    let b2 = 0;
    if (sel.pension === "yes" && sel.pensionSharia === "no") b2 += 75;
    if (sel.ins === "yes" && sel.insTakaful === "no") b2 += 50;
    if (sel.sav === "yes") b2 += 50; // interest present (even if cleansed)
    if (b2 > 200) b2 = 200;

    // Base
    let base = 1000 - b3 - b4 - b2;
    base = Math.max(0, Math.min(1000, base));

    return { score: Math.round(base), b2, b3, b4, m };
  }

  const bandInfo = (score: number) => {
    if (score >= 900)
      return {
        name: "RibaWarrior",
        color: "#22c55e",
        desc: "Living free of riba",
      };
    if (score >= 700)
      return {
        name: "On the Path",
        color: "#fbbf24",
        desc: "Mostly clean; refine a few areas",
      };
    if (score >= 500)
      return {
        name: "Awakening",
        color: "#fb923c",
        desc: "Exposure present; change is possible",
      };
    if (score >= 300)
      return {
        name: "At Risk",
        color: "#ef4444",
        desc: "Heavily entangled; act soon",
      };
    return {
      name: "Riba Danger",
      color: "#111827",
      desc: "Deep reliance; urgent action",
    };
  };

  // --- results memo ---
  const results = useMemo(
    () => (view === "results" ? computeScore() : null),
    [view],
  );

  // --- draw results gauge (semi donut) ---
  useEffect(() => {
    if (view !== "results" || !results) return;
    const c = resultRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = (c.width = 420);
    const h = (c.height = 260);
    const cx = w / 2,
      cy = h - 20,
      r = Math.min(cx, cy) - 20;
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 22;
    // base track
    ctx.strokeStyle = dark ? "#334155" : "#e2e8f0";
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.stroke();
    // progress
    const band = bandInfo(results.score);
    ctx.strokeStyle = band.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, Math.PI + (results.score / 1000) * Math.PI);
    ctx.stroke();
    // text
    ctx.fillStyle = dark ? "#e2e8f0" : "#0f172a";
    ctx.textAlign = "center";
    ctx.font = "700 36px Manrope, system-ui, sans-serif";
    ctx.fillText(String(results.score), cx, cy - r / 2);
    ctx.font = "600 14px Inter, system-ui, sans-serif";
    ctx.fillText(band.name, cx, cy - r / 2 + 26);
  }, [view, results, dark]);

  // --- advice generation ---
  const adviceBundle = useMemo(() => {
    if (!results) return null;
    const adv: string[] = [];
    const impact: { k: string; v: number }[] = [];
    if (sel.mort === "yes" && sel.mortIslamic === "no") {
      adv.push("Explore Islamic (Sharia‑compliant) home finance options.");
      impact.push({ k: "Mortgage", v: sel.mortMulti === "yes" ? 300 : 200 });
    }
    if (sel.cc === "yes" && sel.ccPayFull === "no") {
      adv.push(
        "Switch to paying credit card in full monthly to stop interest charges.",
      );
      impact.push({ k: "Credit card", v: 150 });
    }
    if (sel.pl === "yes" && sel.plType === "interest") {
      adv.push(
        "Replace personal loan with interest‑free or Islamic alternative if possible.",
      );
      impact.push({ k: "Personal loan", v: 150 });
    }
    if (sel.car === "yes" && sel.carIslamic === "no") {
      adv.push("Consider Sharia‑compliant vehicle finance.");
      impact.push({ k: "Car finance", v: 100 });
    }
    if (sel.od === "yes") {
      adv.push("Build a small buffer to avoid overdraft fees/interest.");
      impact.push({ k: "Overdraft", v: 75 });
    }
    if (sel.bnpl === "yes") {
      adv.push("Avoid BNPL late fees; set reminders or pause BNPL use.");
      impact.push({ k: "BNPL", v: 50 });
    }
    if (sel.pension === "yes" && sel.pensionSharia === "no") {
      adv.push("Ask your provider about Sharia‑compliant pension funds.");
      impact.push({ k: "Pension", v: 75 });
    }
    if (sel.ins === "yes" && sel.insTakaful === "no") {
      adv.push(
        "Consider switching to takaful (Islamic) insurance where available.",
      );
      impact.push({ k: "Insurance", v: 50 });
    }
    if (sel.sav === "yes" && sel.savCleanse !== "yes") {
      adv.push(
        "If savings generate interest, plan how to cleanse/dispose of it.",
      );
      impact.push({ k: "Savings interest", v: 50 });
    }
    if (sel.bonds === "yes" && sel.bondsType === "conv") {
      adv.push("Shift from conventional bonds to sukuk options.");
      impact.push({ k: "Conventional bonds", v: 100 });
    }
    if (sel.reit === "yes" && sel.reitType === "debtHeavy") {
      adv.push("Prefer direct ownership or lower‑debt property vehicles.");
      impact.push({ k: "Debt‑heavy real estate", v: 75 });
    }
    if (sel.crypto === "yes" && sel.cryptoRisk === "yes") {
      adv.push(
        "Reduce exposure to DeFi/staking products with riba‑like mechanics.",
      );
      impact.push({ k: "Risky crypto", v: 75 });
    }
    while (adv.length < 5)
      adv.push(
        "Review expenses and automate payments to avoid missed charges.",
      );
    impact.sort((a, b) => b.v - a.v);
    const largest = impact[0]?.k || "No negative impacts detected.";
    return { adv, largest };
  }, [results]);

  // --- share links ---
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => {
    setPageUrl(
      encodeURIComponent(window.location.origin + window.location.pathname),
    );
  }, []);

  // --- download share image ---
  const downloadShare = () => {
    if (!results) return;
    const band = bandInfo(results.score);
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d")!;
    // bg
    const g = ctx.createLinearGradient(0, 0, 0, 630);
    g.addColorStop(0, "#1A2238");
    g.addColorStop(0.6, "#274154");
    g.addColorStop(1, "#0d1b2a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1200, 630);
    // title
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 54px Manrope, sans-serif";
    ctx.fillText("RibaWarrior Score", 60, 100);
    // gauge
    const cx = 360,
      cy = 420,
      r = 220;
    ctx.lineWidth = 28;
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.stroke();
    ctx.strokeStyle = band.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, Math.PI + (results.score / 1000) * Math.PI);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "800 84px Manrope, sans-serif";
    ctx.fillText(String(results.score), cx, cy - 30);
    ctx.font = "600 32px Manrope, sans-serif";
    ctx.fillText(band.name, cx, cy + 10);
    // right text
    ctx.textAlign = "left";
    ctx.font = "600 22px Inter, sans-serif";
    ctx.fillText("What it means", 700, 220);
    ctx.font = "400 20px Inter, sans-serif";
    ctx.fillText(band.desc, 700, 255);
    ctx.font = "600 20px Inter, sans-serif";
    ctx.fillText("Powered by Riba Free Foundation", 700, 560);
    ctx.font = "400 20px Inter, sans-serif";
    ctx.fillText("ribafree.org.uk/ribawarriorscore", 700, 590);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `RibaWarrior_${results.score}.png`;
    link.click();
  };

  // --- download CSV ---
  const downloadCsv = () => {
    const headers = Object.keys(allData());
    const values = headers.map((k) =>
      String((allData() as any)[k] ?? "").replace(/"/g, '""'),
    );
    const csv =
      headers.join(",") + "\n" + values.map((v) => `"${v}"`).join(",");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "riba_score_responses.csv";
    a.click();
    URL.revokeObjectURL(url);
    console.log(csv)
  };

  // --- email CSV (backend required) ---
  const [emailTo, setEmailTo] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const emailCsv = async () => {
    const headers = Object.keys(allData());
    const values = headers.map((k) =>
      String((allData() as any)[k] ?? "").replace(/"/g, '""'),
    );
    const csv =
      headers.join(",") + "\n" + values.map((v) => `"${v}"`).join(",");
    try {
      const res = await fetch("/api/send-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          csv,
          filename: "riba_score_responses.csv",
        }),
      });
      setEmailMsg(
        res.ok
          ? "Email sent successfully."
          : "Email failed — check server config.",
      );
    } catch (e) {
      setEmailMsg("Network error sending email.");
    }
  };

  // --- collect all answers including optional amounts ---
  const allData = () => ({
    gender: sel.gender,
    name: userName,
    email: userEmail,
    ageBand: sel.ageBand,
    employment: sel.employment,
    household: sel.household,
    country: sel.country,

    pension: sel.pension,
    pensionSharia: sel.pensionSharia,
    pensionAmt: sel.pensionAmt,

    ins: sel.ins,
    insTakaful: sel.insTakaful,
    insAmt: sel.insAmt,

    sav: sel.sav,
    savCleanse: sel.savCleanse,
    savAmt: sel.savAmt,

    stud: sel.stud,
    studInterest: sel.studInterest,
    studAmt: sel.studAmt,

    mort: sel.mort,
    mortIslamic: sel.mortIslamic,
    mortMulti: sel.mortMulti,
    mortAmt: sel.mortAmt,

    pl: sel.pl,
    plType: sel.plType,
    plAmt: sel.plAmt,

    cc: sel.cc,
    ccPayFull: sel.ccPayFull,
    ccAmt: sel.ccAmt,

    car: sel.car,
    carIslamic: sel.carIslamic,
    carAmt: sel.carAmt,

    od: sel.od,
    bnpl: sel.bnpl,
    missed: sel.missed,

    stocks: sel.stocks,
    stocksSharia: sel.stocksSharia,
    stocksAmt: sel.stocksAmt,

    bonds: sel.bonds,
    bondsType: sel.bondsType,
    bondsAmt: sel.bondsAmt,

    reit: sel.reit,
    reitType: sel.reitType,
    reitAmt: sel.reitAmt,

    crypto: sel.crypto,
    cryptoCore: sel.cryptoCore,
    cryptoRisk: sel.cryptoRisk,
    cryptoAmt: sel.cryptoAmt,
  });

  // --- simple modal primitives ---
  const [showHow, setShowHow] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // --- reset function ---
  const resetTest = () => {
    // setSel({});
    // setStage(1);
    // setView("home");
    window.location.reload();
  };

  // --- reusable components ---
  const Chip = ({ children }: { children: React.ReactNode }) => (
    <span className="chip ml-2 rounded-full px-2 py-0.5 text-[0.85rem] font-semibold bg-emerald-100 text-emerald-900 dark:bg-emerald-700 dark:text-white">
      {children}
    </span>
  );
  const Group = ({
    label,
    group,
    options,
  }: {
    label: string;
    group: string;
    options: { label: string; value: string }[];
  }) => (
    <div className="flex flex-col gap-2">
      <div className="font-semibold">{label}</div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`px-3 py-2 rounded border ${sel[group] === o.value ? "bg-emerald-600 text-white border-emerald-700" : "border-slate-300 dark:border-slate-700"}`}
            data-checked={sel[group] === o.value}
            onClick={() => setChoice(group, o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );

  const Slide = ({
    when,
    children,
  }: {
    when: boolean;
    children: React.ReactNode;
  }) => (
    <div
      className={`overflow-hidden transition-[max-height] duration-300 ${when ? "max-h-96" : "max-h-0"}`}
    >
      {children}
    </div>
  );

  return (
    <div className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 min-h-screen">
      <Head>
        <title>RibaWarrior Score - Riba Free Foundation</title>
        <meta
          name="description"
          content="Understand your RibaWarrior Score and learn how to reduce your exposure to riba"
        />
      </Head>

      {/* NAV */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/60 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-5 font-jakarta font-medium text-base leading-none">
          <a
            href="https://www.ribafree.org.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3"
          >
            <Image
              src="https://i.ibb.co/TqgPvv97/cropped-RFF-01-1.png"
              alt="Riba Free Foundation"
              className="h-10 w-auto dark:hidden"
              width={80}
              height={40}
            />
            <Image
              src={Llogo}
              alt="Riba Free Foundation"
              className="h-10 w-auto hidden dark:block"
              width={80}
              height={40}
            />
          </a>
          
          <nav className="hidden md:flex items-center gap-4 md:gap-10 lg:gap-15">
            <button
              onClick={() => setShowHow(true)}
              className="font-semibold hover:underline"
            >
              How it works
            </button>
            <button
              onClick={() => setShowPrivacy(true)}
              className="font-semibold hover:underline"
            >
              Privacy
            </button>
            <a
              href="https://www.ribafree.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
            >
              Main site
            </a>
          </nav>
          <ThemeToggleSwitch dark={dark} setDark={setDark} />
          {/* <button onClick={() => setDark((d) => !d)} className="ml-2 text-sm px-3 py-1 rounded bg-slate-200 dark:bg-slate-800">
              Toggle theme
            </button> */}
          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-background hover:bg-accent md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div className="border-t bg-foreground/95 backdrop-blur md:hidden font-jakarta">
            <nav className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-background transition-colors hover:bg-accent"
              >
                How it works
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-background transition-colors hover:bg-accent"
              >
                Privacy
              </button>
              <a
                href="https://www.ribafree.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent"
                onClick={() => setMobileOpen(false)}
              >
                Main site
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* HOME */}
      {view === "home" && (
        <>
          <div className="relative w-full overflow-hidden">
            <Image
              src={bgImg}
              alt="BackgroundImg"
              className="absolute top-0 left-0 object-cover w-full h-[666px] dark:hidden"
            />
            <Image
              src={bgImg2}
              alt="BackgroundImg"
              className="absolute top-0 left-0 object-cover w-full h-[666px] hidden dark:block "
            />
            <section
              id="home"
              className="relative max-w-6xl mx-auto px-2 py-10 "
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-50 items-center z-5 font-jakarta ">
                <div className="lg:min-w-120">
                  <h1 className="text-3xl  md:text-5xl font-extrabold tracking-tight ">
                    Understand your{" "}
                    <span className="text-emerald-600 ">Riba Warrior</span>{" "}
                    Score
                  </h1>
                  <p className="mt-4 text-sm md:text-lg opacity-80 ">
                    See your exposure today, learn what it means, and get
                    practical steps to reduce it — in{" "}
                    <span className="text-emerald-600 ">3 minutes</span>, 4
                    simple blocks, no email required.
                  </p>
                  <p className="mt-3 text-sm md:text-lg opacity-70 ">
                    Designed with compassion. Mostly Yes/No questions. Optional
                    amounts never affect your score.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => { // Changed to preTest view
                        setView("preTest");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="px-5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                    >
                      Start the test
                    </button>
                    <button
                      onClick={() => setShowHow(true)}
                      className="px-5 py-1.5 rounded-lg border border-slate-700 font-semibold "
                    >
                      How it works
                    </button>
                  </div>
                </div>
                <div className="card p-6 grid gap-4 place-items-center">
                  <canvas
                    ref={heroRef}
                    width={380}
                    height={380}
                    aria-label="RibaWarrior 1000 logo"
                    className="w-60 md:w-80 lg:w-90"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Video, half-height with overlay */}
          <section id="homeVideo" className="max-w-6xl mx-auto px-4 mt-20">
            <div className="card p-4 bg-white dark:bg-slate-800">
              <h2 className="text-3xl font-semibold leading-none text-center mb-8 font-jakarta">
                Watch: Why the RibaWarrior Score matters
              </h2>
              <div className="relative rounded-xl overflow-hidden shadow-xl outline outline-2 outline-emerald-400/20 hover:shadow-emerald-500/30 transition-transform duration-200 hover:scale-[1.01]">
                {/* overlay play icon */}
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-white/85 shadow-2xl grid place-items-center">
                    <svg
                      width="34"
                      height="34"
                      viewBox="0 0 24 24"
                      fill="#22c55e"
                      xmlns="http://www.w3.org/2000/svg"
                      className="ml-1"
                    >
                      <path d="M8 5v14l11-7L8 5z" />
                    </svg>
                  </div>
                </div>
                <iframe
                  className="w-full h-[451px]"
                  src="https://www.youtube.com/embed/AgXoLgeHQiU"
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-xs opacity-70 mt-2">
                Shorts link:{" "}
                <a
                  className="underline"
                  href="https://www.youtube.com/shorts/AgXoLgeHQiU?feature=share"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  open in YouTube
                </a>
              </p>
            </div>
          </section>
        </>
      )}

      {/* PRE-TEST VIEW */}
      {view === "preTest" && (
        <section id="preTest" className="max-w-md mx-auto px-4 pb-24 pt-15 font-jakarta ">
          <div className="card p-6 bg-white dark:bg-slate-800">
            <h2 className="text-2xl font-extrabold mb-4 text-center">RibaWarrior Test</h2>
            <p className="text-sm opacity-80 mb-4 text-center">
              Help us understand you better so we can calculate your Riba exposure and guide you towards a Riba free life. 
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-1">
                  Email 
                </label>
                <input
                  type="email"
                  id="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
            </div>
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => { // Validate name and email before proceeding
                  if (!userName.trim() || !userEmail.trim()) {
                    alert("Please enter your full name and email to continue.");
                    return;
                  }
                  setView("test");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-10 md:px-20 py-3 rounded-lg bg-emerald-600 text-white font-semibold"
              >
                Continue to Test
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TEST */}
      {view === "test" && (
        <section id="test" className="max-w-4xl mx-auto px-4 pb-24 pt-15">
          <h2 className="text-3xl font-extrabold mb-6">RibaWarrior Test</h2>

          {/* Progress */}
          <div className="mb-6 flex items-center gap-2 text-sm">
            <div className="font-semibold">Stage {stage} of 5</div>
            <div className="h-2 flex-1 bg-slate-200 dark:bg-slate-800 rounded">
              <div
                className="h-2 bg-emerald-600 rounded"
                style={{ width: `${(stage / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* STAGE 1 */}
          {stage === 1 && (
            <div className="card p-6 bg-white dark:bg-slate-800">
              <h3 className="text-xl font-bold mb-4">Block 1 — About You</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded bg-emerald-50/40 dark:bg-emerald-900/20">
                  <Group
                    label="Gender*"
                    group="gender"
                    options={[
                      { label: "Male", value: "Male" },
                      { label: "Female", value: "Female" },
                    ]}
                  />
                </div>
                <div className="p-4 rounded bg-emerald-100/30 dark:bg-emerald-900/30">
                  <Group
                    label="Age band*"
                    group="ageBand"
                    options={[
                      { label: "<20", value: "<20" },
                      { label: "20–29", value: "20–29" },
                      { label: "30–39", value: "30–39" },
                      { label: "40–49", value: "40–49" },
                      { label: "50–59", value: "50–59" },
                      { label: "60–70", value: "60–70" },
                    ]}
                  />
                </div>
                <div className="p-4 rounded bg-emerald-50/40 dark:bg-emerald-900/20">
                  <Group
                    label="Employment status*"
                    group="employment"
                    options={[
                      { label: "Employed", value: "Employed" },
                      {
                        label: "Self‑employed / Business owner",
                        value: "Self-employed / Business owner",
                      },
                      { label: "Unemployed", value: "Unemployed" },
                      { label: "Student", value: "Student" },
                      { label: "Retired", value: "Retired" },
                    ]}
                  />
                </div>
                <div className="p-4 rounded bg-emerald-100/30 dark:bg-emerald-900/30">
                  <Group
                    label="Household type*"
                    group="household"
                    options={[
                      { label: "Single", value: "Single" },
                      {
                        label: "Married / Family with dependents",
                        value: "Married / Family with dependents",
                      },
                      { label: "Other", value: "Other" },
                    ]}
                  />
                </div>
                <div className="p-4 rounded bg-emerald-50/40 dark:bg-emerald-900/20 md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">
                    Country*
                  </label>
                  <select
                    value={sel.country ?? ""}
                    onChange={(e) => setChoice("country", e.target.value)}
                    className="w-full rounded border p-2 bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700"
                  >
                    <option value="">Select</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="US">United States (US)</option>
                    <option value="AE">United Arab Emirates (AE)</option>
                    <option value="SA">Saudi Arabia (SA)</option>
                    <option value="BD">Bangladesh (BD)</option>
                    <option value="PK">Pakistan (PK)</option>
                    <option value="IN">India (IN)</option>
                    <option value="MY">Malaysia (MY)</option>
                    <option value="ZA">South Africa (ZA)</option>
                    <option value="CA">Canada (CA)</option>
                    <option value="AU">Australia (AU)</option>
                    <option value="NG">Nigeria (NG)</option>
                    <option value="FR">France (FR)</option>
                    <option value="DE">Germany (DE)</option>
                    <option value="SG">Singapore (SG)</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <p className="text-xs mt-1 opacity-70">
                    Prototype subset; replace with full ISO‑3166 in production.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (!validateStage(1))
                      return alert("Please complete all About You fields.");
                    setStage(2);
                  }}
                  className="px-5 py-3 rounded-lg bg-emerald-600 text-white font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2 */}
          {stage === 2 && (
            <div className="card p-6 bg-white dark:bg-slate-800">
              <h3 className="text-xl font-bold mb-4">
                Block 2 — Regulated / Need‑based
              </h3>
              <div className="space-y-4">
                {/* Pension */}
                <div className="p-4 rounded bg-emerald-50/40 dark:bg-emerald-900/20">
                  <Group
                    label="Do you contribute to a pension / retirement fund?"
                    group="pension"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {isYes("pension") && (
                    <div className="mt-2 p-3 rounded border dark:border-slate-700">
                      <Group
                        label="Is it Sharia‑compliant?"
                        group="pensionSharia"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" },
                        ]}
                      />
                      <input
                        placeholder="Optional amount (£)"
                        className="mt-2 w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                        value={sel["pensionAmt"] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setChoice("pensionAmt", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
                {/* Insurance */}
                <div className="p-4 rounded bg-emerald-100/30 dark:bg-emerald-900/30">
                  <Group
                    label="Do you have insurance (home, health, car, life)?"
                    group="ins"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {isYes("ins") && (
                    <div className="mt-2 p-3 rounded border dark:border-slate-700">
                      <Group
                        label="Is any policy takaful (Islamic)?"
                        group="insTakaful"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" },
                        ]}
                      />
                      <input
                        placeholder="Optional monthly premium (£)"
                        className="mt-2 w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                        value={sel["insAmt"] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setChoice("insAmt", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
                {/* Savings */}
                <div className="p-4 rounded bg-emerald-50/40 dark:bg-emerald-900/20">
                  <Group
                    label="Do you have a savings account that generates interest?"
                    group="sav"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {isYes("sav") && (
                    <div className="mt-2 p-3 rounded border dark:border-slate-700">
                      <Group
                        label="Do you know how to cleanse/dispose of the interest?"
                        group="savCleanse"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" },
                        ]}
                      />
                      <input
                        placeholder="Optional average balance (£)"
                        className="mt-2 w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                        value={sel["savAmt"] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setChoice("savAmt", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStage(1)}
                  className="px-5 py-3 rounded-lg bg-black text-white font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!validateStage(2))
                      return alert(
                        "Please answer all questions in this block.",
                      );
                    setStage(3);
                  }}
                  className="px-5 py-3 rounded-lg bg-emerald-600 text-white font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3 */}
          {stage === 3 && (
            <div className="card p-6 bg-white dark:bg-slate-800">
              <h3 className="text-xl font-bold mb-4">
                Block 3 — Self‑inflicted (Debt & Credit)
              </h3>
              <div className="space-y-4">
                {/* Student */}
                <div className="p-4 rounded bg-emerald-50/40 dark:bg-emerald-900/20">
                  <Group
                    label="Do you have a student loan?"
                    group="stud"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {isYes("stud") && (
                    <div className="mt-2 p-3 rounded border dark:border-slate-700">
                      <Group
                        label="Is it interest‑based?"
                        group="studInterest"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" },
                        ]}
                      />
                      <input
                        placeholder="Optional balance (£)"
                        className="mt-2 w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                        value={sel["studAmt"] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setChoice("studAmt", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Mortgage */}
                <div className="p-4 rounded bg-emerald-100/30 dark:bg-emerald-900/30">
                  <Group
                    label="Do you currently have a mortgage?"
                    group="mort"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {isYes("mort") && (
                    <div className="mt-2 p-3 rounded border dark:border-slate-700 space-y-2">
                      <Group
                        label="Is it Islamic (Sharia‑compliant)?"
                        group="mortIslamic"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" },
                        ]}
                      />
                      <Group
                        label="Do you have more than one mortgage?"
                        group="mortMulti"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" },
                        ]}
                      />
                      <input
                        placeholder="Optional outstanding balance (£)"
                        className="w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                        value={sel["mortAmt"] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setChoice("mortAmt", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Personal loan */}
                <div className="p-4 rounded bg-emerald-50/40 dark:bg-emerald-900/20">
                  <Group
                    label="Do you have a personal loan?"
                    group="pl"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {isYes("pl") && (
                    <div className="mt-2 p-3 rounded border dark:border-slate-700">
                      <Group
                        label="Is it interest‑free or Islamic?"
                        group="plType"
                        options={[
                          { label: "Interest‑free", value: "interestFree" },
                          { label: "Islamic", value: "islamic" },
                          { label: "Interest‑based", value: "interest" },
                        ]}
                      />
                      <input
                        placeholder="Optional balance (£)"
                        className="mt-2 w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                        value={sel["plAmt"] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setChoice("plAmt", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Credit card */}
                <div className="p-4 rounded bg-emerald-100/30 dark:bg-emerald-900/30">
                  <Group
                    label="Do you have a credit card?"
                    group="cc"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {isYes("cc") && (
                    <div className="mt-2 p-3 rounded border dark:border-slate-700">
                      <Group
                        label="Do you always pay the full balance before interest?"
                        group="ccPayFull"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" },
                        ]}
                      />
                      <input
                        placeholder="Optional current balance (£)"
                        className="mt-2 w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                        value={sel["ccAmt"] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setChoice("ccAmt", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Car finance */}
                <div className="p-4 rounded bg-emerald-50/40 dark:bg-emerald-900/20">
                  <Group
                    label="Car finance / lease?"
                    group="car"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {isYes("car") && (
                    <div className="mt-2 p-3 rounded border dark:border-slate-700">
                      <Group
                        label="Is it Sharia‑compliant?"
                        group="carIslamic"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" },
                        ]}
                      />
                      <input
                        placeholder="Optional outstanding (£)"
                        className="mt-2 w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                        value={sel["carAmt"] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setChoice("carAmt", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Overdraft */}
                <div className="p-4 rounded bg-emerald-100/30 dark:bg-emerald-900/30">
                  <Group
                    label="Overdraft used with interest/charges in last 12 months?"
                    group="od"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                </div>

                {/* BNPL */}
                <div className="p-4 rounded bg-emerald-50/40 dark:bg-emerald-900/20">
                  <Group
                    label="Buy Now, Pay Later (any late fees/interest)?"
                    group="bnpl"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                </div>

                {/* Missed payments */}
                <div className="p-4 rounded bg-emerald-100/30 dark:bg-emerald-900/30">
                  <Group
                    label="Missed payments in last 24 months?"
                    group="missed"
                    options={[
                      { label: "None", value: "none" },
                      { label: "Occasional (1–2)", value: "few" },
                      { label: "Frequent (3+)", value: "many" },
                    ]}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStage(2)}
                  className="px-5 py-3 rounded-lg bg-black text-white font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!validateStage(3))
                      return alert(
                        "Please answer all questions in this block.",
                      );
                    setStage(4);
                  }}
                  className="px-5 py-3 rounded-lg bg-emerald-600 text-white font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STAGE 4 */}
          {stage === 4 && (
            <div className="card p-6 bg-white dark:bg-slate-800">
              <h3 className="text-xl font-bold mb-4">
                Block 4 — Personal Investments
              </h3>
              <div className="space-y-4">
                {/* Stocks */}
                <div className="p-4 rounded bg-emerald-50/40 dark:bg-emerald-900/20">
                  <Group
                    label="Stocks / funds?"
                    group="stocks"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {isYes("stocks") && (
                    <div className="mt-2 p-3 rounded border dark:border-slate-700">
                      <Group
                        label="Sharia‑compliant funds?"
                        group="stocksSharia"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" },
                        ]}
                      />
                      <input
                        placeholder="Optional value (£)"
                        className="mt-2 w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                        value={sel["stocksAmt"] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setChoice("stocksAmt", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Bonds */}
                <div className="p-4 rounded bg-emerald-100/30 dark:bg-emerald-900/30">
                  <Group
                    label="Bonds / fixed‑income?"
                    group="bonds"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {isYes("bonds") && (
                    <div className="mt-2 p-3 rounded border dark:border-slate-700">
                      <Group
                        label="Sukuk (Islamic) vs conventional?"
                        group="bondsType"
                        options={[
                          { label: "Sukuk", value: "sukuk" },
                          { label: "Conventional", value: "conv" },
                        ]}
                      />
                      <input
                        placeholder="Optional value (£)"
                        className="mt-2 w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                        value={sel["bondsAmt"] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setChoice("bondsAmt", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Real estate */}
                <div className="p-4 rounded bg-emerald-50/40 dark:bg-emerald-900/20">
                  <Group
                    label="Real estate investing?"
                    group="reit"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {isYes("reit") && (
                    <div className="mt-2 p-3 rounded border dark:border-slate-700">
                      <Group
                        label="Direct ownership or debt‑heavy (e.g., REITs)?"
                        group="reitType"
                        options={[
                          { label: "Direct", value: "direct" },
                          { label: "Debt‑heavy", value: "debtHeavy" },
                        ]}
                      />
                      <input
                        placeholder="Optional value (£)"
                        className="mt-2 w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                        value={sel["reitAmt"] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setChoice("reitAmt", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Crypto */}
                <div className="p-4 rounded bg-emerald-100/30 dark:bg-emerald-900/30">
                  <Group
                    label="Crypto assets?"
                    group="crypto"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {isYes("crypto") && (
                    <div className="mt-2 p-3 rounded border dark:border-slate-700 space-y-2">
                      <Group
                        label="Core (BTC, ETH, XRP)?"
                        group="cryptoCore"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" },
                        ]}
                      />
                      <Group
                        label="Higher‑risk (DeFi, staking/lending)?"
                        group="cryptoRisk"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" },
                        ]}
                      />
                      <input
                        placeholder="Optional value (£)"
                        className="w-full rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                        value={sel["cryptoAmt"] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setChoice("cryptoAmt", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStage(3)}
                  className="px-5 py-3 rounded-lg bg-black text-white font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!validateStage(4))
                      return alert(
                        "Please answer all questions in this block.",
                      );
                    setView("results");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-5 py-3 rounded-lg bg-emerald-600 text-white font-semibold"
                >
                  Finish
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* RESULTS */}
      {view === "results" && results && (
        <section
          id="results"
          className="w-full max-w-6xl mx-auto px-2 sm:px-4 pb-24 font-jakarta"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="w-full card p-4 sm:p-6 bg-white dark:bg-slate-800">
              <h2 className="text-2xl font-extrabold mb-2">Your Results</h2>
              <canvas
                ref={resultRef}
                width={420}
                height={260}
                className="w-full "
              />
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-3xl font-black">{results.score}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[0.85rem] font-semibold whitespace-nowrap"
                    style={{
                      background: bandInfo(results.score).color,
                      color:
                        bandInfo(results.score).name === "Riba Danger"
                          ? "#fff"
                          : "#111827",
                    }}
                  >
                    {bandInfo(results.score).name}
                  </span>
                </div>
                <div className="rounded-full py-1 text-[0.85rem] font-semibold bg-teal-700 px-5 shadow border-slate-300 dark:border-slate-700 w-fit">
                  <button
                    onClick={resetTest}
                    className="cursor-pointer text-xl font-black focus:outline-none"
                  >
                    Reset
                  </button>
                  
                </div>
              </div>
            </div>
            <div className="card p-4 sm:p-6 bg-white dark:bg-slate-800">
              <h2 className="text-2xl font-extrabold mb-2">AI Advice</h2>
              <p className="text-sm mb-3 opacity-80">
                Largest impact on your score: {adviceBundle?.largest}
              </p>
              <ul className="list-disc ml-6 space-y-2">
                {adviceBundle?.adv.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Share Image + CSV */}
          <div className="card p-4 sm:p-6 bg-white dark:bg-slate-800 mt-6">
            <h3 className="text-xl font-bold mb-2">Download Share Image</h3>
            <p className="text-sm opacity-80 mb-3">
              Your image will show the donut with your number inside and the
              band caption. Try it:{" "}
              <strong>ribafree.org.uk/ribawarriorscore</strong>
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={downloadShare}
                className="cursor-pointer px-4 py-2 rounded bg-emerald-600 text-white font-semibold"
              >
                Download image
              </button>
              <button
                onClick={downloadCsv}
                className="cursor-pointer px-4 py-2 rounded bg-slate-200 dark:bg-slate-800 font-semibold"
              >
                Download CSV
              </button>
            </div>
          </div>

          {/* Encourage sharing */}
          <div className="card p-4 sm:p-6 bg-white dark:bg-slate-800 mt-6">
            <h3 className="text-xl font-bold mb-2">Spread the word</h3>
            <p className="text-sm opacity-80 mb-3">
              Save your dashboard image and share it on your social channels
              below.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `I did the RibaWarrior Test — my score was ${results.score} (${bandInfo(results.score).name}). Try it:`,
                )}&url=${pageUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded bg-slate-200 dark:bg-slate-700"
              >
                X / Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded bg-slate-200 dark:bg-slate-700"
              >
                LinkedIn
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `I did the RibaWarrior Test — my score was ${results.score} (${bandInfo(results.score).name}). Try it:`,
                )}%20${pageUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded bg-slate-200 dark:bg-slate-700"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded bg-slate-200 dark:bg-slate-700"
              >
                Facebook
              </a>
            </div>

            
            {/* sent email to user  */}

            {/* <div className="mt-4">
              <h4 className="font-bold mb-1">Email your CSV</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="you@domain.com"
                  className="flex-1 rounded border p-2 dark:bg-slate-900 dark:border-slate-700"
                />
                <button
                  onClick={emailCsv}
                  className="px-3 py-2 rounded bg-emerald-600 text-white"
                >
                  Email CSV
                </button>
              </div>
              <p className="text-sm mt-2 opacity-80">{emailMsg}</p>
            </div> */}
          </div>
        </section>
      )}

      {/* HOW IT WORKS MODAL */}
      {showHow && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowHow(false)}
          />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="card max-w-2xl w-full bg-white dark:bg-slate-800 p-6">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-extrabold">How it works</h2>
                <button
                  onClick={() => setShowHow(false)}
                  className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-700"
                >
                  Close
                </button>
              </div>
              <p className="mt-2 opacity-80">
                Four simple steps: <strong>About You</strong> →{" "}
                <strong>Regulated / Need‑based</strong> →{" "}
                <strong>Self‑Inflicted</strong> → <strong>Investments</strong>.
                Mostly Yes/No, optional amounts never affect your score.
              </p>
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[
                  "About You",
                  "Need‑based",
                  "Self‑inflicted",
                  "Investments",
                ].map((t, i) => (
                  <div key={i} className="grid place-items-center">
                    <svg
                      className="w-16 h-16 animate-pulse"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#22c55e"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray="250"
                        strokeDashoffset={i * 40}
                      />
                    </svg>
                    <div className="text-xs mt-1">{t}</div>
                  </div>
                ))}
              </div>
              <h3 className="font-bold mt-4 mb-1">Calculation (brief)</h3>
              <p className="text-sm opacity-90">
                You start at 1000 and points are deducted for active riba
                exposures. Self‑inflicted debts carry heavier deductions while
                regulated or need‑based items are lighter. Mortgage: one
                conventional −200; two or more −300. Multiplicity surcharges
                apply when several self‑inflicted products are active, and block
                caps keep scoring fair and comparable across users.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY MODAL */}
      {showPrivacy && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowPrivacy(false)}
          />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="card max-w-2xl w-full bg-white dark:bg-slate-800 p-6">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-extrabold">Privacy</h2>
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-700"
                >
                  Close
                </button>
              </div>
              <p className="opacity-80 mt-2">
                We do not require an account or collect emails to complete the
                test. Your inputs remain on your device unless you choose to
                download or email the CSV. If you opt to email, the CSV is sent
                securely to the address you provide via our email service; we do
                not retain the content beyond delivery logs for anti‑abuse
                purposes. We do not sell or share your data with third parties.
                HTTPS is required for any transmission.
              </p>
              <ul className="list-disc ml-6 mt-3 opacity-90 text-sm">
                <li>
                  <strong>No email required</strong> to complete the test.
                </li>
                <li>
                  <strong>Optional amounts</strong> never change your score.
                </li>
                <li>
                  <strong>Data control:</strong> Download your CSV and delete
                  any time.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
