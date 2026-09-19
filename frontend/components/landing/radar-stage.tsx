const BLIPS = [
  { x: 68, y: 22, delay: "0s" },
  { x: 78, y: 58, delay: "0.6s" },
  { x: 28, y: 70, delay: "1.2s" },
  { x: 22, y: 32, delay: "1.8s" },
];

const METRICS = [
  { label: "Yalpi marja", value: "38%", hint: "Formula hisobi", tone: "text-emerald-300" },
  { label: "Bozor signali", value: "74/100", hint: "AI talab balli", tone: "text-radar-400" },
  { label: "Zararsizlik", value: "240 dona", hint: "FC / (P − V)", tone: "text-gold-300" },
  { label: "Xavf darajasi", value: "PAST", hint: "Kapital + marja", tone: "text-emerald-300" },
];

export function RadarStage() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute -inset-8 rounded-[40px] bg-radar-500/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-navy-900/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-radar-400">
              Live radar
            </p>
            <p className="mt-1 text-sm font-medium text-white">Namuna: kafel tarmog‘i, Toshkent</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
            <span className="live-dot h-2 w-2 rounded-full bg-emerald-400" />
            Signal ochiq
          </span>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-full">
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-[12%] rounded-full border border-white/10" />
          <div className="absolute inset-[24%] rounded-full border border-radar-400/25" />
          <div className="absolute inset-[36%] rounded-full border border-radar-400/40" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-white/10" />

          <div className="radar-sweep absolute inset-0 rounded-full">
            <div
              className="h-full w-full rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgb(77 163 255 / 0.28) 52deg, transparent 70deg)",
              }}
            />
          </div>

          {BLIPS.map((blip) => (
            <span
              key={`${blip.x}-${blip.y}`}
              className="radar-blip absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400 shadow-[0_0_12px_rgba(226,188,90,0.8)]"
              style={{ left: `${blip.x}%`, top: `${blip.y}%`, animationDelay: blip.delay }}
            />
          ))}

          <div className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400 shadow-[0_0_18px_rgba(226,188,90,0.95)]" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {METRICS.map((item, index) => (
            <div
              key={item.label}
              className="float-card rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
              style={{ animationDelay: `${index * 0.35}s` }}
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-400">{item.label}</p>
              <p className={`mt-1 text-lg font-semibold ${item.tone}`}>{item.value}</p>
              <p className="text-[11px] text-slate-500">{item.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-navy-950/60 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Baza ssenariy</span>
            <span>so‘m / oy</span>
          </div>
          {[
            ["Tushum", 88],
            ["COGS", 46],
            ["Foyda", 61],
          ].map(([name, width]) => (
            <div key={String(name)} className="mt-2 flex items-center gap-3">
              <span className="w-14 text-[11px] text-slate-400">{name}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-radar-500 to-gold-400"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
