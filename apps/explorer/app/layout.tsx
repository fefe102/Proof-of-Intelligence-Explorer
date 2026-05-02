import type { Metadata } from "next";
import Link from "next/link";
import { ProductMark } from "../components/product-logo";
import { ThemeToggle } from "../components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeGuardian iNFT",
  description:
    "Autonomous 0G Agentic ID / iNFT code-review agent verified by AgentProof.",
  applicationName: "CodeGuardian iNFT",
};

const themeInitScript = `
  (() => {
    try {
      const stored = window.localStorage.getItem("poi-theme");
      const theme = stored === "light" || stored === "dark"
        ? stored
        : "dark";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch {
      document.documentElement.dataset.theme = "dark";
      document.documentElement.style.colorScheme = "dark";
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <header className="app-shell-header no-print">
          <nav className="app-shell-nav">
            <Link
              href="/"
              className="app-brand"
              aria-label="Proof-of-Intelligence Explorer home"
            >
              <ProductMark className="app-brand-mark" />
              <span className="app-brand-copy">
                <span>CodeGuardian iNFT</span>
                <span>AgentProof Explorer</span>
              </span>
            </Link>
            <div className="app-shell-links">
              <Link href="/judge">Judge Mode</Link>
              <Link href="/agent/codeguardian/console">Agent Console</Link>
              <Link href="/verify">Verify</Link>
              <Link href="/create">Create Passport</Link>
              <Link href="/agent/codeguardian">Proof</Link>
              <Link href="/developer">Developer</Link>
              <Link href="/admin" className="app-shell-secondary-link">
                Admin
              </Link>
            </div>
            <ThemeToggle />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
