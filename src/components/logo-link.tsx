import Image from "next/image";

/** Hub board. The hostname stays in the href only. */
export const GRADED_CALLS_HUB_HREF = "https://charoof.vercel.app";

export function LogoLink() {
  return (
    <a href={GRADED_CALLS_HUB_HREF} className="brand-link shrink-0 items-center gap-2.5" aria-label="GradedCalls">
      <Image src="/gradedcalls-mark.png" alt="GradedCalls" width={44} height={44} priority className="gc-mark" />
      <span className="text-[17px] font-semibold tracking-tight">
        Graded<span className="text-brass">Calls</span>
      </span>
    </a>
  );
}
