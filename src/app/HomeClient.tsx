"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface HomeClientProps {
  userId: string | null;
}

const dashboardCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  .dashboard-root {
    --bg:           #F2F2F7;
    --surface:      #FFFFFF;
    --surface2:     #F9F9FB;
    --border:       #E5E5EA;
    --border-mid:   #D1D1D6;
    --text:         #1C1C1E;
    --text-sec:     #3C3C43;
    --text-ter:     #6C6C70;
    --text-quat:    #AEAEB2;

    --red:          #FF3B30;
    --red-bg:       #FFF2F1;
    --red-border:   #FFDAD8;
    --amber:        #FF9500;
    --amber-bg:     #FFF8EE;
    --amber-border: #FFE5B3;
    --green:        #34C759;
    --green-bg:     #F0FBF3;
    --green-border: #C3EDCE;
    --blue:         #007AFF;
    --blue-bg:      #F0F5FF;
    --blue-border:  #C7D9FF;
    --purple:       #5856D6;

    --accent:       #1C1C1E;
    --accent-fg:    #FFFFFF;

    --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --sidebar-w: 228px;
    --radius: 10px;
    --radius-sm: 6px;
    --radius-xs: 4px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
    --shadow-lg: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05);

    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    font-size: 13px;
    line-height: 1.5;
    display: flex;
    overflow: hidden;
    height: 100vh;
    width: 100%;
    -webkit-font-smoothing: antialiased;
  }

  .dashboard-root *, .dashboard-root *::before, .dashboard-root *::after {
    margin: 0; padding: 0; box-sizing: border-box;
  }

  /* ── SIDEBAR ── */
  .dashboard-root .sidebar {
    width: var(--sidebar-w);
    flex-shrink: 0;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: sticky;
    top: 0;
  }
  .dashboard-root .sidebar-chrome {
    padding: 16px 16px 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .dashboard-root .traffic-lights {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .dashboard-root .tl { width: 12px; height: 12px; border-radius: 50%; }
  .dashboard-root .tl-red    { background: #FF5F57; box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.12); }
  .dashboard-root .tl-yellow { background: #FFBD2E; box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.12); }
  .dashboard-root .tl-green  { background: #28C840; box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.12); }
  .dashboard-root .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 9px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .dashboard-root .logo-mark {
    width: 28px; height: 28px;
    background: var(--accent);
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }
  .dashboard-root .logo-mark span { font-size: 13px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
  .dashboard-root .logo-text { font-size: 14px; font-weight: 600; color: var(--text); letter-spacing: -0.3px; }
  .dashboard-root .logo-text em { color: var(--text-ter); font-style: normal; font-weight: 400; }
  .dashboard-root .sidebar-nav { flex: 1; overflow-y: auto; padding: 8px 0; }
  .dashboard-root .sidebar-nav::-webkit-scrollbar { display: none; }
  .dashboard-root .nav-section { margin-bottom: 4px; }
  .dashboard-root .nav-section-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-quat);
    letter-spacing: 0.02em;
    padding: 10px 16px 4px;
    text-transform: uppercase;
  }
  .dashboard-root .nav-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 12px;
    margin: 1px 8px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 400;
    color: var(--text-sec);
    cursor: pointer;
    text-decoration: none;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .dashboard-root .nav-item:hover { background: var(--surface2); color: var(--text); }
  .dashboard-root .nav-item.active {
    background: var(--bg);
    color: var(--text);
    font-weight: 500;
  }
  .dashboard-root .nav-icon {
    width: 16px; height: 16px;
    flex-shrink: 0;
    color: var(--text-ter);
    transition: color 0.12s;
  }
  .dashboard-root .nav-item.active .nav-icon { color: var(--text); }
  .dashboard-root .nav-badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 500;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    background: var(--red);
    color: #fff;
  }
  .dashboard-root .nav-badge.ok { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
  .dashboard-root .nav-badge.info { background: var(--blue-bg); color: var(--blue); border: 1px solid var(--blue-border); }
  .dashboard-root .sidebar-footer {
    padding: 12px 12px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .dashboard-root .avatar {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    flex-shrink: 0;
  }
  .dashboard-root .sidebar-user { flex: 1; min-width: 0; }
  .dashboard-root .sidebar-user-name { font-size: 13px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dashboard-root .sidebar-user-role { font-size: 11px; color: var(--text-ter); margin-top: 1px; }
  .dashboard-root .sidebar-settings {
    width: 28px; height: 28px;
    border-radius: var(--radius-xs);
    display: flex; align-items: center; justify-content: center;
    color: var(--text-ter);
    cursor: pointer;
    transition: background 0.12s;
  }
  .dashboard-root .sidebar-settings:hover { background: var(--bg); color: var(--text); }

  /* ── MAIN ── */
  .dashboard-root .main {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--bg);
  }
  .dashboard-root .main::-webkit-scrollbar { width: 6px; }
  .dashboard-root .main::-webkit-scrollbar-track { background: transparent; }
  .dashboard-root .main::-webkit-scrollbar-thumb { background: var(--border-mid); border-radius: 3px; }

  /* TOPBAR */
  .dashboard-root .topbar {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(242,242,247,0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 52px;
    flex-shrink: 0;
    gap: 16px;
  }
  .dashboard-root .tab-bar {
    display: flex;
    align-items: stretch;
    height: 100%;
    gap: 0;
    flex: 1;
    min-width: 0;
  }
  .dashboard-root .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 400;
    color: var(--text-ter);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.12s, border-color 0.12s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .dashboard-root .tab:hover { color: var(--text-sec); }
  .dashboard-root .tab.active { color: var(--text); border-bottom-color: var(--accent); font-weight: 500; }
  .dashboard-root .tab-count {
    font-size: 11px;
    font-weight: 500;
    padding: 1px 6px;
    border-radius: 10px;
    background: var(--border);
    color: var(--text-ter);
  }
  .dashboard-root .tab.active .tab-count { background: var(--accent); color: #fff; }
  .dashboard-root .topbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .dashboard-root .btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font);
    font-size: 13px;
    font-weight: 500;
    padding: 7px 14px;
    border-radius: 20px;
    border: none;
    cursor: pointer;
    transition: all 0.12s;
    white-space: nowrap;
    letter-spacing: -0.1px;
  }
  .dashboard-root .btn-primary { background: var(--accent); color: #fff; }
  .dashboard-root .btn-primary:hover { background: #3a3a3c; }
  .dashboard-root .btn-ghost {
    background: var(--surface);
    color: var(--text-sec);
    border: 1px solid var(--border-mid);
  }
  .dashboard-root .btn-ghost:hover { background: var(--surface2); color: var(--text); border-color: var(--border-mid); }

  /* CONTENT */
  .dashboard-root .content { padding: 24px; flex: 1; }

  /* PAGE HEADER */
  .dashboard-root .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .dashboard-root .page-eyebrow {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-ter);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 3px;
  }
  .dashboard-root .page-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.5px;
    line-height: 1.2;
  }
  .dashboard-root .page-sub {
    font-size: 13px;
    color: var(--text-ter);
    margin-top: 3px;
  }
  .dashboard-root .live-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--green);
    background: var(--green-bg);
    border: 1px solid var(--green-border);
    padding: 5px 11px;
    border-radius: 20px;
  }
  .dashboard-root .live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); animation: pulse-g 2s infinite; }
  @keyframes pulse-g { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }

  /* STAT CARDS */
  .dashboard-root .stat-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  .dashboard-root .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 18px 14px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.15s, transform 0.15s;
    cursor: default;
  }
  .dashboard-root .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
  .dashboard-root .stat-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .dashboard-root .stat-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-ter);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dashboard-root .stat-icon { width: 14px; height: 14px; }
  .dashboard-root .stat-chip {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: 10px;
  }
  .dashboard-root .chip-blue   { background: var(--blue-bg);  color: var(--blue);  border: 1px solid var(--blue-border); }
  .dashboard-root .chip-green  { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
  .dashboard-root .chip-amber  { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); }
  .dashboard-root .chip-red    { background: var(--red-bg);   color: var(--red);   border: 1px solid var(--red-border); }
  .dashboard-root .chip-neutral{ background: var(--bg);       color: var(--text-ter); border: 1px solid var(--border); }
  .dashboard-root .stat-num {
    font-size: 32px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -1px;
    line-height: 1;
    margin-bottom: 4px;
  }
  .dashboard-root .stat-num sup { font-size: 14px; font-weight: 500; color: var(--text-ter); vertical-align: super; letter-spacing: 0; }
  .dashboard-root .stat-meta { font-size: 11px; color: var(--text-ter); }
  .dashboard-root .stat-bar {
    margin-top: 12px;
    height: 3px;
    background: var(--bg);
    border-radius: 2px;
    overflow: hidden;
  }
  .dashboard-root .stat-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 1.2s cubic-bezier(0.19,1,0.22,1);
  }
  .dashboard-root .stat-trend {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 500;
    margin-top: 8px;
  }
  .dashboard-root .trend-up   { color: var(--green); }
  .dashboard-root .trend-down { color: var(--red); }
  .dashboard-root .trend-neu  { color: var(--text-ter); }

  /* PANELS */
  .dashboard-root .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .dashboard-root .panel-header {
    padding: 14px 18px 13px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface);
  }
  .dashboard-root .panel-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 7px;
    letter-spacing: -0.2px;
  }
  .dashboard-root .panel-title-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dashboard-root .panel-sub { font-size: 11px; color: var(--text-ter); margin-top: 2px; }
  .dashboard-root .panel-action {
    font-size: 12px;
    font-weight: 500;
    color: var(--blue);
    cursor: pointer;
    background: none;
    border: none;
    font-family: var(--font);
    padding: 4px 0;
    transition: opacity 0.12s;
  }
  .dashboard-root .panel-action:hover { opacity: 0.7; }
  .dashboard-root .panel-body { padding: 16px 18px; }

  /* MAIN GRID */
  .dashboard-root .main-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 16px;
    margin-bottom: 16px;
  }

  /* CHART */
  .dashboard-root .chart-sparkline { width: 100%; height: 150px; }
  .dashboard-root .chart-wrap { position: relative; }
  .dashboard-root .chart-axis-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    padding: 0 2px;
  }
  .dashboard-root .chart-axis-labels span { font-size: 10px; color: var(--text-ter); }
  .dashboard-root .chart-legend {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    align-items: center;
  }
  .dashboard-root .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-ter);
  }
  .dashboard-root .legend-line { width: 16px; height: 2px; border-radius: 1px; }
  .dashboard-root .legend-dash { width: 16px; height: 0; border-top: 1.5px dashed var(--red); }

  /* MCP panel */
  .dashboard-root .mcp-block { padding: 14px 18px; border-bottom: 1px solid var(--border); }
  .dashboard-root .mcp-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 9px;
    border-radius: 12px;
    background: var(--green-bg);
    color: var(--green);
    border: 1px solid var(--green-border);
  }
  .dashboard-root .mcp-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse-g 2s infinite; }
  .dashboard-root .mcp-desc { font-size: 12px; color: var(--text-ter); line-height: 1.6; }
  .dashboard-root .mcp-tools { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
  .dashboard-root .mcp-tool-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 11px;
    border-radius: var(--radius-sm);
    background: var(--surface2);
    border: 1px solid var(--border);
    font-size: 12px;
  }
  .dashboard-root .mcp-tool-name { font-weight: 500; color: var(--text); font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }
  .dashboard-root .mcp-tool-type { font-size: 10px; color: var(--text-ter); font-weight: 400; }

  /* Repos */
  .dashboard-root .repo-block { padding: 14px 18px; }
  .dashboard-root .repo-block-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-ter);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 10px;
  }
  .dashboard-root .repo-list { display: flex; flex-direction: column; gap: 7px; margin-bottom: 12px; }
  .dashboard-root .repo-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 11px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    transition: border-color 0.12s, background 0.12s;
    cursor: default;
  }
  .dashboard-root .repo-item:hover { border-color: var(--border-mid); background: var(--surface2); }
  .dashboard-root .repo-item-left { display: flex; align-items: center; gap: 9px; }
  .dashboard-root .repo-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); flex-shrink: 0; }
  .dashboard-root .repo-name { font-size: 12px; font-weight: 500; color: var(--text); }
  .dashboard-root .repo-meta { font-size: 11px; color: var(--text-ter); margin-top: 1px; }
  .dashboard-root .repo-badge {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 10px;
  }
  .dashboard-root .connect-btn {
    width: 100%;
    font-family: var(--font);
    font-size: 13px;
    font-weight: 500;
    padding: 9px;
    border-radius: 20px;
    background: var(--accent);
    color: #fff;
    border: none;
    cursor: pointer;
    transition: background 0.12s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    letter-spacing: -0.1px;
  }
  .dashboard-root .connect-btn:hover { background: #3a3a3c; }

  /* ALERTS TABLE */
  .dashboard-root .table-wrap { overflow-x: auto; }
  .dashboard-root .alert-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 700px;
  }
  .dashboard-root .alert-table th {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-ter);
    padding: 9px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border);
    background: var(--surface2);
    white-space: nowrap;
    letter-spacing: 0.01em;
  }
  .dashboard-root .alert-table td {
    padding: 12px 16px;
    font-size: 12px;
    border-bottom: 1px solid var(--border);
    color: var(--text-sec);
    vertical-align: middle;
  }
  .dashboard-root .alert-table tr:last-child td { border-bottom: none; }
  .dashboard-root .alert-table tbody tr { transition: background 0.1s; }
  .dashboard-root .alert-table tbody tr:hover td { background: var(--surface2); }
  .dashboard-root .pr-name { font-size: 13px; font-weight: 500; color: var(--text); }
  .dashboard-root .pr-repo { font-size: 11px; color: var(--text-ter); margin-top: 2px; }
  .dashboard-root .risk-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    white-space: nowrap;
  }
  .dashboard-root .risk-high  { background: var(--red-bg);   color: var(--red);   border: 1px solid var(--red-border); }
  .dashboard-root .risk-med   { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); }
  .dashboard-root .risk-low   { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
  .dashboard-root .owner-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 400;
    padding: 3px 8px;
    border-radius: var(--radius-xs);
    background: var(--blue-bg);
    color: var(--blue);
    border: 1px solid var(--blue-border);
    font-family: 'SF Mono', monospace;
  }
  .dashboard-root .owner-tag::before { content: '@'; opacity: 0.6; }
  .dashboard-root .alert-status {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 9px;
    border-radius: 20px;
  }
  .dashboard-root .status-blocked { background: var(--red-bg);   color: var(--red);   border: 1px solid var(--red-border); }
  .dashboard-root .status-review  { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); }
  .dashboard-root .status-merged  { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }

  /* BOTTOM ROW */
  .dashboard-root .bottom-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  /* CONSTRAINTS */
  .dashboard-root .constraint-list { display: flex; flex-direction: column; gap: 7px; }
  .dashboard-root .constraint-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    transition: border-color 0.12s;
    cursor: default;
  }
  .dashboard-root .constraint-row:hover { border-color: var(--border-mid); }
  .dashboard-root .constraint-name { font-size: 13px; font-weight: 500; color: var(--text); }
  .dashboard-root .constraint-scope { font-size: 11px; color: var(--text-ter); margin-top: 2px; }
  .dashboard-root .constraint-badge {
    font-size: 10px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 10px;
    white-space: nowrap;
  }
  .dashboard-root .cb-active  { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
  .dashboard-root .cb-warn    { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); }
  .dashboard-root .cb-off     { background: var(--bg);       color: var(--text-ter); border: 1px solid var(--border); }

  /* OWNERSHIP */
  .dashboard-root .ownership-bar-list { display: flex; flex-direction: column; gap: 12px; }
  .dashboard-root .ob-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
  .dashboard-root .ob-name { font-size: 12px; font-weight: 500; color: var(--text-sec); }
  .dashboard-root .ob-pct  { font-size: 12px; font-weight: 600; color: var(--text); }
  .dashboard-root .ob-bar  { height: 5px; background: var(--bg); border-radius: 3px; overflow: hidden; }
  .dashboard-root .ob-fill { height: 100%; border-radius: 3px; transition: width 1.2s cubic-bezier(0.19,1,0.22,1); }
  .dashboard-root .ob-note {
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    background: var(--amber-bg);
    border: 1px solid var(--amber-border);
    font-size: 11px;
    color: var(--text-sec);
    line-height: 1.6;
  }
  .dashboard-root .ob-note strong { color: var(--amber); }

  /* INCIDENTS */
  .dashboard-root .incident-list { display: flex; flex-direction: column; gap: 8px; }
  .dashboard-root .incident-card {
    padding: 11px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    transition: border-color 0.12s;
    cursor: default;
    position: relative;
    padding-left: 16px;
  }
  .dashboard-root .incident-card:hover { border-color: var(--border-mid); }
  .dashboard-root .incident-card::before {
    content: '';
    position: absolute;
    left: 0; top: 6px; bottom: 6px;
    width: 3px;
    border-radius: 0 2px 2px 0;
  }
  .dashboard-root .incident-card.sev-high::before { background: var(--red); }
  .dashboard-root .incident-card.sev-med::before  { background: var(--amber); }
  .dashboard-root .incident-title { font-size: 12px; font-weight: 500; color: var(--text); margin-bottom: 3px; }
  .dashboard-root .incident-meta  { font-size: 11px; color: var(--text-ter); display: flex; gap: 10px; }
  .dashboard-root .incident-desc  { font-size: 11px; color: var(--text-ter); margin-top: 5px; line-height: 1.5; }
  .dashboard-root .incident-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
    margin-left: 6px;
  }
  .dashboard-root .ib-p1 { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-border); }
  .dashboard-root .ib-p2 { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); }
  .dashboard-root .add-btn {
    width: 100%;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 500;
    padding: 8px;
    border-radius: var(--radius-sm);
    border: 1.5px dashed var(--border-mid);
    background: transparent;
    color: var(--text-ter);
    cursor: pointer;
    transition: all 0.12s;
    margin-top: 4px;
    display: flex; align-items: center; justify-content: center; gap: 5px;
  }
  .dashboard-root .add-btn:hover { border-color: var(--blue); color: var(--blue); background: var(--blue-bg); }

  /* STATUS BAR */
  .dashboard-root .statusbar {
    padding: 0 24px;
    height: 32px;
    border-top: 1px solid var(--border);
    background: rgba(242,242,247,0.85);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    gap: 20px;
    flex-shrink: 0;
  }
  .dashboard-root .statusbar-item {
    font-size: 11px;
    color: var(--text-ter);
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .dashboard-root .statusbar-dot { width: 6px; height: 6px; border-radius: 50%; }
  .dashboard-root .sd-green { background: var(--green); }
  .dashboard-root .sd-amber { background: var(--amber); }
  .dashboard-root .sd-dim   { background: var(--border-mid); }
`;

export default function HomeClient({ userId }: HomeClientProps) {
  useEffect(() => {
    // Animate stat bars and ownership bars
    const timer = setTimeout(() => {
      document.querySelectorAll<HTMLElement>(".stat-bar-fill").forEach((el) => {
        el.style.width = (el.dataset.to || "0") + "%";
      });
      document.querySelectorAll<HTMLElement>(".ob-fill").forEach((el) => {
        el.style.width = (el.dataset.to || "0") + "%";
      });
    }, 250);

    // Tab switching
    const tabs = document.querySelectorAll<HTMLElement>(".dashboard-root .tab");
    const tabHandlers: Array<() => void> = [];
    tabs.forEach((tab) => {
      const handler = () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
      };
      tab.addEventListener("click", handler);
      tabHandlers.push(handler);
    });

    // Nav item switching
    const navItems = document.querySelectorAll<HTMLElement>(".dashboard-root .nav-item");
    const navHandlers: Array<(e: Event) => void> = [];
    navItems.forEach((item) => {
      const handler = (e: Event) => {
        e.preventDefault();
        navItems.forEach((n) => n.classList.remove("active"));
        item.classList.add("active");
      };
      item.addEventListener("click", handler);
      navHandlers.push(handler);
    });

    return () => {
      clearTimeout(timer);
      tabs.forEach((tab, i) => tab.removeEventListener("click", tabHandlers[i]));
      navItems.forEach((item, i) => item.removeEventListener("click", navHandlers[i]));
    };
  }, []);

  return (
    <div className="dashboard-root">
      <style dangerouslySetInnerHTML={{ __html: dashboardCSS }} />

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-chrome">
          <div className="traffic-lights">
            <div className="tl tl-red"></div>
            <div className="tl tl-yellow"></div>
            <div className="tl tl-green"></div>
          </div>
          <div className="sidebar-logo">
            <div className="logo-mark"><span>C</span></div>
            <div className="logo-text">ContextHub <em>AI</em></div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Monitor</div>
            <a href="#" className="nav-item active">
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="1.5" y="1.5" width="5" height="5" rx="1.5"/><rect x="9.5" y="1.5" width="5" height="5" rx="1.5"/>
                <rect x="1.5" y="9.5" width="5" height="5" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.5"/>
              </svg>
              Overview
            </a>
            <a href="#" className="nav-item">
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="5" cy="3" r="1.5"/><circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
                <path d="M6.5 3h5a1 1 0 011 1v2M6.5 13h5a1 1 0 001-1V9M5 4.5v7"/>
              </svg>
              Pull Requests
              <span className="nav-badge">3</span>
            </a>
            <a href="#" className="nav-item">
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 1l7 14H1z"/><path d="M8 6v4"/><circle cx="8" cy="12" r="0.5" fill="currentColor"/>
              </svg>
              Incidents
              <span className="nav-badge">2</span>
            </a>
            <a href="#" className="nav-item">
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <polyline points="1,11 5,7 8,9 12,4 15,6"/><polyline points="12,4 15,4 15,7"/>
              </svg>
              Risk Trends
            </a>
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Configure</div>
            <a href="#" className="nav-item">
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 4h12M5 8h6M4 12h8"/>
                <circle cx="2" cy="4" r="1" fill="currentColor" stroke="none"/>
                <circle cx="2" cy="8" r="1" fill="currentColor" stroke="none"/>
                <circle cx="2" cy="12" r="1" fill="currentColor" stroke="none"/>
              </svg>
              Repositories
              <span className="nav-badge ok">3</span>
            </a>
            <a href="#" className="nav-item">
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 1l2.5 5h5l-4 3 1.5 5L8 11.5 3 14l1.5-5-4-3h5z"/>
              </svg>
              Constraints
            </a>
            <a href="#" className="nav-item">
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="5.5" r="2.5"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
              </svg>
              Ownership
            </a>
            <a href="#" className="nav-item">
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 7.5h6M5 10h3"/>
              </svg>
              MCP API
            </a>
            <a href="#" className="nav-item">
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.5l2.5 1.5"/>
              </svg>
              Audit Log
            </a>
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Workspace</div>
            <a href="#" className="nav-item">
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M11.54 4.46l-1.41 1.41M4.95 11.54l-1.41 1.41"/>
              </svg>
              Settings
            </a>
            <a href="#" className="nav-item">
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="8" r="6.5"/><path d="M8 7v5"/><circle cx="8" cy="4.5" r="0.5" fill="currentColor" stroke="none"/>
              </svg>
              Docs
            </a>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">A</div>
          <div className="sidebar-user">
            <div className="sidebar-user-name">admin@acme.io</div>
            <div className="sidebar-user-role">Platform Engineering</div>
          </div>
          <div className="sidebar-settings">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M11.54 4.46l-1.41 1.41M4.95 11.54l-1.41 1.41"/>
            </svg>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main">

        {/* TOPBAR + TABS */}
        <div className="topbar">
          <div className="tab-bar">
            <div className="tab active">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/>
                <rect x="1.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/>
              </svg>
              Overview
            </div>
            <div className="tab">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="5" cy="3" r="1.5"/><circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
                <path d="M6.5 3h4a1 1 0 011 1v2M6.5 13h4a1 1 0 001-1V9M5 4.5v7"/>
              </svg>
              Pull Requests
              <span className="tab-count">3</span>
            </div>
            <div className="tab">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 4h12M5 8h6M4 12h8"/>
              </svg>
              Repositories
              <span className="tab-count">3</span>
            </div>
            <div className="tab">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 1l2.5 5h5l-4 3 1.5 5L8 11.5 3 14l1.5-5-4-3h5z"/>
              </svg>
              Constraints
            </div>
            <div className="tab">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 1l7 14H1z"/><path d="M8 6v4"/>
              </svg>
              Incidents
            </div>
          </div>
          <div className="topbar-right">
            <button className="btn btn-ghost">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 8A6 6 0 112 8"/><path d="M14 8l-2-2M14 8l2-2"/>
              </svg>
              Scan Now
            </button>
            {userId ? (
              <Link href="/dashboard" className="btn btn-primary" style={{ textDecoration: "none" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M8 2v12M2 8h12"/>
                </svg>
                Dashboard
              </Link>
            ) : (
              <Link href="/sign-up" className="btn btn-primary" style={{ textDecoration: "none" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M8 2v12M2 8h12"/>
                </svg>
                Connect Repo
              </Link>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">

          {/* PAGE HEADER */}
          <div className="page-header">
            <div>
              <div className="page-eyebrow">Dashboard</div>
              <h1 className="page-title">Risk Overview</h1>
              <div className="page-sub">Monitoring 3 repositories · Last scored 4 minutes ago</div>
            </div>
            <div className="live-pill"><div className="live-dot"></div> Live · Webhooks Active</div>
          </div>

          {/* STAT CARDS */}
          <div className="stat-row">
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-label">
                  <svg className="stat-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 4h12M5 8h6M4 12h8"/>
                  </svg>
                  Connected Repos
                </div>
                <span className="stat-chip chip-blue">Stable</span>
              </div>
              <div className="stat-num">3</div>
              <div className="stat-meta">acme-api, acme-web, payments-svc</div>
              <div className="stat-bar"><div className="stat-bar-fill" style={{ width: "0%", background: "var(--blue)" }} data-to="60"></div></div>
              <div className="stat-trend trend-neu">→ No change</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-label">
                  <svg className="stat-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="5" cy="3" r="1.5"/><circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
                    <path d="M6.5 3h4a1 1 0 011 1v2M6.5 13h4a1 1 0 001-1V9M5 4.5v7"/>
                  </svg>
                  Scored PRs · 7d
                </div>
                <span className="stat-chip chip-green">↑ Active</span>
              </div>
              <div className="stat-num">24</div>
              <div className="stat-meta">18 agent-authored · 6 human</div>
              <div className="stat-bar"><div className="stat-bar-fill" style={{ width: "0%", background: "var(--green)" }} data-to="75"></div></div>
              <div className="stat-trend trend-up">↑ +8 vs last week</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-label">
                  <svg className="stat-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <polyline points="1,11 5,7 8,9 12,4 15,6"/>
                  </svg>
                  Avg Risk Score
                </div>
                <span className="stat-chip chip-green">Improving</span>
              </div>
              <div className="stat-num">4<sup>/10</sup></div>
              <div className="stat-meta">Across 24 scored PRs</div>
              <div className="stat-bar"><div className="stat-bar-fill" style={{ width: "0%", background: "var(--amber)" }} data-to="40"></div></div>
              <div className="stat-trend trend-down">↓ −0.8 vs last week</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-label">
                  <svg className="stat-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 1l7 14H1z"/><path d="M8 6v4"/>
                  </svg>
                  High-Risk Alerts
                </div>
                <span className="stat-chip chip-red">Score ≥ 7</span>
              </div>
              <div className="stat-num">3</div>
              <div className="stat-meta">2 blocked · 1 in review</div>
              <div className="stat-bar"><div className="stat-bar-fill" style={{ width: "0%", background: "var(--red)" }} data-to="30"></div></div>
              <div className="stat-trend trend-down">↓ −1 vs last week</div>
            </div>
          </div>

          {/* MAIN GRID: Chart + Right panel */}
          <div className="main-grid">

            {/* TREND CHART */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">
                    <div className="panel-title-dot" style={{ background: "var(--blue)" }}></div>
                    Risk Score Trends
                  </div>
                  <div className="panel-sub">Chronological progression of PR risk evaluations · Last 14 days</div>
                </div>
                <button className="panel-action">Full History ↗</button>
              </div>
              <div className="panel-body">
                <div className="chart-wrap">
                  <svg className="chart-sparkline" viewBox="0 0 600 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#007AFF" stopOpacity="0.12"/>
                        <stop offset="100%" stopColor="#007AFF" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="30"  x2="600" y2="30"  stroke="#E5E5EA" strokeWidth="1"/>
                    <line x1="0" y1="60"  x2="600" y2="60"  stroke="#E5E5EA" strokeWidth="1"/>
                    <line x1="0" y1="90"  x2="600" y2="90"  stroke="#E5E5EA" strokeWidth="1"/>
                    <line x1="0" y1="120" x2="600" y2="120" stroke="#E5E5EA" strokeWidth="1"/>
                    <text x="4" y="28"  fill="#AEAEB2" fontSize="9" fontFamily="Inter">10</text>
                    <text x="4" y="58"  fill="#AEAEB2" fontSize="9" fontFamily="Inter">7</text>
                    <text x="4" y="88"  fill="#AEAEB2" fontSize="9" fontFamily="Inter">5</text>
                    <text x="4" y="118" fill="#AEAEB2" fontSize="9" fontFamily="Inter">2</text>
                    <line x1="0" y1="60" x2="600" y2="60" stroke="#FF3B30" strokeWidth="1" strokeDasharray="5 4" opacity="0.5"/>
                    <path d="M20,120 L80,105 L140,90 L200,72 L260,45 L320,72 L380,90 L440,60 L500,75 L560,45 L600,15 L600,150 L20,150 Z" fill="url(#aG)"/>
                    <path d="M20,120 L80,105 L140,90 L200,72 L260,45 L320,72 L380,90 L440,60 L500,75 L560,45 L600,15" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="260" cy="45" r="3.5" fill="#007AFF" stroke="white" strokeWidth="1.5"/>
                    <circle cx="600" cy="15" r="3.5" fill="#FF3B30" stroke="white" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div className="chart-axis-labels">
                  <span>Jun 1</span><span>Jun 5</span><span>Jun 10</span><span>Jun 14</span>
                </div>
                <div className="chart-legend">
                  <div className="legend-item"><div className="legend-line" style={{ background: "var(--blue)" }}></div> Agent PRs</div>
                  <div className="legend-item"><div className="legend-dash"></div> Risk threshold (7)</div>
                  <div style={{ marginLeft: "auto", fontSize: "11px", color: "var(--text-ter)" }}>Peak: <span style={{ color: "var(--red)", fontWeight: 600 }}>8/10</span> on Jun 14</div>
                </div>
              </div>
            </div>

            {/* RIGHT: MCP + Repos */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">
                      <div className="panel-title-dot" style={{ background: "var(--green)" }}></div>
                      MCP Agent Core
                    </div>
                    <div className="panel-sub">Agents query context before writing</div>
                  </div>
                  <div className="mcp-pill"><div className="mcp-pill-dot"></div> Connected</div>
                </div>
                <div className="mcp-block">
                  <div className="mcp-desc">AI agents call context tools before proposing changes. Zero workflow change for engineers.</div>
                  <div className="mcp-tools">
                    <div className="mcp-tool-row">
                      <span className="mcp-tool-name">score_change</span>
                      <span className="mcp-tool-type">tool · active</span>
                    </div>
                    <div className="mcp-tool-row">
                      <span className="mcp-tool-name">get_ownership</span>
                      <span className="mcp-tool-type">tool · active</span>
                    </div>
                    <div className="mcp-tool-row">
                      <span className="mcp-tool-name">get_constraints</span>
                      <span className="mcp-tool-type">tool · active</span>
                    </div>
                  </div>
                </div>
                <div className="repo-block">
                  <div className="repo-block-label">Connected Repositories</div>
                  <div className="repo-list">
                    <div className="repo-item">
                      <div className="repo-item-left">
                        <div className="repo-dot"></div>
                        <div>
                          <div className="repo-name">acme-api</div>
                          <div className="repo-meta">14 PRs scored</div>
                        </div>
                      </div>
                      <span className="repo-badge chip-green">Live</span>
                    </div>
                    <div className="repo-item">
                      <div className="repo-item-left">
                        <div className="repo-dot"></div>
                        <div>
                          <div className="repo-name">acme-web</div>
                          <div className="repo-meta">7 PRs scored</div>
                        </div>
                      </div>
                      <span className="repo-badge chip-green">Live</span>
                    </div>
                    <div className="repo-item">
                      <div className="repo-item-left">
                        <div className="repo-dot" style={{ background: "var(--amber)" }}></div>
                        <div>
                          <div className="repo-name">payments-svc</div>
                          <div className="repo-meta">3 PRs scored</div>
                        </div>
                      </div>
                      <span className="repo-badge chip-amber">PCI Lock</span>
                    </div>
                  </div>
                  <button className="connect-btn">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M8 2v12M2 8h12"/>
                    </svg>
                    Connect Repository
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ALERTS TABLE */}
          <div className="panel" style={{ marginBottom: "16px" }}>
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  <div className="panel-title-dot" style={{ background: "var(--red)" }}></div>
                  Recent Alerts &amp; High-Risk PRs
                </div>
                <div className="panel-sub">PRs scoring ≥ 7 in the last 30 days</div>
              </div>
              <button className="panel-action">View all →</button>
            </div>
            <div className="table-wrap">
              <table className="alert-table">
                <thead>
                  <tr>
                    <th>Pull Request</th>
                    <th>Risk Score</th>
                    <th>Owner Violation</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="pr-name">#2847 — refactor payment gateway</div>
                      <div className="pr-repo">payments-svc · agent:cursor-prod</div>
                    </td>
                    <td><span className="risk-pill risk-high">8 / 10</span></td>
                    <td><span className="owner-tag">payments-team</span></td>
                    <td style={{ color: "var(--text-ter)", fontSize: "11px", maxWidth: "240px" }}>PCI module + deploy freeze active + auth_middleware touched</td>
                    <td><span className="alert-status status-blocked">Blocked</span></td>
                    <td style={{ color: "var(--text-ter)", fontSize: "11px", whiteSpace: "nowrap" }}>2h ago</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="pr-name">#2831 — update auth middleware</div>
                      <div className="pr-repo">acme-api · agent:cursor-prod</div>
                    </td>
                    <td><span className="risk-pill risk-high">7 / 10</span></td>
                    <td><span className="owner-tag">auth-team</span></td>
                    <td style={{ color: "var(--text-ter)", fontSize: "11px", maxWidth: "240px" }}>auth_middleware has 2 incidents in 90d · not owner</td>
                    <td><span className="alert-status status-review">In Review</span></td>
                    <td style={{ color: "var(--text-ter)", fontSize: "11px", whiteSpace: "nowrap" }}>18h ago</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="pr-name">#2819 — logging refactor PII paths</div>
                      <div className="pr-repo">acme-api · agent:devin-staging</div>
                    </td>
                    <td><span className="risk-pill risk-med">6 / 10</span></td>
                    <td><span className="owner-tag">data-team</span></td>
                    <td style={{ color: "var(--text-ter)", fontSize: "11px", maxWidth: "240px" }}>PII pattern matches in 3 log fields · GDPR scope</td>
                    <td><span className="alert-status status-review">In Review</span></td>
                    <td style={{ color: "var(--text-ter)", fontSize: "11px", whiteSpace: "nowrap" }}>2d ago</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="pr-name">#2804 — add Redis to user-svc</div>
                      <div className="pr-repo">acme-web · agent:cursor-prod</div>
                    </td>
                    <td><span className="risk-pill risk-high">7 / 10</span></td>
                    <td><span className="owner-tag">platform-team</span></td>
                    <td style={{ color: "var(--text-ter)", fontSize: "11px", maxWidth: "240px" }}>ADR-014 forbids stateful deps in user-svc · architectural drift</td>
                    <td><span className="alert-status status-merged">Merged ⚠</span></td>
                    <td style={{ color: "var(--text-ter)", fontSize: "11px", whiteSpace: "nowrap" }}>5d ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="bottom-row">

            {/* CONSTRAINTS */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">
                    <div className="panel-title-dot" style={{ background: "var(--purple)" }}></div>
                    Active Constraints
                  </div>
                  <div className="panel-sub">Rules applied at score time</div>
                </div>
                <button className="panel-action">Edit →</button>
              </div>
              <div className="panel-body">
                <div className="constraint-list">
                  <div className="constraint-row">
                    <div>
                      <div className="constraint-name">Deploy Freeze</div>
                      <div className="constraint-scope">payments-svc · Fri 18:00 → Mon 08:00</div>
                    </div>
                    <span className="constraint-badge cb-active">Active</span>
                  </div>
                  <div className="constraint-row">
                    <div>
                      <div className="constraint-name">PCI Lockdown</div>
                      <div className="constraint-scope">src/payments/** · Payments team only</div>
                    </div>
                    <span className="constraint-badge cb-active">Active</span>
                  </div>
                  <div className="constraint-row">
                    <div>
                      <div className="constraint-name">GDPR PII Scan</div>
                      <div className="constraint-scope">All repos · keyword matching</div>
                    </div>
                    <span className="constraint-badge cb-warn">Warn</span>
                  </div>
                  <div className="constraint-row">
                    <div>
                      <div className="constraint-name">ADR Enforcement</div>
                      <div className="constraint-scope">user-svc · stateless rule</div>
                    </div>
                    <span className="constraint-badge cb-off">Draft</span>
                  </div>
                </div>
              </div>
            </div>

            {/* OWNERSHIP */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">
                    <div className="panel-title-dot" style={{ background: "var(--blue)" }}></div>
                    Ownership Coverage
                  </div>
                  <div className="panel-sub">CODEOWNERS coverage across repos</div>
                </div>
              </div>
              <div className="panel-body">
                <div className="ownership-bar-list">
                  <div>
                    <div className="ob-header"><span className="ob-name">acme-api</span><span className="ob-pct" style={{ color: "var(--green)" }}>87%</span></div>
                    <div className="ob-bar"><div className="ob-fill" style={{ width: "0%", background: "var(--green)" }} data-to="87"></div></div>
                  </div>
                  <div>
                    <div className="ob-header"><span className="ob-name">acme-web</span><span className="ob-pct" style={{ color: "var(--amber)" }}>62%</span></div>
                    <div className="ob-bar"><div className="ob-fill" style={{ width: "0%", background: "var(--amber)" }} data-to="62"></div></div>
                  </div>
                  <div>
                    <div className="ob-header"><span className="ob-name">payments-svc</span><span className="ob-pct" style={{ color: "var(--green)" }}>96%</span></div>
                    <div className="ob-bar"><div className="ob-fill" style={{ width: "0%", background: "var(--green)" }} data-to="96"></div></div>
                  </div>
                </div>
                <div className="ob-note">
                  <strong>38 files</strong> in acme-web have no CODEOWNERS entry. Agent-authored changes to these files score +2 risk automatically.
                </div>
              </div>
            </div>

            {/* INCIDENTS */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">
                    <div className="panel-title-dot" style={{ background: "var(--red)" }}></div>
                    Incident Correlation
                  </div>
                  <div className="panel-sub">Used to weight risk scores</div>
                </div>
                <button className="panel-action">Add →</button>
              </div>
              <div className="panel-body">
                <div className="incident-list">
                  <div className="incident-card sev-high">
                    <div className="incident-title">
                      auth_middleware outage
                      <span className="incident-badge ib-p1">P1</span>
                    </div>
                    <div className="incident-meta">
                      <span>acme-api</span>
                      <span>2025-04-18</span>
                    </div>
                    <div className="incident-desc">Token validation race condition. File now scores +3 risk.</div>
                  </div>
                  <div className="incident-card sev-med">
                    <div className="incident-title">
                      payments silent failure
                      <span className="incident-badge ib-p2">P2</span>
                    </div>
                    <div className="incident-meta">
                      <span>payments-svc</span>
                      <span>2025-03-02</span>
                    </div>
                    <div className="incident-desc">Stripe webhook handler timing. Module scores +2 risk.</div>
                  </div>
                  <button className="add-btn">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M8 2v12M2 8h12"/>
                    </svg>
                    Add incident manually
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* STATUS BAR */}
        <div className="statusbar">
          <div className="statusbar-item"><div className="statusbar-dot sd-green"></div> API Healthy</div>
          <div className="statusbar-item"><div className="statusbar-dot sd-green"></div> Webhooks Active · 3 repos</div>
          <div className="statusbar-item"><div className="statusbar-dot sd-amber"></div> MCP Server v0.4.1</div>
          <div className="statusbar-item" style={{ marginLeft: "auto" }}><div className="statusbar-dot sd-dim"></div> Last scored 4 min ago</div>
        </div>

      </div>{/* /main */}
    </div>
  );
}
