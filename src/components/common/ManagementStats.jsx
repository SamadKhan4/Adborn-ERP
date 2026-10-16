import '../../styles/operations.css';
export default function ManagementStats({ items }) {
  return (
    <div className="management-stats">
      {items.map(
        ({
          label,
          value,
          caption,
          tone = 'blue',
          icon: Icon,
          onClick,
          selected,
        }) => {
          const content = (
            <>
              <span className="metric-icon">{Icon && <Icon size={21} />}</span>
              <div>
                <p>{label}</p>
                <strong>{value}</strong>
                <small>{caption}</small>
              </div>
              {onClick && <span className="metric-filter">Filter</span>}
            </>
          );
          return onClick ? (
            <button
              key={label}
              type="button"
              data-tone={tone}
              className="management-stat"
              aria-pressed={selected}
              onClick={onClick}
            >
              {content}
            </button>
          ) : (
            <article key={label} data-tone={tone} className="management-stat">
              {content}
            </article>
          );
        },
      )}
    </div>
  );
}
