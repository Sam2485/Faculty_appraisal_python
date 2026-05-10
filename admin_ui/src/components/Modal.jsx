export default function Modal({ children, maxWidth = 480, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--c-surf)', borderRadius: 14, padding: 28,
          width: '100%', maxWidth,
          border: '1px solid var(--c-border)',
          boxShadow: '0 24px 60px var(--c-stat-shadow)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
