import { ArrowDownRight, ArrowUpRight, CalendarCheck2, CalendarX2, Palmtree, UsersRound } from 'lucide-react';

const styles = {
  blue: { icon: UsersRound, box: 'bg-[#e5f3fd] text-[#006EB5]', bars: '#55b8ed' },
  green: { icon: CalendarCheck2, box: 'bg-[#e1f8ec] text-[#0a9b61]', bars: '#48cea0' },
  red: { icon: CalendarX2, box: 'bg-[#ffebed] text-[#e94d58]', bars: '#ff8990' },
  amber: { icon: Palmtree, box: 'bg-[#fff5df] text-[#d78b06]', bars: '#f0bd52' },
};

export default function HRMSMetricCard({ item }) {
  const tone = styles[item.tone];
  const Icon = tone.icon;
  const negative = item.trend.startsWith('-');
  return (
    <article className="group relative min-h-[136px] overflow-hidden rounded-[18px] border border-[#edf2f7] bg-white p-4 shadow-[0_7px_24px_#376fbb08] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_#376fbb12]">
      <div className="flex items-center gap-3">
        <span className={`grid size-12 shrink-0 place-items-center rounded-[15px] ${tone.box}`}><Icon size={22} /></span>
        <div>
          <p className="text-[11px] font-medium text-[#63748d]">{item.label}</p>
          <strong className="mt-1 block text-[26px] leading-none tracking-[-0.04em] text-[#07163b]">{item.value}</strong>
        </div>
      </div>
      <div className={`mt-5 flex items-center gap-1 text-[10px] font-semibold ${negative ? 'text-[#e94d58]' : 'text-[#079957]'}`}>
        {negative ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
        {item.trend} <span className="font-normal text-[#8290a5]">{item.note}</span>
      </div>
      <div aria-hidden="true" className="absolute bottom-4 right-4 flex h-10 items-end gap-1">
        {[30, 48, 63, 78, 96].map((height, index) => (
          <i key={height} className="block w-1.5 rounded-t-sm opacity-80" style={{ height: `${height}%`, background: tone.bars, opacity: 0.35 + index * 0.13 }} />
        ))}
      </div>
    </article>
  );
}
