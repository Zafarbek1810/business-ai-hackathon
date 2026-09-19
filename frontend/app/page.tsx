"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  FileText,
  GraduationCap,
  Menu,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Split,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingSection } from "@/components/pricing/pricing-section";
import { BrandMark } from "@/components/landing/brand-mark";
import { RadarStage } from "@/components/landing/radar-stage";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#problem", label: "Muammo" },
  { href: "#how", label: "Qanday ishlaydi" },
  { href: "#features", label: "Imkoniyatlar" },
  { href: "#pricing", label: "Tariflar" },
];

const STEPS = [
  {
    title: "Ro‘yxatdan o‘ting",
    body: "Hisob ochasiz — biznesingiz radarga tushadi.",
  },
  {
    title: "G‘oya va raqamlarni kiriting",
    body: "Narx, tannarx, savdo va xarajatlar. Chat emas — model.",
  },
  {
    title: "AI moliyaviy reja tayyorlaydi",
    body: "Marja, zararsizlik va o‘rganish kerak bo‘lgan ko‘nikmalar.",
  },
  {
    title: "Kredit va soliqni aniqlashtirasiz",
    body: "Kalkulyator bilan qarorni raqamga bog‘laysiz.",
  },
];

const FEATURES = [
  {
    title: "Biznes-reja hujjati",
    body: "G‘oya, bozor konteksti, moliyaviy model va AI xulosasi — chop etishga tayyor bitta hujjatda.",
    icon: FileText,
    wide: true,
  },
  {
    title: "Moliyaviy planner",
    body: "Tushum, COGS, marja, zararsizlik, kredit va soliq. AI izohlaydi — formula hisoblaydi.",
    icon: Calculator,
  },
  {
    title: "Ko‘nikmalar tavsiyasi",
    body: "Hisoblangan ko‘rsatkichlarga qarab nima o‘rganish kerakligini aniq ko‘rsatamiz.",
    icon: GraduationCap,
  },
  {
    title: "AI tahlil",
    body: "Natijani izohlaydi, taxminlarni ochiq qoldiradi, savollaringizga javob beradi.",
    icon: Sparkles,
  },
  {
    title: "Ssenariy tahlili",
    body: "Pessimistik / baza / optimistik. Bu prognoz emas — sezgirlik tekshiruvi.",
    icon: Split,
  },
  {
    title: "Xavf tahlili",
    body: "Kapital, marja va barqarorlik bo‘yicha deterministik ball. Kafolat emas.",
    icon: ShieldAlert,
  },
];

const AUDIENCE = [
  ["Yangi tadbirkor", "G‘oyani pul tikishdan oldin sinash"],
  ["Kichik biznes egasi", "Kredit va soliqni oldindan hisoblash"],
  ["Startap asoschisi", "Ssenariy va xavfni bitta radarda ko‘rish"],
  ["Biznes maslahatchi", "Mijoz uchun tuzilgan hisob-kitob"],
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark className="h-10 w-10" />
            <span className="leading-tight">
              <span className="block font-display text-lg text-white">Biznes Radar</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-radar-400">
                AI moliyaviy maslahatchi
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="text-sm text-slate-300 hover:text-white">
              Kirish
            </Link>
            <Link href="/register">
              <Button variant="gold">Radar ochish</Button>
            </Link>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-white md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Menyuni yopish" : "Menyuni ochish"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen ? (
          <div className="space-y-3 border-t border-white/10 px-5 py-4 md:hidden">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-slate-200"
              >
                {item.label}
              </a>
            ))}
            <Link href="/login" className="block text-sm text-slate-200" onClick={() => setMenuOpen(false)}>
              Kirish
            </Link>
            <Link href="/register" onClick={() => setMenuOpen(false)}>
              <Button variant="gold" className="w-full">
                Radar ochish
              </Button>
            </Link>
          </div>
        ) : null}
      </header>

      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(43,127,255,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(201,162,39,0.12),transparent_50%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              <ScanSearch className="h-3.5 w-3.5 text-gold-400" />
              Pul tikishdan oldin bozorni ko‘ring
            </p>
            <h1 className="mt-6 max-w-xl font-display text-4xl leading-[1.12] tracking-tight md:text-6xl">
              Biznesingiz uchun{" "}
              <span className="text-gold-300">moliyaviy radar.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
              Kichik va o‘rta biznes uchun AI platforma: biznes-reja, kredit kalkulyatori, soliq
              hisob-kitobi va bozor signali bitta joyda. Chatbot emas — tuzilgan raqam va aniq
              ko‘nikmalar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg" variant="gold">
                  Bepul biznes-reja yaratish
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  Qanday ishlaydi?
                </Button>
              </a>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                ["6 modul", "reja, moliya, xavf"],
                ["3 ssenariy", "pes / baza / opt"],
                ["0 kafolat", "qaror sizda qoladi"],
              ].map(([value, hint]) => (
                <div key={value}>
                  <p className="font-display text-2xl text-white md:text-3xl">{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{hint}</p>
                </div>
              ))}
            </div>
          </div>
          <RadarStage />
        </div>
      </section>

      <section id="problem" className="mx-auto max-w-6xl px-5 py-20 md:px-6">
        <div className="grid overflow-hidden rounded-[28px] border border-navy-900/10 bg-white shadow-[0_24px_80px_-40px_rgba(11,31,58,0.35)] lg:grid-cols-2">
          <div className="bg-navy-950 p-8 text-white md:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-300">
              Signal yo‘q
            </p>
            <h2 className="mt-3 font-display text-3xl">Muammo</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
              Kichik va o‘rta biznesning moliyaviy savodxonligi past — biznes-reja tuzish va kredit
              olishda qiyinchilik. Oddiy chatbot bu savolga javob bermaydi: tuzilgan hisob-kitob va
              aniq raqamlar kerak.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {[
                "Excelda taxminiy raqamlar, lekin model yo‘q",
                "Kredit foizi tushunilmaydi",
                "Qaysi ko‘nikma yetishmayotgani noma’lum",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-paper p-8 md:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Radar ochiq
            </p>
            <h2 className="mt-3 font-display text-3xl text-navy-900">Yechim</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              Biznes Radar AI biznes-reja, kredit, soliq va bozor tahlilini birlashtiradi. Kafolat
              emas — qarordan oldingi noaniqlikni va bilim tafovutini kamaytiradi.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-navy-800">
              {[
                "Formula asosida marja va zararsizlik",
                "Kredit va soliq kalkulyatori",
                "AI izohi + o‘rganish yo‘li",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 pb-8 md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500">Jarayon</p>
        <h2 className="mt-2 font-display text-3xl text-navy-900 md:text-4xl">To‘rt ping — tayyor reja</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Har bir qadam radarda yangi signal. Ro‘yxatdan o‘tgan zahoti o‘z biznesingiz uchun moliyaviy
          modelni ko‘rasiz.
        </p>
        <div className="relative mt-10 grid gap-4 md:grid-cols-4">
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-transparent via-gold-500/70 to-transparent md:block" />
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative rounded-3xl border border-navy-900/10 bg-white p-5 shadow-sm">
              <p className="font-display text-3xl text-gold-500">0{index + 1}</p>
              <h3 className="mt-3 font-semibold text-navy-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-16 md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-radar-500">
          Imkoniyatlar
        </p>
        <h2 className="mt-2 font-display text-3xl text-navy-900 md:text-4xl">Bitta radar. To‘liq qaror paneli.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-12">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={cn(
                  "group rounded-3xl border border-navy-900/10 bg-white p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-900/10",
                  feature.wide ? "lg:col-span-8" : "lg:col-span-4",
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-950 text-gold-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="mt-4 font-semibold text-navy-900">{feature.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{feature.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-navy-950 py-16 text-white">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-300">Auditoriya</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">Kimlar uchun</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {AUDIENCE.map(([title, body]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-paper">
        <PricingSection />
      </div>

      <section className="relative overflow-hidden bg-navy-950 py-20 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(43,127,255,0.18),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-5 text-center md:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-300">
            Qaror oldidan
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl">Biznesingizni bugun radarga oling</h2>
          <p className="mt-4 text-slate-300">
            Mahsulot muvaffaqiyatni kafolatlamaydi. U qaror qabul qilishdan oldingi noaniqlikni
            kamaytiradi.
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg" variant="gold">
              Boshlash
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-navy-900/10 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 md:flex-row md:items-start md:justify-between md:px-6">
          <div>
            <div className="flex items-center gap-3">
              <BrandMark />
              <p className="font-display text-lg text-navy-900">Biznes Radar AI</p>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
              Professional moliyaviy maslahat o‘rnini bosmaydi. Platforma tuzilgan hisob-kitob va
              qaror qo‘llab-quvvatlash uchun.
            </p>
          </div>
          <div className="flex gap-10 text-sm text-slate-600">
            <div className="space-y-2">
              <p className="font-semibold text-navy-900">Mahsulot</p>
              <a href="#how" className="block hover:text-navy-900">
                Qanday ishlaydi
              </a>
              <a href="#features" className="block hover:text-navy-900">
                Imkoniyatlar
              </a>
              <a href="#pricing" className="block hover:text-navy-900">
                Tariflar
              </a>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-navy-900">Hisob</p>
              <Link href="/login" className="block hover:text-navy-900">
                Kirish
              </Link>
              <Link href="/register" className="block hover:text-navy-900">
                Ro‘yxatdan o‘tish
              </Link>
            </div>
          </div>
        </div>
        <p className="border-t border-navy-900/10 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Biznes Radar AI
        </p>
      </footer>
    </div>
  );
}
