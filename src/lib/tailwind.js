// Shared static Tailwind utilities. All classes are visible to Tailwind's scanner.
export const styles = {
  'erp-shell':
    'erp-shell [margin:18px_auto] [width:calc(100%_-_40px)] [max-width:1720px] [background:linear-gradient(130deg,_#f8fbff,_#f6f9fd)] [border-radius:26px] [box-shadow:0_8px_50px_#4174b50d] [min-height:calc(100vh_-_36px)] max-[768px]:w-full max-[768px]:m-0 max-[768px]:[border-radius:0] max-[768px]:[min-height:100vh]',
  'erp-header':
    'erp-header relative flex items-center justify-between [gap:24px] [padding:20px_30px] [min-height:90px] max-[1351px]:[gap:15px] max-[1351px]:[padding:20px] max-[768px]:[padding:17px_18px] max-[768px]:[min-height:75px]',
  brand: 'brand flex items-center [gap:12px] [color:#0b1734] shrink-0',
  'brand-name':
    'brand-name [font-size:24px] [letter-spacing:-0.8px] font-bold [&_span]:font-semibold max-[1351px]:[font-size:21px] max-[768px]:[font-size:20px]',
  'brand-mark': 'brand-mark [width:36px] [height:39px] object-contain',
  'kpi-card':
    'kpi-card [&:hover]:[box-shadow:0_10px_28px_#376fbb0d] [&:hover]:[transform:translateY(-2px)] relative flex [gap:18px] [padding:20px] [min-height:146px] bg-white [border:1px_solid_#f0f4fa] [border-radius:18px] [box-shadow:0_7px_24px_#376fbb06] min-[1500px]:[min-height:160px] max-[1351px]:[padding:16px] max-[1351px]:[gap:10px] max-[1351px]:[min-height:155px] max-[1101px]:[min-height:145px] max-[768px]:[min-height:143px] max-[768px]:[padding:20px] max-[768px]:[gap:17px]',
  'notch-nav':
    'notch-nav flex items-center justify-center bg-white [border:1px_solid_#f4f7fb] [border-radius:999px] [padding:7px] [box-shadow:0_9px_24px_#286fc410] [gap:2px] max-[1101px]:flex max-[1101px]:[&_.nav-item:nth-child(n_+_4)]:hidden max-[768px]:hidden',
  'nav-item':
    'nav-item flex items-center [gap:8px] [color:#263a61] [padding:12px_14px] [font-size:12px] [border-radius:99px] whitespace-nowrap [&:hover]:[background:#eaf5fc] [&.active]:[color:white]! [&.active]:[background:linear-gradient(135deg,_#0987c4,_#006eb5_55%,_#003b62)]! [&.active]:[box-shadow:0_3px_10px_#006eb525]! max-[1351px]:[padding:11px_9px] max-[1351px]:[font-size:11px] max-[1351px]:[gap:5px]',
  'header-utilities':
    'header-utilities flex [gap:12px] items-center max-[1351px]:[gap:8px] max-[768px]:[gap:10px]',
  'icon-button':
    'icon-button inline-flex items-center justify-center [width:37px] [height:37px] rounded-full border-0 bg-white [color:#263c65] [box-shadow:0_4px_14px_#4075bc0b] [&:hover]:[background:#eaf5fc]',
  'profile-trigger':
    'profile-trigger flex items-center [gap:10px] bg-transparent border-0 p-0',
  avatar:
    'avatar grid place-items-center rounded-full font-semibold [background:#d8e9f5] [color:#003b62] [width:39px] [height:39px] [border:3px_solid_white]',
  'task-avatar':
    'task-avatar grid place-items-center rounded-full font-semibold [background:#d8e9f5] [color:#003b62] [width:28px] [height:28px] [font-size:9px]',
  'mobile-trigger': 'mobile-trigger hidden max-[1101px]:inline-flex',
  'menu-backdrop':
    'menu-backdrop fixed inset-0 [z-index:30] bg-transparent border-0 [cursor:default]',
  'header-popover':
    'header-popover absolute [right:30px] [top:80px] [z-index:31] bg-white [border:1px_solid_#e7edf5] [border-radius:16px] [box-shadow:0_14px_40px_#10355420] [padding:24px] [width:300px] starting:opacity-0 starting:-translate-y-1 transition-[opacity,transform] duration-180 [&_h3]:[margin-bottom:12px] [&_h3]:font-semibold [&_h3]:capitalize [&_p]:[font-size:12px] [&_p]:[color:#66738f] [&_p]:[line-height:1.6] max-[768px]:[right:15px] max-[768px]:[top:65px] max-[768px]:[width:min(320px,_calc(100vw_-_30px))]',
  'popover-close':
    'popover-close absolute [right:7px] [top:6px] [width:25px] [height:25px]',
  'profile-info':
    'profile-info flex [gap:12px] items-start [overflow-wrap:anywhere] [&_small]:[color:#66738f] [&_small]:capitalize',
  'logout-link':
    'logout-link flex items-center [gap:10px] [margin-top:20px] [padding-top:15px] [border-top:1px_solid_#e7edf5]',
  'mobile-menu':
    'mobile-menu [&_nav]:grid [&_nav]:[gap:5px] [&_nav_a]:flex [&_nav_a]:[gap:12px] [&_nav_a]:[padding:10px] [&_nav_a]:[border-radius:10px] [&_nav_a.active]:[background:#eaf5fc]',
  'erp-content': 'erp-content [padding:20px_24px_0] max-[768px]:[padding:15px]',
  'dashboard-heading':
    'dashboard-heading flex justify-between [gap:20px] items-center [padding:5px_8px_20px] [&_h1]:[font-size:36px] [&_h1]:[line-height:1.2] [&_h1]:font-bold [&_h1]:[letter-spacing:-1.2px] max-[1101px]:[&_h1]:[font-size:32px] max-[768px]:items-start max-[768px]:flex-col max-[768px]:[padding:5px_2px_15px] max-[768px]:[&_h1]:[font-size:32px]',
  greeting: 'greeting [font-size:14px] [color:#52638c] [margin-bottom:4px]',
  subtitle:
    'subtitle [color:#66738f] [font-size:14px] [margin-top:5px] max-[1101px]:[max-width:430px] max-[1101px]:[line-height:1.6] max-[768px]:[font-size:12px]',
  'heading-controls':
    'heading-controls flex [gap:12px] items-center shrink-0 max-[1101px]:items-stretch max-[1101px]:flex-col max-[768px]:flex-row max-[768px]:w-full max-[768px]:[gap:8px]',
  'date-control':
    'date-control flex items-center [gap:10px] [padding:15px] bg-white [border:1px_solid_#e7edf5] [border-radius:13px] [box-shadow:0_7px_24px_#376fbb06] [color:#23395f] [&_input]:bg-transparent [&_input]:border-0 [&_input]:[width:130px] [&_input]:[color:inherit] max-[1101px]:[padding:10px_14px] max-[768px]:flex-1 max-[768px]:[padding:12px_9px] max-[768px]:[gap:6px] max-[768px]:min-w-0 max-[768px]:[&_input]:[width:115px] max-[768px]:[&_input]:[font-size:11px]',
  'primary-button':
    'primary-button inline-flex items-center justify-center [gap:10px] border-0 [background:linear-gradient(135deg,_#0987c4,_#006eb5_55%,_#003b62)] [color:white] [padding:16px_18px] [border-radius:13px] [box-shadow:0_6px_16px_#006eb51c] [font-size:12px] max-[1101px]:[padding:12px_14px] max-[768px]:[font-size:11px] max-[768px]:[gap:6px]',
  'button-note':
    'button-note [border-left:1px_solid_#ffffff35] [padding-left:10px] [font-size:10px] [color:#d9edff] max-[768px]:[font-size:9px] max-[768px]:[padding-left:6px]',
  'demo-banner':
    'demo-banner flex items-center [gap:8px] [font-size:10px] [color:#6b7c93] [margin:0_8px_16px] flex-wrap [&_strong]:[color:#426785] [&_strong]:font-medium max-[768px]:[margin:0_2px_14px] max-[768px]:[font-size:9px]',
  'demo-dot':
    'demo-dot [width:5px] [height:5px] rounded-full [background:#55a8d6]',
  'demo-date':
    'demo-date ml-auto [font-size:9px] max-[768px]:[margin-left:0] max-[768px]:w-full',
  'kpi-grid':
    'kpi-grid grid [grid-template-columns:repeat(4,_minmax(0,_1fr))] [gap:16px] [margin-bottom:18px] max-[1101px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[768px]:[grid-template-columns:1fr] max-[768px]:[gap:12px]',
  'kpi-icon':
    'kpi-icon [width:52px] [height:52px] [background:linear-gradient(145deg,_#f0f8ff,_#e2f2ff)] [color:#006eb5] grid place-items-center shrink-0 [border-radius:17px] [&.rose]:[background:#fff0f1]! [&.rose]:[color:#ed4e57]! max-[1351px]:[width:43px] max-[1351px]:[height:43px] max-[768px]:[width:48px] max-[768px]:[height:48px]',
  'kpi-body':
    'kpi-body [&_h2]:[font-size:12px] [&_h2]:font-medium [&_h2]:[padding-top:6px] [&_h2]:[color:#2d3c62] max-[1351px]:[&_h2]:[font-size:11px] max-[768px]:[&_h2]:[font-size:12px]',
  'kpi-value':
    'kpi-value block [font-size:27px] [letter-spacing:-0.7px] [margin-top:10px] font-bold max-[1351px]:[font-size:24px] max-[1101px]:[font-size:28px]',
  'kpi-more': 'kpi-more absolute [right:18px] [top:21px] [color:#48628b]',
  'kpi-trend':
    'kpi-trend absolute [bottom:23px] [left:20px] flex items-center [gap:5px] [font-size:11px] [color:#079957] [&_span]:[color:#75819e] [&.negative]:[color:#ed4652]! max-[1351px]:[left:16px] max-[1351px]:[bottom:18px] max-[1351px]:[font-size:10px] max-[1351px]:[gap:3px] max-[1101px]:[bottom:20px] max-[768px]:[left:20px] max-[768px]:[font-size:11px]',
  'kpi-visual':
    'kpi-visual absolute [bottom:21px] [right:16px] [width:78px] [height:66px] [&_svg]:w-full [&_svg]:h-full min-[1500px]:[width:90px] max-[1351px]:[width:65px] max-[1351px]:[bottom:42px] max-[1101px]:[width:85px] max-[1101px]:[bottom:22px] max-[768px]:[right:23px] max-[768px]:[bottom:24px]',
  'mini-bars':
    'mini-bars flex items-end h-full [gap:5px] [&_i]:block [&_i]:[width:9px] [&_i]:[background:linear-gradient(#006eb5,_#42b2ec)] [&_i]:[border-radius:3px_3px_0_0] [&_i:nth-child(-n_+_3)]:[background:linear-gradient(#e4f4ff,_#83caff)] [&.negative_i]:[background:linear-gradient(#ff858a,_#ffe4e5)]!',
  'attendance-ring':
    'attendance-ring [width:75px] [height:75px] rounded-full [background:conic-gradient(#006eb5_0_92%,_#a8d8fa_92%_100%)] grid place-items-center [transform:translateY(-9px)] [&_span]:grid [&_span]:place-items-center [&_span]:[width:56px] [&_span]:[height:56px] [&_span]:bg-white [&_span]:rounded-full [&_span]:font-semibold max-[1351px]:[width:63px] max-[1351px]:[height:63px] max-[1351px]:[transform:none] max-[1351px]:[&_span]:[width:47px] max-[1351px]:[&_span]:[height:47px]',
  'analytics-grid':
    'analytics-grid grid [grid-template-columns:minmax(0,_2.05fr)_minmax(0,_1fr)_minmax(0,_0.85fr)] [gap:16px] [margin-bottom:18px] min-[1500px]:[grid-template-columns:minmax(0,_2.05fr)_minmax(0,_1fr)_minmax(0,_0.85fr)] max-[1151px]:[grid-template-columns:minmax(0,_1.55fr)_minmax(0,_1fr)] max-[1151px]:[&_>_:last-child]:[grid-column:1/-1] max-[1151px]:[&_>_:last-child_.client-summary]:justify-start max-[1151px]:[&_>_:last-child_.client-summary]:[gap:30px] max-[1151px]:[&_>_:last-child_.client-legend]:flex max-[1151px]:[&_>_:last-child_.client-legend]:[gap:35px] max-[1151px]:[&_>_:last-child_.client-legend]:[margin-top:0] max-[768px]:[grid-template-columns:1fr] max-[768px]:[gap:14px] max-[768px]:[&_>_:last-child]:[grid-column:auto] max-[768px]:[&_>_:last-child_.client-summary]:justify-between max-[768px]:[&_>_:last-child_.client-legend]:grid max-[768px]:[&_>_:last-child_.client-legend]:[gap:15px] max-[768px]:[&_>_:last-child_.client-legend]:[margin-top:15px]',
  'section-card':
    'section-card bg-white [border:1px_solid_#f0f4fa] [border-radius:18px] [padding:17px_18px] [box-shadow:0_7px_24px_#376fbb06] min-w-0 max-[768px]:[padding:17px_15px]',
  'section-heading':
    'section-heading flex items-center [gap:11px] [margin-bottom:18px] [min-height:38px] [&_h2]:[font-size:14px] [&_h2]:font-semibold [&_h2]:[letter-spacing:-0.25px] [&_h2]:whitespace-nowrap [&_p]:[color:#7b88a4] [&_p]:[font-size:11px] [&_p]:[margin-top:4px] max-[1101px]:[&_h2]:[font-size:13px] max-[768px]:flex-wrap',
  'section-icon':
    'section-icon inline-grid place-items-center [background:#edf7ff] [color:#0075c3] [width:37px] [height:37px] [border-radius:12px] shrink-0',
  'section-actions':
    'section-actions ml-auto flex [gap:12px] items-center [font-size:11px] [&_a]:font-semibold [&_a]:whitespace-nowrap',
  'chart-legend':
    'chart-legend flex [gap:13px] [color:#4f6081] [font-size:10px] [&_span]:flex [&_span]:items-center [&_span]:[gap:5px] [&_i]:[width:8px] [&_i]:[height:8px] [&_i]:[background:#006eb5] [&_i]:rounded-full [&_span:last-child_i]:[background:#7bcaff]',
  'revenue-chart':
    'revenue-chart [height:233px] w-full min-w-0 min-[1500px]:[height:250px] max-[768px]:[height:225px]',
  'activity-list':
    'activity-list list-none [margin:-8px_0_0] p-0 [&_li]:flex [&_li]:items-center [&_li]:[gap:10px] [&_li]:[padding:10px_0] [&_li]:[border-bottom:1px_solid_#f1f4f9] [&_li:last-child]:[border-bottom:0] [&_strong]:[font-size:11px] [&_strong]:font-medium [&_strong]:[line-height:1.45] [&_strong]:block [&_p]:[font-size:10px] [&_p]:[color:#7583a0] [&_p]:[margin-top:3px] [&_p]:[line-height:1.35] [&_time]:ml-auto [&_time]:whitespace-nowrap [&_time]:[font-size:9px] [&_time]:[color:#7b88a3] [&_time]:[align-self:flex-start] [&_time]:[margin-top:5px]',
  'task-list':
    'task-list [&_strong]:[font-size:11px] [&_strong]:font-medium [&_strong]:[line-height:1.45] [&_strong]:block [&_p]:[font-size:10px] [&_p]:[color:#7583a0] [&_p]:[margin-top:3px] [&_p]:[line-height:1.35] [margin:-5px_0_0] p-0 list-none [&_li]:flex [&_li]:items-center [&_li]:[gap:12px] [&_li]:[padding:12px_0] [&_li]:[border-bottom:1px_solid_#f0f3f8] [&_li:last-child]:[border-bottom:0] [&_input]:[width:17px] [&_input]:[height:17px] [&_input]:shrink-0 [&_li_>_div]:flex-1 max-[768px]:[&_li]:[gap:8px] max-[768px]:[&_strong]:[font-size:10px] max-[768px]:[&_p]:[font-size:9px]',
  'activity-icon':
    'activity-icon grid place-items-center [width:34px] [height:36px] shrink-0 [background:#edf7ff] [color:#007bc9] [border-radius:11px] [&.payment]:[background:#e7f8ef] [&.payment]:[color:#069966] [&.task]:[background:#e7f8ef] [&.task]:[color:#069966] [&.leave]:[background:#fff0f0] [&.leave]:[color:#f04a55]',
  'client-summary':
    'client-summary flex justify-between items-center [padding:4px_0_12px] [gap:5px] [&_>_div_>_strong]:[font-size:29px] [&_>_div_>_strong]:[letter-spacing:-1px] [&_p]:[font-size:11px] [&_p]:[color:#66738f] [&_p]:[margin-top:5px] [&_small]:flex [&_small]:[gap:3px] [&_small]:[font-size:10px] [&_small]:[color:#079957] [&_small]:[margin-top:10px] max-[1351px]:p-0',
  'client-chart':
    'client-chart [width:124px] [height:124px] relative shrink-0 [&_>_span]:absolute [&_>_span]:inset-0 [&_>_span]:flex [&_>_span]:items-center [&_>_span]:justify-center [&_>_span]:flex-col [&_>_span]:pointer-events-none [&_>_span_strong]:[font-size:23px] [&_>_span_small]:[color:#66738f] [&_>_span_small]:[margin:3px_0_0] [&_>_span_small]:[font-size:10px]',
  'client-legend':
    'client-legend list-none p-0 [margin:13px_0_0] grid [gap:18px] [&_li]:flex [&_li]:items-center [&_li]:[gap:9px] [&_li]:[font-size:11px] [&_li]:[color:#425477] [&_i]:[width:11px] [&_i]:[height:11px] [&_i]:[border-radius:4px] [&_strong]:ml-auto [&_strong]:[color:#132443] max-[1351px]:[&_strong]:[margin-left:10px] max-[768px]:[&_strong]:ml-auto',
  'lower-grid':
    'lower-grid grid [grid-template-columns:minmax(0,_2.1fr)_minmax(0,_1fr)] [gap:16px] max-[1025px]:[grid-template-columns:minmax(0,_1fr)] max-[768px]:[grid-template-columns:1fr] max-[768px]:[gap:14px]',
  'search-field':
    'search-field flex items-center [gap:8px] [border:1px_solid_#e3eaf5] [border-radius:10px] [padding:9px_12px] [color:#687c9e] [&_input]:border-0 [&_input]:outline-none [&_input]:[width:145px] [&_input]:bg-transparent [&_input]:[font-size:11px] [&:focus-within]:[box-shadow:0_0_0_3px_#0987c430] max-[768px]:[&_input]:[width:115px]',
  'invoices-card':
    'invoices-card [&_.section-heading]:[margin-bottom:10px] max-[1351px]:[&_.section-actions]:ml-auto max-[768px]:[&_.section-actions]:[flex-basis:100%] max-[768px]:[&_.section-actions]:flex-wrap max-[768px]:[&_.section-actions]:justify-between max-[768px]:[&_.section-actions]:[gap:8px]',
  'table-scroll': 'table-scroll overflow-x-auto',
  'invoice-id': 'invoice-id [color:#0064af] font-semibold',
  'client-cell': 'client-cell flex items-center [gap:10px]',
  'client-avatar':
    'client-avatar [width:26px] [height:26px] grid place-items-center [background:#e4f2ff] [border-radius:8px] [color:#006eb5] font-semibold [font-size:13px]',
  'invoice-amount': 'invoice-amount [color:#172b49] font-semibold',
  'status-badge':
    'status-badge inline-flex items-center [gap:5px] [border-radius:7px] [padding:5px_8px] [font-size:10px] [background:#e6f7ef] [color:#07885b] [&_i]:[width:6px] [&_i]:[height:6px] [&_i]:rounded-full [&_i]:[background:currentColor] [&.pending]:[color:#e38a03]! [&.pending]:[background:#fff5e3]! [&.sent]:[color:#0781cb]! [&.sent]:[background:#e6f3ff]! [&.overdue]:[color:#e54450]! [&.overdue]:[background:#ffedef]!',
  'table-action':
    'table-action bg-transparent border-0 [padding:5px] [color:#37527b]',
  'due-badge':
    'due-badge [padding:6px_8px] [border-radius:7px] [background:#f2f5fa] [font-size:9px] [color:#637391] [&.today]:[background:#ffedef]! [&.today]:[color:#e24b51]! [&.tomorrow]:[background:#eaf5ff]! [&.tomorrow]:[color:#0077ca]!',
  'demo-note': 'demo-note [color:#97a2b5] [font-size:9px] [margin-top:8px]',
  'erp-footer':
    'erp-footer [padding:18px_30px] flex justify-between [color:#8e9cb3] [font-size:10px] max-[768px]:[padding:20px_17px] max-[768px]:[&_span]:hidden',
  'empty-state': 'empty-state [padding:30px] text-center [color:#66738f]',
  'coming-soon':
    'coming-soon [padding:70px_24px] text-center [min-height:60vh] [&_>_.section-icon]:[width:60px] [&_>_.section-icon]:[height:60px] [&_>_.section-icon]:[margin-bottom:25px] [&_h1]:capitalize [&_h1]:[font-size:28px] [&_h1]:[margin-bottom:15px] [&_h1]:font-semibold [&_p]:[color:#66738f] [&_p]:[margin-bottom:25px]',
  eyebrow: 'eyebrow [font-size:10px] [letter-spacing:2px]',
  'preview-dialog':
    'preview-dialog [margin:auto] [border:1px_solid_#e7edf5] bg-white [border-radius:18px] [padding:30px] [max-width:460px] w-full [&::backdrop]:[background:#12314e66] [&_h2]:font-semibold [&_h2]:[font-size:20px] [&_h2]:[margin-bottom:15px] [&_p]:[margin:15px_0] [&_p]:[color:#66738f] [&_button]:[background:#006eb5] [&_button]:[color:white] [&_button]:border-0 [&_button]:[border-radius:8px] [&_button]:[padding:10px_15px]',
  'auth-page':
    'auth-page [min-height:100vh] grid place-items-center [padding:24px]',
  'auth-panel':
    "auth-panel bg-white [border:1px_solid_#e7edf5] [border-radius:22px] [padding:36px] w-full [max-width:420px] [box-shadow:0_16px_60px_#003b620a] [&_h1]:[font-size:24px] [&_h1]:font-bold [&_h1]:[margin-bottom:24px] [&_form_p]:[margin-bottom:18px] [&_label]:[display:inline-block] [&_label]:[color:#425477] [&_label]:[margin-bottom:8px] [&_input]:w-full [&_input]:[border:1px_solid_#dce6f1] [&_input]:[border-radius:10px] [&_input]:[padding:12px] [&_button]:[background:#006eb5] [&_button]:[color:white] [&_button]:[padding:12px_18px] [&_button]:border-0 [&_button]:[border-radius:10px] [&_button:disabled]:[opacity:0.6] [&_[role='alert']]:[color:#ef4444] [&_[role='alert']]:[line-height:1.6] [&_>_p]:[margin-bottom:22px] [&_>_p]:[color:#66738f] [&_a]:[margin-left:15px] max-[768px]:[padding:27px]",
  'revenue-card':
    'revenue-card max-[1151px]:[&_.section-heading]:flex-wrap max-[1151px]:[&_.section-actions]:[margin-left:0] max-[1151px]:[&_.section-actions]:[flex-basis:100%] max-[1151px]:[&_.section-actions]:justify-between',
  'utility-button': 'utility-button max-[768px]:hidden',
  'login-page':
    'login-page [height:100dvh] min-h-0 grid [grid-template-columns:minmax(0,_55fr)_minmax(0,_45fr)] [background:radial-gradient(_ellipse_at_65%_55%,_#c5e4ff_0,_#e4f0fc_65%,_#eff6fc_)] [color:#0b1b3f] max-[768px]:[height:auto] max-[768px]:[min-height:100dvh] max-[768px]:[grid-template-columns:1fr] max-[768px]:[padding:0_0_25px]',
  'login-story':
    "login-story relative min-h-0 h-full [background:linear-gradient(90deg,_#edf7ff60,_#edf7ff25),_url('/login-office.png')_center/cover_no-repeat] [border-radius:0_26px_26px_0] [&_h1]:[font-size:clamp(32px,_5.85dvh,_60px)] [&_h1]:[line-height:1.04] [&_h1]:font-bold [&_h1]:[letter-spacing:-1.7px] [&_h1_span]:[color:#0075df] [&_blockquote]:[margin:4.2dvh_0_0] [&_blockquote]:[border-left:4px_solid_#0588f5] [&_blockquote]:[padding-left:17px] [&_blockquote]:[font-size:14px] [&_blockquote]:[line-height:1.55] [&_blockquote_span]:[color:#0078ed] [&_cite]:block [&_cite]:[font-size:12px] [&_cite]:not-italic [&_cite]:[color:#315680] [&_cite]:[margin-top:7px] max-[768px]:[height:auto] max-[768px]:[min-height:auto] max-[768px]:[border-radius:0_0_22px_22px] max-[768px]:[background-position:center_25%] max-[768px]:[&_h1]:[font-size:30px] max-[768px]:[&_h1]:[letter-spacing:-1px] max-[768px]:[&_h1_br]:hidden max-[768px]:[&_h1_span]:block max-[768px]:[&_blockquote]:hidden [@media(min-width:_768px)_and_(max-height:_700px)]:[&_blockquote]:[margin-top:3dvh]! [@media(min-width:_768px)_and_(max-height:_700px)]:[&_blockquote]:[font-size:12px]! [@media(max-width:_767px)_and_(max-height:_740px)]:[&_h1]:[font-size:26px]! [@media(max-width:_767px)_and_(max-height:_740px)]:[&_h1_span]:[display:inline]!",
  'login-story-content':
    'login-story-content relative [z-index:1] [padding:11.5dvh_11%_3dvh_22%] [max-width:850px] max-[1101px]:[padding-left:12%] max-[1101px]:[padding-right:10%] max-[768px]:[padding:23px_25px_22px] max-[768px]:[background:#edf7ffb8] [@media(min-width:_768px)_and_(max-height:_700px)]:[padding-top:7dvh]! [@media(max-width:_767px)_and_(max-height:_740px)]:[padding:18px_24px]!',
  'login-brand':
    'login-brand inline-flex items-center [gap:12px] [color:#00417c] [margin-bottom:4.8dvh] max-[1101px]:[margin-bottom:4.1dvh] max-[768px]:[margin-bottom:26px] [@media(min-width:_768px)_and_(max-height:_700px)]:[margin-bottom:4dvh]!',
  'login-brand-icon':
    'login-brand-icon grid place-items-center [width:clamp(40px,_5.7dvh,_58px)] [height:clamp(40px,_5.7dvh,_58px)] [border:5px_solid_#0879d2] rounded-full [background:#f6fbff] [&_img]:[width:39px] [&_img]:[height:40px] [&_img]:object-contain [&_img]:[mix-blend-mode:multiply] max-[768px]:[width:44px] max-[768px]:[height:44px] max-[768px]:[border-width:3px] max-[768px]:[&_img]:[width:29px] max-[768px]:[&_img]:[height:31px]',
  'login-wordmark':
    'login-wordmark relative [font-size:clamp(34px,_5.56dvh,_57px)] [line-height:1] font-bold [letter-spacing:-1.7px] [border-bottom:2px_solid_#1672bd] [padding-bottom:3px] [&_small]:absolute [&_small]:[right:0] [&_small]:[top:calc(100%_+_4px)] [&_small]:[font-family:Georgia,_serif] [&_small]:italic [&_small]:font-normal [&_small]:[font-size:18px] [&_small]:[letter-spacing:1px] [&_small]:[color:#007cef] max-[768px]:[font-size:38px] max-[768px]:[&_small]:[font-size:13px]',
  'login-eyebrow':
    'login-eyebrow table [color:#0078eb] [background:#d4ebff] [border-radius:99px] [padding:7px_14px] [font-size:11px] [letter-spacing:1.1px] font-semibold [margin-bottom:1.5dvh] max-[768px]:[font-size:9px]',
  'login-intro':
    'login-intro [font-size:clamp(13px,_1.96dvh,_20px)] [color:#224e7d] [line-height:1.35] [max-width:450px] [margin-top:2.05dvh] max-[1101px]:[font-size:clamp(13px,_1.96dvh,_16px)] max-[768px]:[font-size:14px] max-[768px]:[max-width:440px] [@media(max-width:_767px)_and_(max-height:_740px)]:hidden!',
  'login-features':
    'login-features grid [grid-template-columns:repeat(4,_1fr)] [gap:18px] [margin-top:3.15dvh] [&_>_div_>_span]:grid [&_>_div_>_span]:place-items-center [&_>_div_>_span]:[width:clamp(32px,_4.4dvh,_45px)] [&_>_div_>_span]:[height:clamp(32px,_4.4dvh,_45px)] [&_>_div_>_span]:[color:#008cf3] [&_>_div_>_span]:[background:#f4fbffe0] [&_>_div_>_span]:[border-radius:12px] [&_>_div_>_span]:[box-shadow:0_5px_20px_#87b9eb15] [&_p]:[font-size:12px] [&_p]:[margin-top:9px] [&_p]:[line-height:1.4] max-[1101px]:[gap:12px] max-[768px]:hidden max-[768px]:[&_p]:[font-size:10px]',
  'login-form-region':
    'login-form-region relative flex items-center [padding:0_9%_0_0] min-w-0 min-h-0 max-[1101px]:[padding-right:5%] max-[768px]:[padding:20px_15px_0] [@media(max-width:_767px)_and_(max-height:_740px)]:[padding-top:12px]!',
  'login-card':
    'login-card relative [margin-left:-17px] [background:linear-gradient(145deg,_#ffffffed,_#f8fcffef)] [border:1px_solid_white] [border-radius:28px] [height:80dvh] min-h-0 [width:calc(100%_+_17px)] overflow-clip [box-shadow:0_22px_65px_#65a5dd0b] [&_h2]:[font-size:clamp(23px,_2.1vw,_32px)] [&_h2]:[letter-spacing:-0.8px] [&_h2]:font-bold [&_h2]:[line-height:1.25] [&_form]:[margin-top:4.3dvh] max-[1101px]:min-h-0 max-[768px]:[height:auto] max-[768px]:[margin-left:0] max-[768px]:w-full max-[768px]:[min-height:auto] max-[768px]:[border-radius:24px] max-[768px]:[&_h2]:[font-size:25px] max-[768px]:[&_form]:[margin-top:30px] [@media(min-width:_768px)_and_(max-height:_700px)]:[height:90dvh]! [@media(min-width:_768px)_and_(max-height:_700px)]:[&_h2]:[font-size:25px]! [@media(min-width:_768px)_and_(max-height:_700px)]:[&_form]:[margin-top:3dvh]! [@media(max-width:_767px)_and_(max-height:_740px)]:[&_form]:[margin-top:22px]!',
  'login-card-content':
    'login-card-content relative [z-index:1] h-full overflow-y-auto [scrollbar-width:thin] [padding:9.4dvh_clamp(28px,_5.4vw,_80px)_24px] max-[1101px]:[padding-left:30px] max-[1101px]:[padding-right:30px] max-[768px]:[padding:28px_24px_23px] max-[768px]:overflow-visible [@media(min-width:_768px)_and_(max-height:_700px)]:[padding-top:5dvh]! [@media(min-width:_768px)_and_(max-height:_700px)]:[padding-bottom:20px]! [@media(max-width:_767px)_and_(max-height:_740px)]:[padding-top:23px]!',
  'login-subtitle':
    'login-subtitle [font-size:clamp(13px,_1.2vw,_18px)] [color:#456899] [margin-top:10px] [line-height:1.5] max-[768px]:[font-size:13px] [@media(min-width:_768px)_and_(max-height:_700px)]:[font-size:13px]!',
  'login-field':
    'login-field [margin-bottom:2.75dvh] [&_label]:[font-size:14px] [&_label]:[color:#102d56] [&_label]:block [&_label]:[margin-bottom:11px] [&_label]:font-medium max-[768px]:[margin-bottom:23px] [@media(min-width:_768px)_and_(max-height:_700px)]:[margin-bottom:18px]! [@media(max-width:_767px)_and_(max-height:_740px)]:[margin-bottom:18px]!',
  'login-input-wrap':
    'login-input-wrap flex [gap:13px] items-center [border:1px_solid_#d2e0f5] [background:#ffffffbe] [border-radius:11px] [padding:0_15px] [min-height:49px] [color:#86a1cb] [box-shadow:0_0_0_1px_#e7eff930] [&:focus-within]:[border-color:#1189e4] [&:focus-within]:[box-shadow:0_0_0_3px_#1189e414] [&_>_svg]:shrink-0 [&_input]:w-full [&_input]:min-w-0 [&_input]:[padding:14px_0] [&_input]:[color:#17395f] [&_input]:[font-size:14px] [&_input]:bg-transparent [&_input]:border-0 [&_input]:outline-none [&_input::placeholder]:[color:#839cc4] [&_input:focus-visible]:outline-none max-[768px]:[&_input]:[font-size:13px] [@media(min-width:_768px)_and_(max-height:_700px)]:[min-height:44px]! [@media(min-width:_768px)_and_(max-height:_700px)]:[&_input]:[padding:11px_0]!',
  'login-label-row':
    'login-label-row flex [align-items:baseline] justify-between [gap:8px]',
  'login-text-button':
    'login-text-button [color:#0076e4] bg-transparent border-0 p-0 [font-size:12px] [&:hover]:underline',
  'password-toggle':
    'password-toggle grid place-items-center [color:#86a1cb] border-0 bg-transparent [padding:8px_0_8px_5px] shrink-0',
  'login-session-note':
    'login-session-note flex items-start [gap:12px] [margin:6px_0_2.85dvh] [&_>_svg]:[color:#0081df] [&_>_svg]:[margin-top:2px] [&_>_svg]:shrink-0 [&_strong]:[font-size:13px] [&_strong]:font-medium [&_p]:[color:#7b97bf] [&_p]:[font-size:12px] [&_p]:[margin-top:6px] [&_p]:[line-height:1.5]',
  'login-submit':
    'login-submit relative flex items-center justify-center w-full [min-height:60px] border-0 [border-radius:19px] [background:linear-gradient(110deg,_#005ccc,_#007de4_65%,_#119dff)] [color:white] [font-size:17px] font-medium [padding:16px_55px] [box-shadow:0_10px_20px_#078af32a] [&_>_span]:absolute [&_>_span]:[right:12px] [&_>_span]:grid [&_>_span]:place-items-center [&_>_span]:[width:37px] [&_>_span]:[height:37px] [&_>_span]:bg-white [&_>_span]:[color:#0789f6] [&_>_span]:rounded-full [&:not(:disabled):hover]:[transform:translateY(-1px)] [&:not(:disabled):hover]:[box-shadow:0_12px_25px_#078af344] [&:disabled]:[opacity:0.65] max-[768px]:[font-size:16px] [@media(min-width:_768px)_and_(max-height:_700px)]:[min-height:50px]! [@media(min-width:_768px)_and_(max-height:_700px)]:[padding-block:12px]!',
  'login-error':
    'login-error [font-size:12px] [line-height:1.5] [padding:12px_14px] [border-radius:10px] [margin-bottom:18px] [background:#fff0f0] [color:#b63543]',
  'login-notice':
    'login-notice [font-size:12px] [line-height:1.5] [padding:12px_14px] [border-radius:10px] [margin-bottom:18px] [background:#eaf7ef] [color:#277b55]',
  'login-back':
    'login-back flex justify-center items-center [gap:7px] [margin:20px_auto_0]',
  'login-security':
    'login-security [font-size:10px] [color:#94aaca] text-center [margin-top:4.7dvh] [letter-spacing:0.3px] max-[768px]:[margin-top:29px] [@media(min-width:_768px)_and_(max-height:_700px)]:[margin-top:20px]! [@media(max-width:_767px)_and_(max-height:_740px)]:[margin-top:20px]!',
  'login-ribbon':
    'login-ribbon absolute [right:-38px] [top:-83px] [width:138px] [height:212px] [transform:rotate(-34deg)] [border:1px_solid_#99d5ff] [border-radius:0_0_60px_55px] [background:linear-gradient(90deg,_#c2e7ff60,_#84cdff7a)] [box-shadow:inset_18px_0_0_#e5f5ff70,_18px_0_0_#d0eeff40] pointer-events-none',
};
const softBlueButton =
  '[box-shadow:inset_0_1px_0_#ffffff55,inset_0_-2px_0_#003b6226,0_3px_0_#00569b,0_8px_16px_#006eb51f]! transition-[transform,box-shadow] duration-150 [&:not(:disabled):not(:active):hover]:[box-shadow:inset_0_1px_0_#ffffff66,inset_0_-2px_0_#003b6226,0_3px_0_#00569b,0_10px_20px_#006eb52b]! motion-safe:[&:not(:disabled):not(:active):hover]:[transform:translateY(-1px)]! [&:not(:disabled):active]:[box-shadow:inset_0_2px_4px_#003b6233,0_1px_0_#00569b,0_3px_8px_#006eb51f]! motion-safe:[&:not(:disabled):active]:[transform:translateY(2px)]! [&:disabled]:[box-shadow:inset_0_1px_0_#ffffff40,0_3px_8px_#006eb512]!';
const softWhiteButton =
  '[box-shadow:inset_0_1px_0_#ffffff,inset_0_-1px_0_#d3dfed,0_2px_0_#dce5ef,0_5px_10px_#35658f12]! transition-[transform,box-shadow] duration-150 [&:not(:disabled):not(:active):hover]:[box-shadow:inset_0_1px_0_#ffffff,inset_0_-1px_0_#c9daea,0_2px_0_#d4e1ee,0_7px_12px_#35658f1c]! motion-safe:[&:not(:disabled):not(:active):hover]:[transform:translateY(-1px)]! [&:not(:disabled):active]:[box-shadow:inset_0_2px_4px_#35658f18,0_1px_0_#d4e1ee]! motion-safe:[&:not(:disabled):active]:[transform:translateY(1px)]!';
const buttonDepth = {
  'primary-button': softBlueButton,
  'login-submit': softBlueButton,
  'icon-button': softWhiteButton,
  'table-action': `${softWhiteButton} [background:linear-gradient(180deg,#ffffff,#f0f6fc)]! rounded-lg`,
  'auth-panel':
    '[&_button]:[box-shadow:inset_0_1px_0_#ffffff55,0_2px_0_#00569b,0_6px_12px_#006eb51f] [&_button:not(:disabled):active]:[box-shadow:inset_0_2px_4px_#003b6226,0_1px_0_#00569b] motion-safe:[&_button:not(:disabled):active]:translate-y-px',
  'preview-dialog':
    '[&_button]:[box-shadow:inset_0_1px_0_#ffffff55,0_2px_0_#00569b,0_6px_12px_#006eb51f] [&_button:not(:disabled):active]:[box-shadow:inset_0_2px_4px_#003b6226,0_1px_0_#00569b] motion-safe:[&_button:not(:disabled):active]:translate-y-px',
};
export function tw(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((name) =>
      buttonDepth[name]
        ? `${styles[name]} ${buttonDepth[name]}`
        : styles[name] || name,
    )
    .join(' ');
}
