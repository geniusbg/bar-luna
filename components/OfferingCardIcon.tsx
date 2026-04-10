import Image from 'next/image';

/** Emoji string, or public path like `/nasheto-menu.webp`. */
export default function OfferingCardIcon({
  icon,
  className = ''
}: {
  icon: string;
  className?: string;
}) {
  const trimmed = icon.trim();
  if (trimmed.startsWith('/')) {
    return (
      <Image
        src={trimmed}
        alt=""
        width={48}
        height={48}
        className={`h-9 w-9 md:h-10 md:w-10 object-contain ${className}`.trim()}
      />
    );
  }
  return <span className={`text-3xl md:text-4xl ${className}`.trim()}>{icon}</span>;
}
