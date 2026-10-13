import { ChevronRight, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button.jsx';

export default function HRMSPageHeader({ title, description, eyebrow = 'Human Resource Management', actions, onOpenNavigation }) {
  return (
    <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-[10px] font-medium text-[#8190a6]">
          <Link to="/hrms/dashboard" className="hover:text-[#006EB5]">HRMS</Link>
          <ChevronRight size={12} />
          <span aria-current="page" className="truncate text-[#526b86]">{title}</span>
        </nav>
        <div className="flex items-start gap-3">
          <Button variant="secondary" size="icon" className="shrink-0 lg:hidden" onClick={onOpenNavigation} aria-label="Open HRMS navigation">
            <Menu size={19} />
          </Button>
          <div>
            <p className="mb-1 text-[11px] font-medium text-[#557292]">{eyebrow}</p>
            <h1 className="text-[clamp(25px,2.5vw,36px)] font-bold leading-tight tracking-[-0.035em] text-[#07163b]">{title}</h1>
            <p className="mt-1.5 max-w-3xl text-xs leading-5 text-[#6d7f99] sm:text-[13px]">{description}</p>
          </div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 pl-[52px] lg:pl-0">{actions}</div>}
    </header>
  );
}
