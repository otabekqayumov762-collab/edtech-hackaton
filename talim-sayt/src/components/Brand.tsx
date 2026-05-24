const APP_ICON = '/apple-touch-icon.svg';

export function Logo({
  size = 36,
  light: _light = false,
  className = '',
}: {
  size?: number;
  light?: boolean;
  className?: string;
}) {
  return (
    <img
      src={APP_ICON}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-[22%] ${className}`}
      aria-hidden
    />
  );
}

export function BrandMark({
  size = 30,
  light = false,
  className = '',
}: {
  size?: number;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Logo size={size} />
      <div className="leading-none">
        <div
          className={`text-base font-bold tracking-tight ${
            light ? 'text-white' : 'text-zinc-950'
          }`}
        >
          MF Platform
        </div>
      </div>
    </div>
  );
}
