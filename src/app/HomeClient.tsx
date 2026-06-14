"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface HomeClientProps {
  userId: string | null;
}

export default function HomeClient({ userId }: HomeClientProps) {
  useEffect(() => {
    // TERMINAL TYPEWRITER
    const termLines = [
      { type: "cmd", prompt: "$", text: "contexthub score-change --pr 2847" },
      { type: "comment", text: "# Analyzing diff — 23 files changed..." },
      { type: "blank" },
      { type: "output", text: "ownership      → payments-team [RESTRICTED]" },
      { type: "output", text: "files_changed  → 23  blast_radius: HIGH" },
      { type: "output", text: "pii_patterns   → 3 matches in src/payments/" },
      { type: "output", text: "incidents_90d  → auth_middleware: 2 incidents" },
      { type: "output", text: "deploy_freeze  → ACTIVE (Fri 18:00 → Mon 08:00)" },
      { type: "output", text: "author         → agent:cursor-prod [NOT OWNER]" },
      { type: "blank" },
      { type: "risk", text: "RISK SCORE: 8/10 ——— BLOCK RECOMMENDED" },
      { type: "blank" },
      { type: "comment", text: "# Notifying #platform-eng on Slack..." },
      { type: "output", text: "alert_sent     → ✓ @payments-team pinged" },
    ];

    const tb = document.getElementById("terminal-body");
    if (!tb) return;

    tb.innerHTML = ""; // Clear existing
    let lineIdx = 0;

    function typeText(el: HTMLElement, text: string, speed: number, cb: () => void) {
      let i = 0;
      const iv = setInterval(() => {
        el.textContent = text.slice(0, ++i);
        if (i >= text.length) {
          clearInterval(iv);
          setTimeout(cb, 200);
        }
      }, speed);
    }

    function nextLine() {
      if (lineIdx < termLines.length) {
        renderLine(termLines[lineIdx++]);
      } else {
        const badge = document.getElementById("risk-badge");
        if (badge) {
          setTimeout(() => {
            badge.style.opacity = "1";
          }, 400);
        }
      }
    }

    function renderLine(line: any) {
      const div = document.createElement("div");
      if (line.type === "blank") {
        div.className = "t-blank";
        tb?.appendChild(div);
        return nextLine();
      }
      div.className = "t-line";
      if (line.type === "cmd") {
        div.innerHTML = `<span class="t-prompt">${line.prompt}</span><span class="t-cmd"></span>`;
        tb?.appendChild(div);
        const cmdEl = div.querySelector(".t-cmd") as HTMLElement;
        if (cmdEl) {
          typeText(cmdEl, line.text, 40, nextLine);
        }
        return;
      }
      if (line.type === "comment") {
        div.innerHTML = `<span class="t-comment">${line.text}</span>`;
      } else if (line.type === "risk") {
        div.innerHTML = `<span class="t-risk-high">${line.text}</span>`;
      } else {
        const [key, val] = line.text.split(" → ");
        div.innerHTML = `<span class="t-output"><span class="t-key">${key.padEnd(
          15
        )}</span> <span style="color:var(--text-dim)">→</span> <span class="t-val">${val}</span></span>`;
      }
      tb?.appendChild(div);
      setTimeout(nextLine, line.type === "comment" ? 300 : 150);
    }

    setTimeout(() => nextLine(), 800);

    // SCROLL ANIMATIONS
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".tl-item, .failure-card, .step, .fade-in").forEach((el) => {
      observer.observe(el);
    });

    // STAGGER FAILURE CARDS & STEPS DELAYS
    document.querySelectorAll(".failure-card").forEach((card: any, i) => {
      card.style.transitionDelay = i * 0.07 + "s";
    });
    document.querySelectorAll(".step").forEach((step: any, i) => {
      step.style.transitionDelay = i * 0.1 + "s";
    });

    // COUNT UP
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const target = parseInt(el.dataset.target || "0", 10);
            let current = 0;
            const step = target / 60;
            const iv = setInterval(() => {
              current = Math.min(current + step, target);
              el.textContent = String(Math.floor(current));
              if (current >= target) clearInterval(iv);
            }, 20);
            countObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll(".count-up").forEach((el) => countObserver.observe(el));

    return () => {
      observer.disconnect();
      countObserver.disconnect();
    };
  }, []);

  const marqueeItems = [
    { text: "Change Risk Scoring", accent: null },
    { text: "MCP Native", accent: "↯" },
    { text: "Ownership Intelligence", accent: null },
    { text: "CI/CD Integration", accent: "→" },
    { text: "Agent Safety Layer", accent: null },
    { text: "PCI Compliance Aware", accent: "⊠" },
    { text: "Incident Correlation", accent: null },
    { text: "Deploy Freeze Aware", accent: "⊡" },
  ];
  const doubledItems = [...marqueeItems, ...marqueeItems];

  return (
    <div className="landing-root">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@300;400;500;600&family=Syne:wght@400;700;800&display=swap');

        .landing-root {
          --bg: #080808;
          --surface: #0f0f0f;
          --border: #1e1e1e;
          --border-bright: #2e2e2e;
          --text: #e8e4dc;
          --text-dim: #6a6560;
          --text-mid: #9e9890;
          --accent: #e8c547;
          --accent-dim: #a8901f;
          --red: #e84747;
          --green: #47e8a0;
          --blue: #47a8e8;
          --mono: 'IBM Plex Mono', monospace;
          --serif: 'DM Serif Display', serif;
          --sans: 'Syne', sans-serif;

          background: var(--bg);
          color: var(--text);
          font-family: var(--mono);
          min-height: 100vh;
          width: 100%;
          position: relative;
        }

        .landing-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Noise overlay */
        .landing-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1000;
          opacity: 0.35;
        }

        /* NAV */
        .landing-root nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
          border-bottom: 1px solid var(--border);
          background: rgba(8,8,8,0.85);
          backdrop-filter: blur(12px);
        }
        .landing-root .nav-logo {
          font-family: var(--sans);
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text);
        }
        .landing-root .nav-logo span { color: var(--accent); }
        .landing-root .nav-links {
          display: flex;
          gap: 36px;
          list-style: none;
          align-items: center;
        }
        .landing-root .nav-links a {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-dim);
          text-decoration: none;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .landing-root .nav-links a:hover { color: var(--text); }
        .landing-root .nav-cta {
          font-family: var(--mono);
          font-size: 11px;
          background: var(--accent);
          color: #000;
          padding: 9px 20px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          font-weight: 600;
          transition: background 0.2s, transform 0.2s;
        }
        .landing-root .nav-cta:hover { background: #fff; transform: translateY(-1px); }

        /* HERO */
        .landing-root .hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid var(--border);
          padding-top: 80px;
        }
        .landing-root .hero-left {
          padding: 80px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-right: 1px solid var(--border);
          position: relative;
        }
        .landing-root .hero-tag {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .landing-root .hero-tag::before {
          content: '';
          display: inline-block;
          width: 24px;
          height: 1px;
          background: var(--accent);
        }
        .landing-root .hero-h1 {
          font-family: var(--serif);
          font-size: clamp(52px, 5.5vw, 80px);
          line-height: 1.02;
          letter-spacing: -0.01em;
          margin-bottom: 32px;
          color: var(--text);
        }
        .landing-root .hero-h1 em {
          font-style: italic;
          color: var(--accent);
        }
        .landing-root .hero-sub {
          font-size: 13px;
          line-height: 1.8;
          color: var(--text-mid);
          max-width: 440px;
          margin-bottom: 48px;
        }
        .landing-root .hero-sub strong { color: var(--text); font-weight: 500; }
        .landing-root .hero-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .landing-root .btn-primary {
          font-family: var(--mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: var(--accent);
          color: #000;
          padding: 14px 28px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .landing-root .btn-primary::after {
          content: '→';
          transition: transform 0.2s;
        }
        .landing-root .btn-primary:hover { background: #fff; }
        .landing-root .btn-primary:hover::after { transform: translateX(4px); }
        .landing-root .btn-ghost {
          font-family: var(--mono);
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s;
          padding: 14px 0;
          border-bottom: 1px solid var(--border-bright);
        }
        .landing-root .btn-ghost:hover { color: var(--text); border-color: var(--text-dim); }

        .landing-root .hero-stats {
          margin-top: 64px;
          display: flex;
          gap: 0;
          border-top: 1px solid var(--border);
          padding-top: 32px;
        }
        .landing-root .stat {
          flex: 1;
          padding-right: 24px;
        }
        .landing-root .stat + .stat { padding-left: 24px; border-left: 1px solid var(--border); }
        .landing-root .stat-num {
          font-family: var(--serif);
          font-size: 36px;
          color: var(--text);
          line-height: 1;
          margin-bottom: 6px;
        }
        .landing-root .stat-label {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
        }

        /* HERO RIGHT — live terminal */
        .landing-root .hero-right {
          padding: 80px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          background: var(--surface);
        }
        .landing-root .terminal-window {
          background: #000;
          border: 1px solid var(--border-bright);
          position: relative;
        }
        .landing-root .terminal-bar {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-bright);
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0a0a0a;
        }
        .landing-root .t-dot { width: 10px; height: 10px; border-radius: 50%; }
        .landing-root .t-dot.red { background: #e84747; }
        .landing-root .t-dot.yellow { background: var(--accent); }
        .landing-root .t-dot.green { background: var(--green); }
        .landing-root .terminal-title {
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.1em;
          margin-left: 8px;
        }
        .landing-root .terminal-body {
          padding: 24px;
          font-size: 12px;
          line-height: 1.8;
          min-height: 340px;
        }
        .landing-root .t-line { display: flex; gap: 10px; align-items: flex-start; }
        .landing-root .t-prompt { color: var(--accent); user-select: none; flex-shrink: 0; }
        .landing-root .t-cmd { color: var(--text); }
        .landing-root .t-comment { color: var(--text-dim); }
        .landing-root .t-output { color: var(--text-mid); margin-left: 18px; }
        .landing-root .t-risk-high { color: var(--red); font-weight: 600; }
        .landing-root .t-risk-med { color: var(--accent); font-weight: 600; }
        .landing-root .t-risk-low { color: var(--green); font-weight: 600; }
        .landing-root .t-key { color: var(--blue); }
        .landing-root .t-val { color: var(--green); }
        .landing-root .t-blank { height: 8px; }
        .landing-root .blink { animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .landing-root .t-cursor { display: inline-block; width: 8px; height: 14px; background: var(--accent); vertical-align: middle; }

        .landing-root .risk-badge {
          display: inline-block;
          margin-top: 20px;
          background: rgba(232, 71, 71, 0.1);
          border: 1px solid rgba(232,71,71,0.3);
          padding: 14px 20px;
          color: var(--text);
          font-size: 12px;
          line-height: 1.7;
        }
        .landing-root .risk-score-num {
          font-family: var(--serif);
          font-size: 48px;
          color: var(--red);
          line-height: 1;
          margin-right: 12px;
        }
        .landing-root .risk-badge-row {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .landing-root .risk-badge-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-dim);
        }
        .landing-root .risk-reasons { font-size: 11px; color: var(--text-mid); line-height: 1.7; }
        .landing-root .risk-reasons li { list-style: none; padding-left: 14px; position: relative; }
        .landing-root .risk-reasons li::before { content: '↳'; position: absolute; left: 0; color: var(--red); }

        /* MARQUEE */
        .landing-root .marquee-wrap {
          overflow: hidden;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 14px 0;
          background: var(--surface);
        }
        .landing-root .marquee-track {
          display: flex;
          gap: 0;
          animation: marquee 22s linear infinite;
          width: max-content;
        }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .landing-root .marquee-item {
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-dim);
          padding: 0 40px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .landing-root .marquee-item span { color: var(--accent); }

        /* SECTION GENERIC */
        .landing-root section { position: relative; }
        .landing-root .section-label {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .landing-root .section-label::before { content: '//'; color: var(--text-dim); }
        .landing-root .section-h2 {
          font-family: var(--serif);
          font-size: clamp(36px, 4vw, 58px);
          line-height: 1.05;
          color: var(--text);
          margin-bottom: 20px;
        }
        .landing-root .section-h2 em { font-style: italic; color: var(--accent); }
        .landing-root .section-sub {
          font-size: 13px;
          line-height: 1.85;
          color: var(--text-mid);
          max-width: 520px;
        }

        /* WHY NOW */
        .landing-root .why-now {
          display: grid;
          grid-template-columns: 380px 1fr;
          border-bottom: 1px solid var(--border);
        }
        .landing-root .why-now-left {
          padding: 80px 48px;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .landing-root .why-now-right {
          padding: 80px 48px;
        }
        .landing-root .timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .landing-root .tl-item {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 24px;
          padding: 28px 0;
          border-bottom: 1px solid var(--border);
          position: relative;
          opacity: 0;
          transform: translateX(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .landing-root .tl-item.visible { opacity: 1; transform: none; }
        .landing-root .tl-item:last-child { border-bottom: none; }
        .landing-root .tl-year {
          font-family: var(--serif);
          font-size: 22px;
          color: var(--text-dim);
          line-height: 1;
          padding-top: 3px;
          transition: color 0.3s;
        }
        .landing-root .tl-item.active .tl-year { color: var(--accent); }
        .landing-root .tl-content-title {
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
          letter-spacing: 0.05em;
        }
        .landing-root .tl-content-text {
          font-size: 12px;
          line-height: 1.75;
          color: var(--text-mid);
        }
        .landing-root .tl-item.active {
          background: linear-gradient(90deg, rgba(232,197,71,0.04) 0%, transparent 100%);
          margin: 0 -48px;
          padding: 28px 48px;
        }
        .landing-root .tl-inflection {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          background: rgba(232,197,71,0.15);
          color: var(--accent);
          padding: 4px 10px;
          margin-bottom: 8px;
        }

        /* FAILURE GRID */
        .landing-root .failures {
          padding: 80px 48px;
          border-bottom: 1px solid var(--border);
        }
        .landing-root .failures-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          margin-bottom: 60px;
        }
        .landing-root .failure-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--border);
          border-left: 1px solid var(--border);
        }
        .landing-root .failure-card {
          padding: 32px 28px;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.4s ease, transform 0.4s ease, background 0.3s;
          cursor: default;
        }
        .landing-root .failure-card.visible { opacity: 1; transform: none; }
        .landing-root .failure-card:hover { background: var(--surface); }
        .landing-root .failure-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--accent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }
        .landing-root .failure-card:hover::before { transform: scaleX(1); }
        .landing-root .failure-num {
          font-family: var(--serif);
          font-size: 42px;
          color: var(--border-bright);
          line-height: 1;
          margin-bottom: 16px;
          transition: color 0.3s;
        }
        .landing-root .failure-card:hover .failure-num { color: var(--accent); }
        .landing-root .failure-title {
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 10px;
          letter-spacing: 0.03em;
        }
        .landing-root .failure-text {
          font-size: 11px;
          line-height: 1.75;
          color: var(--text-dim);
        }
        .landing-root .failure-tag {
          display: inline-block;
          margin-top: 14px;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 4px 8px;
        }
        .landing-root .tag-critical { background: rgba(232,71,71,0.1); color: var(--red); }
        .landing-root .tag-high { background: rgba(232,197,71,0.1); color: var(--accent); }
        .landing-root .tag-med { background: rgba(71,168,232,0.1); color: var(--blue); }

        /* HOW IT WORKS */
        .landing-root .how {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid var(--border);
        }
        .landing-root .how-left {
          padding: 80px 48px;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .landing-root .how-right {
          padding: 80px 48px;
          background: var(--surface);
        }
        .landing-root .steps {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-top: 48px;
        }
        .landing-root .step {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 20px;
          padding: 28px 0;
          border-bottom: 1px solid var(--border);
          opacity: 0;
          transform: translateX(-16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .landing-root .step.visible { opacity: 1; transform: none; }
        .landing-root .step:last-child { border-bottom: none; }
        .landing-root .step-num {
          font-family: var(--serif);
          font-size: 28px;
          color: var(--accent);
          line-height: 1;
          padding-top: 4px;
        }
        .landing-root .step-title {
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 8px;
          letter-spacing: 0.04em;
        }
        .landing-root .step-text {
          font-size: 12px;
          line-height: 1.75;
          color: var(--text-mid);
        }
        .landing-root .step-code {
          display: inline-block;
          margin-top: 10px;
          font-size: 11px;
          color: var(--green);
          background: rgba(71,232,160,0.07);
          padding: 6px 12px;
          border-left: 2px solid var(--green);
        }

        /* MCP INTERFACE */
        .landing-root .mcp-panel {
          background: #000;
          border: 1px solid var(--border-bright);
          font-size: 12px;
          line-height: 1.8;
        }
        .landing-root .mcp-header {
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #050505;
        }
        .landing-root .mcp-title { color: var(--text-dim); font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; }
        .landing-root .mcp-status { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--green); }
        .landing-root .mcp-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse-green 2s infinite; }
        @keyframes pulse-green { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .landing-root .mcp-body { padding: 20px; }
        .landing-root .mcp-tool {
          margin-bottom: 16px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
        }
        .landing-root .mcp-tool-header {
          padding: 10px 16px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid var(--border);
          font-size: 11px;
          color: var(--accent);
          font-weight: 600;
          display: flex;
          justify-content: space-between;
        }
        .landing-root .mcp-tool-type { color: var(--text-dim); font-weight: 400; font-size: 10px; }
        .landing-root .mcp-tool-body { padding: 12px 16px; font-size: 11px; color: var(--text-mid); line-height: 1.7; }
        .landing-root .mcp-param { color: var(--blue); }
        .landing-root .mcp-type { color: var(--text-dim); font-style: italic; }

        /* METRICS */
        .landing-root .metrics {
          border-bottom: 1px solid var(--border);
        }
        .landing-root .metrics-top {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid var(--border);
        }
        .landing-root .metric-card {
          padding: 60px 48px;
          border-right: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }
        .landing-root .metric-card:last-child { border-right: none; }
        .landing-root .metric-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0;
          transition: opacity 0.4s;
        }
        .landing-root .metric-card:hover::after { opacity: 1; }
        .landing-root .metric-num {
          font-family: var(--serif);
          font-size: 72px;
          line-height: 1;
          color: var(--text);
          margin-bottom: 8px;
        }
        .landing-root .metric-num sup { font-size: 32px; color: var(--accent); vertical-align: super; }
        .landing-root .metric-label {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 16px;
        }
        .landing-root .metric-sub { font-size: 12px; color: var(--text-mid); line-height: 1.7; }
        .landing-root .metrics-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .landing-root .metrics-quote {
          padding: 60px 48px;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .landing-root .quote-text {
          font-family: var(--serif);
          font-size: 28px;
          font-style: italic;
          line-height: 1.4;
          color: var(--text);
          margin-bottom: 24px;
        }
        .landing-root .quote-text em { color: var(--accent); }
        .landing-root .quote-attr {
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .landing-root .quote-bar {
          width: 40px;
          height: 1px;
          background: var(--accent);
          margin-bottom: 10px;
        }
        .landing-root .metrics-cta {
          padding: 60px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--surface);
        }
        .landing-root .metrics-cta .section-label { margin-bottom: 24px; }
        .landing-root .metrics-cta p { font-size: 13px; color: var(--text-mid); line-height: 1.75; margin-bottom: 32px; }

        /* PRICING */
        .landing-root .pricing {
          padding: 80px 48px;
          border-bottom: 1px solid var(--border);
        }
        .landing-root .pricing-header { margin-bottom: 60px; }
        .landing-root .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid var(--border);
        }
        .landing-root .price-card {
          padding: 40px 36px;
          border-right: 1px solid var(--border);
          position: relative;
          transition: background 0.3s;
        }
        .landing-root .price-card:last-child { border-right: none; }
        .landing-root .price-card.featured {
          background: linear-gradient(180deg, rgba(232,197,71,0.06) 0%, transparent 100%);
          border-top: 2px solid var(--accent);
        }
        .landing-root .price-tier {
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 20px;
        }
        .landing-root .price-tier.featured-label { color: var(--accent); }
        .landing-root .price-amount {
          font-family: var(--serif);
          font-size: 52px;
          color: var(--text);
          line-height: 1;
          margin-bottom: 6px;
        }
        .landing-root .price-amount span { font-family: var(--mono); font-size: 18px; vertical-align: super; }
        .landing-root .price-period { font-size: 11px; color: var(--text-dim); margin-bottom: 32px; }
        .landing-root .price-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 36px;
          border-top: 1px solid var(--border);
          padding-top: 24px;
        }
        .landing-root .price-features li {
          font-size: 12px;
          color: var(--text-mid);
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .landing-root .price-features li::before { content: '→'; color: var(--accent); flex-shrink: 0; }
        .landing-root .price-cta {
          display: block;
          text-align: center;
          padding: 12px;
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1px solid var(--border-bright);
          color: var(--text-dim);
          transition: all 0.2s;
        }
        .landing-root .price-cta:hover { border-color: var(--text); color: var(--text); }
        .landing-root .price-cta.featured-cta {
          background: var(--accent);
          color: #000;
          border-color: var(--accent);
          font-weight: 700;
        }
        .landing-root .price-cta.featured-cta:hover { background: #fff; border-color: #fff; }

        /* FOOTER */
        .landing-root footer {
          padding: 60px 48px;
          border-top: 1px solid var(--border);
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 48px;
          background: var(--bg);
        }
        .landing-root .footer-brand .nav-logo { font-size: 16px; margin-bottom: 16px; display: block; }
        .landing-root .footer-brand p { font-size: 11px; color: var(--text-dim); line-height: 1.75; max-width: 220px; }
        .landing-root .footer-col h4 {
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 20px;
        }
        .landing-root .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .landing-root .footer-col ul li a {
          font-size: 12px;
          color: var(--text-dim);
          text-decoration: none;
          transition: color 0.2s;
        }
        .landing-root .footer-col ul li a:hover { color: var(--text); }
        .landing-root .footer-bottom {
          padding: 20px 48px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg);
        }
        .landing-root .footer-bottom p { font-size: 10px; color: var(--text-dim); letter-spacing: 0.08em; }

        /* SCROLL ANIMATIONS */
        .landing-root .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .landing-root .fade-in.visible {
          opacity: 1;
          transform: none;
        }

        /* GLOW EFFECT */
        .landing-root .glow-accent { text-shadow: 0 0 40px rgba(232,197,71,0.4); }

        /* BADGE */
        .landing-root .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--green);
          border: 1px solid rgba(71,232,160,0.25);
          padding: 6px 12px;
          margin-bottom: 32px;
        }
        .landing-root .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse-green 1.5s infinite; }

        /* HORIZONTAL RULE */
        .landing-root .h-rule { height: 1px; background: var(--border); }

        /* ANIMATED COUNTER */
        .landing-root .count-up { display: inline; }

        /* GRID DECORATION */
        .landing-root .grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 48px 48px;
          opacity: 0.3;
          pointer-events: none;
        }

        /* FLOATING NUMBERS */
        .landing-root .float-num {
          position: absolute;
          font-family: var(--serif);
          font-size: 180px;
          color: rgba(255,255,255,0.02);
          right: -20px;
          top: -20px;
          line-height: 1;
          user-select: none;
          pointer-events: none;
        }

        /* RESPONSIVITY FIXES */
        @media (max-width: 968px) {
          .landing-root .hero {
            grid-template-columns: 1fr;
          }
          .landing-root .hero-left {
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .landing-root .why-now {
            grid-template-columns: 1fr;
          }
          .landing-root .why-now-left {
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .landing-root .failures-header {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .landing-root .failure-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .landing-root .how {
            grid-template-columns: 1fr;
          }
          .landing-root .how-left {
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .landing-root .metrics-top {
            grid-template-columns: 1fr;
          }
          .landing-root .metric-card {
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .landing-root .metrics-bottom {
            grid-template-columns: 1fr;
          }
          .landing-root .metrics-quote {
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .landing-root .pricing-grid {
            grid-template-columns: 1fr;
          }
          .landing-root .price-card {
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .landing-root footer {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .landing-root .failure-grid {
            grid-template-columns: 1fr;
          }
          .landing-root footer {
            grid-template-columns: 1fr;
          }
        }
      ` }} />

      {/* NAV */}
      <nav>
        <div className="nav-logo">
          Context<span>Hub</span> AI
        </div>
        <ul className="nav-links">
          <li><a href="#why">Why Now</a></li>
          <li><a href="#failures">Failure Index</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li>
            {userId ? (
              <Link href="/dashboard" className="nav-cta">
                Dashboard
              </Link>
            ) : (
              <Link href="/sign-in" className="nav-cta">
                Sign In
              </Link>
            )}
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="grid-bg"></div>
          <div className="live-badge">
            <div className="live-dot"></div> Now in Private Beta
          </div>
          <div className="hero-tag">Organizational Context Infrastructure</div>
          <h1 className="hero-h1">
            The context layer<br />
            your AI agents<br />
            <em>desperately need</em>
          </h1>
          <p className="hero-sub">
            AI coding agents write production code at 3am and don't know that{" "}
            <strong>auth_legacy drives 40% of revenue</strong>, the payments
            module is on PCI lockdown, or that Friday deploys are forbidden.
            <br />
            <br />
            ContextHub is the mandatory pipe between autonomous agents and
            enterprise codebases.
          </p>
          <div className="hero-actions">
            {userId ? (
              <Link href="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/sign-up" className="btn-primary">
                Install in 10 Minutes
              </Link>
            )}
            <a href="#how" className="btn-ghost">
              See a live score ↓
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-num">
                6<span style={{ color: "var(--accent)", fontFamily: "var(--mono)", fontSize: "20px" }}>wk</span>
              </div>
              <div className="stat-label">To build MVP</div>
            </div>
            <div className="stat">
              <div className="stat-num">
                10<span style={{ color: "var(--accent)", fontFamily: "var(--mono)", fontSize: "20px" }}>min</span>
              </div>
              <div className="stat-label">CI/CD integration</div>
            </div>
            <div className="stat">
              <div className="stat-num">0</div>
              <div className="stat-label">Workflow changes</div>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="terminal-window">
            <div className="terminal-bar">
              <div className="t-dot red"></div>
              <div className="t-dot yellow"></div>
              <div className="t-dot green"></div>
              <span className="terminal-title">contexthub — score_change — PR #2847</span>
            </div>
            <div className="terminal-body" id="terminal-body">
              {/* filled by JS */}
            </div>
          </div>
          <div className="risk-badge" id="risk-badge" style={{ opacity: 0, transition: "opacity 0.5s" }}>
            <div className="risk-badge-row">
              <span className="risk-score-num">8</span>
              <div>
                <div className="risk-badge-label">Risk Score / 10</div>
                <div style={{ fontSize: "10px", color: "var(--red)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  ⚠ Critical — Block Recommended
                </div>
              </div>
            </div>
            <ul className="risk-reasons">
              <li>Modifies <code style={{ color: "var(--red)" }}>src/payments/</code> — owned by PCI-locked Payments team</li>
              <li>Touches <code style={{ color: "var(--accent)" }}>auth_middleware.go</code> — 2 incidents in 90 days</li>
              <li>Deploy freeze active — Friday 18:00 UTC → Monday 08:00 UTC</li>
              <li>Author is AI agent, not Payments team member</li>
            </ul>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track" id="marquee-track">
          {doubledItems.map((item, idx) => (
            <div key={idx} className="marquee-item">
              {item.accent && <span>{item.accent}</span>} {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* WHY NOW */}
      <section className="why-now" id="why">
        <div className="why-now-left">
          <div className="section-label">Why This Moment</div>
          <h2 className="section-h2">
            The exact<br />
            <em>inflection</em><br />
            point
          </h2>
          <p className="section-sub">
            Three things converged in 2026: agents crossed the autonomy threshold,
            enterprises hit organizational context failures at scale, and MCP became
            a real distribution standard.
          </p>
          <div style={{ marginTop: "36px", padding: "20px", border: "1px solid var(--border)", background: "var(--surface)" }}>
            <div className="section-label" style={{ marginBottom: "12px" }}>The Product Law</div>
            <p style={{ fontSize: "12px", color: "var(--text-mid)", lineHeight: "1.8" }}>
              Impossible before MCP existed.<br />
              Unnecessary before agents were autonomous.<br />
              <strong style={{ color: "var(--accent)" }}>Both became true 18 months ago.</strong>
            </p>
          </div>
        </div>
        <div className="why-now-right">
          <div className="timeline">
            <div className="tl-item" data-year="2020">
              <div className="tl-year">2020</div>
              <div>
                <div className="tl-content-title">Pain doesn't exist yet</div>
                <div className="tl-content-text">No AI writing production code. The problem is theoretical. Nothing to build.</div>
              </div>
            </div>
            <div className="tl-item" data-year="2022">
              <div className="tl-year">2022</div>
              <div>
                <div className="tl-content-title">GitHub Copilot — autocomplete era</div>
                <div className="tl-content-text">Unit of work: one line or function. Context failures are embarrassing, not catastrophic. The human is still in every loop.</div>
              </div>
            </div>
            <div className="tl-item" data-year="2024">
              <div className="tl-year">2024</div>
              <div>
                <div className="tl-content-title">Agentic coding emerges</div>
                <div className="tl-content-text">Claude, GPT-4, Cursor ship as agents. Adoption still individual. Volume low enough that failures are recoverable.</div>
              </div>
            </div>
            <div className="tl-item active" data-year="2026">
              <div className="tl-year">2026</div>
              <div>
                <div className="tl-inflection">↯ Inflection Point</div>
                <div className="tl-content-title">All three forces converge</div>
                <div className="tl-content-text">Agents execute multi-sprint tasks autonomously. Enterprises hit the wall. MCP becomes the distribution channel. The window opened.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAILURES */}
      <section className="failures" id="failures">
        <div className="failures-header">
          <div>
            <div className="section-label">The Problem Space</div>
            <h2 className="section-h2">
              Where agents<br />
              <em>break things</em>
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <p className="section-sub">
              The top 4 failures account for ~80% of economic damage. Build for
              these 4 and you reach $10M ARR.
            </p>
          </div>
        </div>
        <div className="failure-grid">
          <div className="failure-card">
            <div className="float-num">01</div>
            <div className="failure-num">01</div>
            <div className="failure-title">Ownership Violation</div>
            <div className="failure-text">
              Agent modifies a PCI-locked module without knowing it belongs to a
              restricted team. No human catches it. Merges at 2am.
            </div>
            <span className="failure-tag tag-critical">Critical</span>
          </div>
          <div className="failure-card">
            <div className="float-num">02</div>
            <div className="failure-num">02</div>
            <div className="failure-title">Silent Downstream Breakage</div>
            <div className="failure-text">
              Agent refactors a utility function. 14 services depend on it. None
              break immediately. Production fails 6 days later.
            </div>
            <span className="failure-tag tag-critical">Critical</span>
          </div>
          <div className="failure-card">
            <div className="float-num">03</div>
            <div className="failure-num">03</div>
            <div className="failure-title">Incident Recurrence</div>
            <div className="failure-text">
              The same auth_middleware bug was fixed 8 months ago. Agent rewrites
              the file, reintroduces the pattern. Nobody remembers.
            </div>
            <span className="failure-tag tag-high">High</span>
          </div>
          <div className="failure-card">
            <div className="float-num">04</div>
            <div className="failure-num">04</div>
            <div className="failure-title">Compliance Blindness</div>
            <div className="failure-text">
              Agent writes GDPR-relevant data to a logging path. Neither the agent
              nor the reviewer knows the field contains PII.
            </div>
            <span className="failure-tag tag-critical">Critical</span>
          </div>
          <div className="failure-card">
            <div className="failure-num">05</div>
            <div className="failure-title">Freeze Violation</div>
            <div className="failure-text">
              Deploy freeze is active. Agent doesn't know. Opens and merges a PR
              against a locked release branch.
            </div>
            <span className="failure-tag tag-high">High</span>
          </div>
          <div className="failure-card">
            <div className="failure-num">06</div>
            <div className="failure-title">Blast Radius Blindness</div>
            <div className="failure-text">
              Agent touches 47 files in a single PR. Change size correlates with
              incident rate. No score, no review escalation.
            </div>
            <span className="failure-tag tag-high">High</span>
          </div>
          <div className="failure-card">
            <div className="failure-num">07</div>
            <div className="failure-title">Missing Review Routing</div>
            <div className="failure-text">
              PR touches payments, auth, and logging across three teams. Goes to
              one random reviewer who approves it in 4 minutes.
            </div>
            <span className="failure-tag tag-med">Medium</span>
          </div>
          <div className="failure-card">
            <div className="failure-num">08</div>
            <div className="failure-title">Architectural Drift</div>
            <div className="failure-text">
              Agent adds Redis dependency to a service that ADRs decree must remain
              stateless. Nobody checked the architecture decision record.
            </div>
            <span className="failure-tag tag-med">Medium</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="how-left">
          <div className="section-label">The Wedge</div>
          <h2 className="section-h2">
            Change Risk<br />
            <em>Scoring</em>
          </h2>
          <p className="section-sub">
            One API call: here's a diff, what's the risk? The score lands in CI/CD
            before the PR merges. No new workflow. No new tools.
          </p>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div>
                <div className="step-title">Agent opens a PR</div>
                <div className="step-text">
                  Any PR authored by an AI agent (detected via commit author or label)
                  triggers the ContextHub webhook.
                </div>
                <div className="step-code">on: pull_request → contexthub/score</div>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div>
                <div className="step-title">We analyze in seconds</div>
                <div className="step-text">
                  Files changed, CODEOWNERS, blast radius, deployment freeze state, PII
                  patterns, incident history — all in one pass.
                </div>
                <div className="step-code">score_change(files, diff, agent_id) → RiskScore</div>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div>
                <div className="step-title">Score lands on the PR</div>
                <div className="step-text">
                  Risk 1–10 with 3–5 sentence explanation posted as PR comment. High
                  scores trigger Slack alert to the owning team.
                </div>
                <div className="step-code">Risk: 8/10 — Block recommended → #platform-eng</div>
              </div>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <div>
                <div className="step-title">Data compounds over time</div>
                <div className="step-text">
                  Every scored PR teaches the model which signals predict real
                  incidents. After 6 months, your instance is dramatically smarter.
                </div>
                <div className="step-code">outcome_correlation → proprietary model upgrade</div>
              </div>
            </div>
          </div>
        </div>

        <div className="how-right" id="mcp">
          <div className="section-label" style={{ marginBottom: "32px" }}>
            MCP API Surface
          </div>
          <div className="mcp-panel">
            <div className="mcp-header">
              <span className="mcp-title">contexthub mcp server — v0.4.1</span>
              <span className="mcp-status">
                <div className="mcp-dot"></div> Connected
              </span>
            </div>
            <div className="mcp-body">
              <div className="mcp-tool">
                <div className="mcp-tool-header">
                  score_change
                  <span className="mcp-tool-type">tool</span>
                </div>
                <div className="mcp-tool-body">
                  <span className="mcp-param">files</span>
                  <span className="mcp-type">: string[]</span>,{" "}
                  <span className="mcp-param">diff</span>
                  <span className="mcp-type">: string</span>,{" "}
                  <span className="mcp-param">agent_id</span>
                  <span className="mcp-type">: string</span>
                  <br />
                  → <span style={{ color: "var(--green)" }}>RiskScore</span> — risk
                  (1–10), reasoning, suggested reviewers
                </div>
              </div>
              <div className="mcp-tool">
                <div className="mcp-tool-header">
                  get_ownership
                  <span className="mcp-tool-type">tool</span>
                </div>
                <div className="mcp-tool-body">
                  <span className="mcp-param">file_path</span>
                  <span className="mcp-type">: string</span>
                  <br />
                  → <span style={{ color: "var(--green)" }}>OwnershipContext</span> —
                  team, slack handle, restrictions, availability
                </div>
              </div>
              <div className="mcp-tool">
                <div className="mcp-tool-header">
                  get_constraints
                  <span className="mcp-tool-type">tool</span>
                </div>
                <div className="mcp-tool-body">
                  <span className="mcp-param">scope</span>
                  <span className="mcp-type">: string</span>
                  <br />
                  → <span style={{ color: "var(--green)" }}>Constraints</span> —
                  deploy windows, compliance, fragile patterns, ADRs
                </div>
              </div>
              <div className="mcp-tool" style={{ borderColor: "rgba(71,168,232,0.2)" }}>
                <div className="mcp-tool-header" style={{ color: "var(--blue)" }}>
                  context://incidents/{"{service}"}
                  <span className="mcp-tool-type">resource</span>
                </div>
                <div className="mcp-tool-body">
                  Recent incidents, root causes, and code patterns that triggered them
                  — streamed to the agent before it modifies a service.
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  background: "rgba(232,197,71,0.05)",
                  border: "1px solid rgba(232,197,71,0.15)",
                  fontSize: "11px",
                  color: "var(--text-dim)",
                }}
              >
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                  safe_agent_preamble
                </span>{" "}
                — drop this prompt fragment into your Claude Code config. The agent
                starts calling context tools before touching any file. Zero workflow
                change.
              </div>
            </div>
          </div>
          <div style={{ marginTop: "16px", padding: "20px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "12px" }}>
            <div style={{ color: "var(--text-dim)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
              Compatible agents
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ padding: "5px 12px", border: "1px solid var(--border-bright)", color: "var(--text-mid)", fontSize: "10px" }}>Cursor</span>
              <span style={{ padding: "5px 12px", border: "1px solid var(--border-bright)", color: "var(--text-mid)", fontSize: "10px" }}>Claude Code</span>
              <span style={{ padding: "5px 12px", border: "1px solid var(--border-bright)", color: "var(--text-mid)", fontSize: "10px" }}>Devin</span>
              <span style={{ padding: "5px 12px", border: "1px solid var(--border-bright)", color: "var(--text-mid)", fontSize: "10px" }}>OpenHands</span>
              <span style={{ padding: "5px 12px", border: "1px solid var(--border-bright)", color: "var(--text-mid)", fontSize: "10px" }}>Windsurf</span>
              <span style={{ padding: "5px 12px", border: "1px solid rgba(232,197,71,0.3)", color: "var(--accent)", fontSize: "10px" }}>+ Any MCP Agent</span>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="metrics" id="metrics">
        <div className="metrics-top">
          <div className="metric-card fade-in">
            <div className="metric-num">
              <span className="count-up" data-target="80">0</span>
              <sup>%</sup>
            </div>
            <div className="metric-label">of damage, 4 failure types</div>
            <div className="metric-sub">
              Ownership violation, downstream breakage, incident recurrence,
              compliance blindness. Fix these four, reach $10M ARR.
            </div>
          </div>
          <div className="metric-card fade-in">
            <div className="metric-num">
              <span className="count-up" data-target="18">0</span>
              <sup>mo</sup>
            </div>
            <div className="metric-label">before GitHub ships native</div>
            <div className="metric-sub">
              The window to become the industry standard before Microsoft adds agent
              risk scoring to Copilot Enterprise. The clock is running.
            </div>
          </div>
          <div className="metric-card fade-in">
            <div className="metric-num">
              <span className="count-up" data-target="30">0</span>
            </div>
            <div className="metric-label">customers to $1M ARR</div>
            <div className="metric-sub">
              30 customers at $2,500/month = $900K ARR. Achievable in 12–15 months
              with no enterprise sales motion.
            </div>
          </div>
        </div>
        <div className="metrics-bottom">
          <div className="metrics-quote fade-in">
            <div className="quote-bar"></div>
            <div className="quote-text">
              "The agent doesn't know that <em>auth_legacy serves 40% of revenue</em>{" "}
              and nobody touches it on Fridays."
            </div>
            <div className="quote-attr">— The incident that created this company</div>
          </div>
          <div className="metrics-cta fade-in">
            <div className="section-label">Ready to ship</div>
            <p>
              Install the GitHub App in 10 minutes. No CODEOWNERS migration, no
              workflow changes, no security review needed for the trial. The score
              appears on your next agent-generated PR.
            </p>
            {userId ? (
              <Link href="/dashboard" className="btn-primary" style={{ display: "inline-flex", width: "fit-content" }}>
                Access Dashboard
              </Link>
            ) : (
              <Link href="/sign-up" className="btn-primary" style={{ display: "inline-flex", width: "fit-content" }}>
                Request Early Access
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="pricing-header">
          <div className="section-label">Pricing</div>
          <h2 className="section-h2">
            Simple. Usage-based.<br />
            <em>No surprises.</em>
          </h2>
        </div>
        <div className="pricing-grid">
          <div className="price-card fade-in">
            <div className="price-tier">Starter</div>
            <div className="price-amount">
              <span>$</span>500
            </div>
            <div className="price-period">/ month · up to 20 engineers</div>
            <ul className="price-features">
              <li>GitHub App + GitLab webhook</li>
              <li>Risk scoring on agent PRs</li>
              <li>CODEOWNERS integration</li>
              <li>Slack alerts on score &ge; 7</li>
              <li>30-day dashboard</li>
            </ul>
            {userId ? (
              <Link href="/dashboard" className="price-cta">
                Dashboard
              </Link>
            ) : (
              <Link href="/sign-up" className="price-cta">
                Start Trial
              </Link>
            )}
          </div>
          <div className="price-card featured fade-in">
            <div className="price-tier featured-label">Platform → Most Popular</div>
            <div className="price-amount">
              <span>$</span>2,500
            </div>
            <div className="price-period">/ month · up to 100 engineers</div>
            <ul className="price-features">
              <li>Everything in Starter</li>
              <li>MCP server (all 3 tools)</li>
              <li>Incident history ingestion</li>
              <li>Multi-repo analysis</li>
              <li>Custom risk keywords</li>
              <li>Deployment freeze config</li>
              <li>90-day dashboard + exports</li>
            </ul>
            {userId ? (
              <Link href="/dashboard" className="price-cta featured-cta">
                Dashboard
              </Link>
            ) : (
              <Link href="/sign-up" className="price-cta featured-cta">
                Request Access
              </Link>
            )}
          </div>
          <div className="price-card fade-in">
            <div className="price-tier">Enterprise</div>
            <div className="price-amount" style={{ fontSize: "36px" }}>
              Custom
            </div>
            <div className="price-period">/ year · 500+ engineers</div>
            <ul className="price-features">
              <li>Everything in Platform</li>
              <li>SSO + SAML</li>
              <li>SOC 2 Type II report</li>
              <li>Dedicated onboarding</li>
              <li>SLA 99.9% uptime</li>
              <li>Audit logs + SIEM export</li>
              <li>Founder-led implementation</li>
            </ul>
            <a href="mailto:founder@contexthub.ai" className="price-cta">
              Talk to Founder
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-brand">
          <span className="nav-logo">
            Context<span>Hub</span> AI
          </span>
          <p>The context layer between autonomous AI agents and enterprise codebases.</p>
        </div>
        <div className="footer-col">
          <h4>Product</h4>
          <ul>
            <li><a href="#">Risk Scoring</a></li>
            <li><a href="#">MCP Server</a></li>
            <li><a href="#">GitHub App</a></li>
            <li><a href="#">API Docs</a></li>
            <li><a href="#">Changelog</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Security</a></li>
            <li><a href="#">Status</a></li>
          </ul>
        </div>
      </footer>
      <div className="footer-bottom">
        <p>© 2026 ContextHub AI, Inc. All rights reserved.</p>
        <p style={{ color: "var(--text-dim)" }}>Built for the agentic era · MCP Native</p>
      </div>
    </div>
  );
}
