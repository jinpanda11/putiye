export function PageTransition({ children }) {
  return (
    <main className="relative z-10 mx-auto min-h-[calc(100vh-3.5rem)] w-full pt-14 pb-24 md:pb-8">
      {children}
    </main>
  );
}
