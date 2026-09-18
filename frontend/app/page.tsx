"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PricingSection } from "@/components/pricing/pricing-section";

const STEPS = [
  "Ro'yxatdan o'ting",
  "Biznes g'oyangiz va raqamlaringizni kiriting",
  "AI darhol moliyaviy reja va ko'nikmalar tavsiyasini tayyorlaydi",
  "Kredit/soliq kalkulyatori bilan qarorni aniqlashtiring",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Biznes Radar AI
          </p>
          <p className="text-lg font-semibold text-navy-900">BIZNES RADAR AI</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="#pricing" className="hidden text-sm text-slate-600 md:inline">
            Tariflar
          </a>
          <Link href="/login" className="text-sm text-slate-600">
            Kirish
          </Link>
          <Link href="/register">
            <Button>Biznes-rejamni yaratish</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <p className="text-sm font-medium text-indigo-600">
          AI moliyaviy maslahatchi — biznes-reja, kredit va soliq hisob-kitobi bitta joyda.
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-navy-900 md:text-6xl">
          Ro'yxatdan o'ting — daqiqalar ichida biznesingiz uchun AI moliyaviy reja va aniq ko'nikmalar oling.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">
          Kichik va o'rta biznes egalari uchun: biznes-reja tuzish, kredit kalkulyatori, soliq
          hisob-kitobi va bozor tahlilini birlashtirgan AI platforma. Kirgan zahotingiz — o'z
          biznesingiz uchun tayyor moliyaviy model va nimalarni o'rganish kerakligini ko'rasiz.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register">
            <Button size="lg">Biznes-rejamni bepul yaratish</Button>
          </Link>
          <a href="#how">
            <Button size="lg" variant="outline">
              Qanday ishlaydi?
            </Button>
          </a>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-[#f5f7fb] py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-navy-900">Muammo</h2>
            <p className="mt-3 text-slate-600">
              Kichik va o'rta biznes (KOB) subyektlarining moliyaviy savodxonligi past —
              biznes-reja tuzish va kredit olish jarayonlarida qiyinchiliklarga duch kelishadi.
              Oddiy chatbot bu savolga javob bermaydi — tuzilgan hisob-kitob va aniq raqamlar kerak.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-navy-900">Yechim</h2>
            <p className="mt-3 text-slate-600">
              Biznes Radar AI — biznes-reja tuzish, kredit kalkulyatori, soliq hisob-kitobi va
              bozor tahlili funksiyalarini birlashtirgan AI platforma. Kafolat emas — qarordan
              oldingi noaniqlikni va bilim tafovutini kamaytiradi.
            </p>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-navy-900">Qanday ishlaydi</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {STEPS.map((step, index) => (
            <Card key={step}>
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-indigo-600">0{index + 1}</p>
                <p className="mt-2 text-sm font-medium text-navy-900">{step}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 md:grid-cols-3">
        {[
          ["Biznes-reja hujjati", "G'oyangiz, bozor konteksti, moliyaviy model va AI xulosasi — bitta chop etishga tayyor hujjatda."],
          ["Moliyaviy planner", "Tushum, COGS, marja, zararsizlik, kredit va soliq kalkulyatori — AI emas, formula hisoblaydi."],
          ["Moliyaviy ko'nikmalar tavsiyasi", "Hisoblangan ko'rsatkichlar asosida qaysi mavzularni o'rganish kerakligini aniq ko'rsatamiz."],
          ["AI tahlil", "Hisoblangan natijani izohlaydi, taxminlarni ko'rsatadi, savollaringizga javob beradi."],
          ["Ssenariy tahlili", "Pessimistik / baza / optimistik. Bu prognoz emas."],
          ["Xavf tahlili", "Kapital, marja va moliyaviy barqarorlik bo'yicha deterministik ball."],
        ].map(([title, body]) => (
          <Card key={title}>
            <CardContent className="p-5">
              <h3 className="font-semibold text-navy-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="bg-navy-900 py-16 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold">Kimlar uchun</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["Yangi tadbirkor", "Kichik biznes egasi", "Startap asoschisi", "Biznes maslahatchi", "Moliyaviy savodxonlikni oshirmoqchi bo'lgan har kim"].map(
              (item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="border-t border-slate-100 py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-navy-900">Biznesingiz uchun bugun reja tuzing</h2>
          <p className="mt-3 text-slate-600">
            Mahsulot muvaffaqiyatni kafolatlamaydi. U qaror qabul qilishdan oldingi noaniqlikni kamaytiradi.
          </p>
          <Link href="/register" className="mt-6 inline-block">
            <Button size="lg">Boshlash</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
