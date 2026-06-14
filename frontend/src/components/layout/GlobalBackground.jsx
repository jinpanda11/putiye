export function GlobalBackground() {
  const particles = [
    { left: '12%', top: '20%', delay: '0s' },
    { left: '32%', top: '65%', delay: '1.2s' },
    { left: '55%', top: '38%', delay: '2.4s' },
    { left: '72%', top: '72%', delay: '0.8s' },
    { left: '85%', top: '28%', delay: '3.1s' },
    { left: '20%', top: '82%', delay: '2.0s' },
  ];
  return (
    <>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-xuan via-xuan-card to-xuan" />
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.20]" style={{ backgroundImage: 'url(/temple/temple-mountain.svg)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(10,6,4,0.55) 0%, rgba(10,6,4,0.35) 30%, transparent 60%, rgba(10,6,4,0.6) 100%)'
      }} />
      <div className="fixed inset-x-0 top-0 z-0 h-32 bg-gradient-to-b from-gold/15 to-transparent" />
      {particles.map((p, i) => (
        <span key={i} className="absolute size-1.5 rounded-full bg-gold/40 animate-glow-rise pointer-events-none" style={{
          left: p.left, top: p.top,
          animationDelay: p.delay,
          animationDuration: '5s',
          animationIterationCount: 'infinite',
          animationFillMode: 'both',
          zIndex: 0,
        }} />
      ))}
    </>
  );
}
