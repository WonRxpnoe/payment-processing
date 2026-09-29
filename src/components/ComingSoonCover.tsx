import { useEffect } from "react";
import { KithPayLogo } from "./KithPayLogo";

const COVER_TITLE = "KithPay — Coming soon";

export function ComingSoonCover() {
  useEffect(() => {
    const previousTitle = document.title;
    const applyTitle = () => {
      if (document.title !== COVER_TITLE) document.title = COVER_TITLE;
    };
    applyTitle();
    const title = document.querySelector("title");
    const observer = title ? new MutationObserver(applyTitle) : null;
    if (title) observer?.observe(title, { childList: true, subtree: true, characterData: true });
    return () => {
      observer?.disconnect();
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div aria-hidden="true" className="grid h-1.5 grid-cols-4">
        <span className="bg-chart-1" />
        <span className="bg-chart-2" />
        <span className="bg-chart-3" />
        <span className="bg-chart-4" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <KithPayLogo height={48} className="h-12 w-auto" />
        <h1 className="mt-10 font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Coming soon
        </h1>
      </div>
    </main>
  );
}
