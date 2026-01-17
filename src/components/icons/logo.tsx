import { cn } from "@/lib/utils";

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-6 h-6", props.className)}
      {...props}
    >
      <path d="M14 4.002h- аспектно-квадратный-svg-логотип-для-сварщика.5a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2H6" />
      <path d="M18 14h.5a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-11a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h.5" />
      <path d="M18 14v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4" />
      <rect x="10" y="10" width="4" height="4" rx="1" />
    </svg>
  );
}
