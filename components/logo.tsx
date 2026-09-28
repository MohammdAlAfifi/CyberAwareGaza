import Image from "next/image";

export function Logo({ priority = false }: { priority?: boolean }) {
  return (
    <Image
      src="/CyberAwareGaza_Logo.jpg"
      alt="CyberAwareGaza"
      width={270}
      height={82}
      sizes="(max-width: 640px) 152px, 192px"
      priority={priority}
      className="brand-logo"
    />
  );
}
