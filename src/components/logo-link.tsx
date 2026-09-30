import Image from "next/image";

/** Hub board. The hostname stays in the href only. */
export const GRADED_CALLS_HUB_HREF = "https://charoof.vercel.app";

export function LogoLink() {
  return (
    <a
      href={GRADED_CALLS_HUB_HREF}
      className="brand-link shrink-0 items-center gap-2.5"
      aria-label="GradedCalls"
      style={{ minWidth: 44, minHeight: 44 }}
    >
      <Image
        src="/gradedcalls-mark-transparent.png"
        alt="GradedCalls"
        width={44}
        height={44}
        priority
        unoptimized
        className="gc-mark"
        style={{ width: 44, height: 44, display: "block", objectFit: "contain", backgroundColor: "transparent" }}
      />
      <span className="text-[17px] font-semibold tracking-tight">
        Graded<span className="text-brass">Calls</span>
      </span>
    </a>
  );
}
