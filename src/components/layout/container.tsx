export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-[calc(100%_-_32px)] sm:w-[calc(100%_-_48px)] md:w-[min(var(--content-max),calc(100%_-_64px))] ${className}`}
    >
      {children}
    </div>
  );
}
