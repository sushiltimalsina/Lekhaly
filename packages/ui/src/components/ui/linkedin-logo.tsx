import * as React from "react";

export function LinkedInLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect width="24" height="24" rx="2" fill="#0A66C2" />
      <path fill="#FFF" d="M7.17 9.33H4.3V19h2.87V9.33ZM5.74 4.75A1.68 1.68 0 1 0 5.75 8.1a1.68 1.68 0 0 0-.01-3.35ZM19.7 13.46c0-2.92-1.56-4.28-3.64-4.28-1.68 0-2.43.92-2.85 1.57V9.33h-2.87V19h2.87v-4.79c0-1.26.24-2.48 1.8-2.48 1.54 0 1.56 1.44 1.56 2.56V19h2.87v-5.54Z" />
    </svg>
  );
}
