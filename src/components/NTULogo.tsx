const NTULogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary">
        <span className="font-display text-3xl font-bold text-primary-foreground tracking-tight">
          NTU
        </span>
      </div>
      <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
        Portal
      </span>
    </div>
  );
};

export default NTULogo;
