import { Camera, Play, AtSign, Briefcase, Globe2, MapPin, Radio, Layers, Leaf, CalendarClock, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  instagram: Camera,
  youtube: Play,
  x: AtSign,
  linkedin: Briefcase,
  facebook: Globe2,
  "google business": MapPin,
  "google biz": MapPin,
  buffer: Radio,
  hootsuite: Layers,
  "sprout social": Leaf,
  later: CalendarClock,
};

export function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = iconMap[platform.toLowerCase()] || Globe2;
  return <Icon className={className} />;
}

export default iconMap;
