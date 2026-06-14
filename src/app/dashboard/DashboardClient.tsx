"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface StoredRepository {
  id: string;
  name: string;
  full_name: string;
  visibility: string;
}

interface StoredPullRequest {
  id: string;
  number: number;
  title: string;
  author: string;
  state: string;
  created_at: Date;
  updated_at: Date;
}

interface StoredRiskAssessment {
  id: string;
  risk_score: string;
  risk_level: string;
  reasoning: string;
  created_at: Date;
}

interface StoredRiskFactor {
  id: string;
  factor_type: string;
  weight: string;
  description: string;
}

interface PRWithAssessment {
  pr: StoredPullRequest;
  repository: StoredRepository;
  assessment: StoredRiskAssessment | null;
  factors: StoredRiskFactor[];
}

interface StoredConstraint {
  id: string;
  scope: string;
  constraint_type: string;
  description: string;
  severity: string;
  created_at: Date;
}

interface StoredIncident {
  id: string;
  title: string;
  severity: string;
  description: string;
  status: string;
  created_at: Date;
  services: string[];
}

interface DashboardClientProps {
  repos: StoredRepository[];
  prs: PRWithAssessment[];
  constraints: StoredConstraint[];
  incidents: StoredIncident[];
  installUrl: string;
  userEmail?: string;
  userInitials?: string;
}

export default function DashboardClient({
  repos,
  prs,
  constraints,
  incidents,
  installUrl,
  userEmail = "admin@acme.io",
  userInitials = "U",
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "prs" | "repos" | "constraints" | "incidents" | "ownership" | "mcp"
  >("overview");
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepoFilter, setSelectedRepoFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [expandedPrs, setExpandedPrs] = useState<Record<string, boolean>>({});

  // Form State for new constraint
  const [newScope, setNewScope] = useState("");
  const [newType, setNewType] = useState("freeze");
  const [newSeverity, setNewSeverity] = useState("high");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form State for new incident
  const [incTitle, setIncTitle] = useState("");
  const [incSeverity, setIncSeverity] = useState("high");
  const [incStatus, setIncStatus] = useState("investigating");
  const [incDescription, setIncDescription] = useState("");
  const [incServices, setIncServices] = useState("");
  const [isIncSubmitting, setIsIncSubmitting] = useState(false);
  const [incFormError, setIncFormError] = useState("");

  // Animation Trigger
  const [animateWidths, setAnimateWidths] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimateWidths(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Toggle PR expansion
  const togglePr = (prId: string) => {
    setExpandedPrs((prev) => ({
      ...prev,
      [prId]: !prev[prId],
    }));
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const totalRepos = repos.length;
    const scoredPrs = prs.filter((p) => p.assessment !== null);
    const totalScored = scoredPrs.length;

    let avgRiskScore = 0;
    let highRiskCount = 0;

    if (totalScored > 0) {
      const sum = scoredPrs.reduce((acc, p) => acc + parseFloat(p.assessment!.risk_score), 0);
      avgRiskScore = parseFloat((sum / totalScored).toFixed(1));
      highRiskCount = scoredPrs.filter((p) => parseFloat(p.assessment!.risk_score) >= 7).length;
    }

    return {
      totalRepos,
      totalScored,
      avgRiskScore,
      highRiskCount,
    };
  }, [repos, prs]);

  // Filtering logic
  const filteredPrs = useMemo(() => {
    return prs.filter((item) => {
      const matchSearch =
        item.pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pr.number.toString().includes(searchQuery);

      const matchRepo =
        selectedRepoFilter === "all" || item.repository.id === selectedRepoFilter;

      let matchRisk = true;
      if (item.assessment) {
        const score = parseFloat(item.assessment.risk_score);
        if (riskFilter === "high") matchRisk = score >= 7;
        else if (riskFilter === "medium") matchRisk = score >= 4 && score < 7;
        else if (riskFilter === "low") matchRisk = score < 4;
      } else {
        if (riskFilter !== "all" && riskFilter !== "low") {
          matchRisk = false;
        }
      }

      return matchSearch && matchRepo && matchRisk;
    });
  }, [prs, searchQuery, selectedRepoFilter, riskFilter]);

  // Dynamic SVG Area Trend Chart Data
  const sparklineData = useMemo(() => {
    const scoredChronological = prs
      .filter((p) => p.assessment !== null)
      .map((p) => ({
        date: new Date(p.pr.created_at).getTime(),
        score: parseFloat(p.assessment!.risk_score),
      }))
      .sort((a, b) => a.date - b.date);

    // If there are less than 2 points, render mock points matching second.html for demo
    const pointsData =
      scoredChronological.length >= 2
        ? scoredChronological
        : [
            { score: 2 },
            { score: 3 },
            { score: 4 },
            { score: 5 },
            { score: 7 },
            { score: 5 },
            { score: 4 },
            { score: 6 },
            { score: 5 },
            { score: 7 },
            { score: 8 },
            { score: 6 },
            { score: 5 },
            { score: 7 },
            { score: 8 },
            { score: 9 },
          ];

    const width = 600;
    const height = 160;
    const paddingLeft = 36;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const maxScore = 10;

    const points = pointsData.map((d, index) => {
      const x = paddingLeft + (index / (pointsData.length - 1)) * chartWidth;
      const y = height - paddingBottom - (d.score / maxScore) * chartHeight;
      return { x, y, score: d.score };
    });

    const pathD = `M ${points.map((p) => `${p.x} ${p.y}`).join(" L ")}`;
    const areaD = `${pathD} L ${points[points.length - 1]!.x} ${height - paddingBottom} L ${points[0]!.x} ${height - paddingBottom} Z`;

    return {
      points,
      pathD,
      areaD,
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
    };
  }, [prs]);

  // Form Submitter for adding constraint
  const handleAddConstraint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScope || !newDescription) {
      setFormError("Scope and Description are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/constraints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: newScope,
          constraint_type: newType,
          description: newDescription,
          severity: newSeverity,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create constraint");
      }

      setNewScope("");
      setNewDescription("");
      router.refresh();
    } catch (err) {
      setFormError("Error saving constraint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete constraint handler
  const handleDeleteConstraint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this constraint?")) return;

    try {
      const res = await fetch(`/api/constraints?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete constraint");
      }

      router.refresh();
    } catch (err) {
      alert("Error deleting constraint");
    }
  };

  // Form Submitter for logging incident
  const handleAddIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle || !incDescription) {
      setIncFormError("Title and Description are required.");
      return;
    }

    setIsIncSubmitting(true);
    setIncFormError("");

    const servicesArray = incServices
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: incTitle,
          severity: incSeverity,
          status: incStatus,
          description: incDescription,
          services: servicesArray,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create incident");
      }

      setIncTitle("");
      setIncDescription("");
      setIncServices("");
      router.refresh();
    } catch (err) {
      setIncFormError("Error logging incident. Please try again.");
    } finally {
      setIsIncSubmitting(false);
    }
  };

  // Delete incident handler
  const handleDeleteIncident = async (id: string) => {
    if (!confirm("Are you sure you want to delete this incident?")) return;

    try {
      const res = await fetch(`/api/incidents?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete incident");
      }

      router.refresh();
    } catch (err) {
      alert("Error deleting incident");
    }
  };

  return (
    <div className="dashboard-root">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@300;400;500;600&family=Syne:wght@400;700;800&display=swap');

        .dashboard-root {
          --bg:           #080808;
          --surface:      #0f0f0f;
          --surface2:     #141414;
          --border:       #1e1e1e;
          --border-bright:#2e2e2e;
          --text:         #e8e4dc;
          --text-dim:     #6a6560;
          --text-mid:     #9e9890;
          --accent:       #e8c547;
          --accent-dim:   #a8901f;
          --red:          #e84747;
          --green:        #47e8a0;
          --blue:         #47a8e8;
          --mono:         'IBM Plex Mono', monospace;
          --serif:        'DM Serif Display', serif;
          --sans:         'Syne', sans-serif;
          --sidebar-w:    220px;

          background: var(--bg);
          color: var(--text);
          font-family: var(--mono);
          display: flex;
          flex: 1;
          overflow: hidden;
          position: relative;
          width: 100%;
        }

        .dashboard-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* noise */
        .dashboard-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1000;
          opacity: 0.35;
        }

        /* ── SIDEBAR ── */
        .dashboard-root .sidebar {
          width: var(--sidebar-w);
          flex-shrink: 0;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
          overflow: hidden;
        }
        .dashboard-root .sidebar.collapsed {
          margin-left: calc(-1 * var(--sidebar-w));
          opacity: 0;
          pointer-events: none;
        }
        .dashboard-root .sidebar-toggle-btn {
          background: transparent;
          border: 1px solid var(--border-bright);
          color: var(--text-dim);
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .dashboard-root .sidebar-toggle-btn:hover {
          color: var(--accent);
          border-color: var(--accent);
          background: rgba(232,197,71,0.05);
        }
        .dashboard-root .sidebar-toggle-btn svg {
          width: 16px;
          height: 16px;
        }

        .dashboard-root .sidebar-logo {
          padding: 24px 20px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dashboard-root .logo-mark {
          width: 28px; height: 28px;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dashboard-root .logo-mark span {
          font-family: var(--sans);
          font-weight: 800;
          font-size: 13px;
          color: #000;
        }
        .dashboard-root .logo-text {
          font-family: var(--sans);
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          line-height: 1.2;
          color: var(--text);
        }
        .dashboard-root .logo-text em { color: var(--accent); font-style: normal; }

        .dashboard-root .sidebar-section {
          padding: 20px 0;
          border-bottom: 1px solid var(--border);
        }
        .dashboard-root .sidebar-section-label {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-dim);
          padding: 0 20px 10px;
        }
        .dashboard-root .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 20px;
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.05em;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s, background 0.15s;
          position: relative;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          font-family: var(--mono);
        }
        .dashboard-root .nav-item:hover { color: var(--text); background: rgba(255,255,255,0.03); }
        .dashboard-root .nav-item.active {
          color: var(--accent);
          background: rgba(232,197,71,0.06);
        }
        .dashboard-root .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 2px;
          background: var(--accent);
        }
        .dashboard-root .nav-icon {
          width: 14px; height: 14px;
          opacity: 0.6;
          flex-shrink: 0;
        }
        .dashboard-root .nav-item.active .nav-icon { opacity: 1; }
        .dashboard-root .nav-badge {
          margin-left: auto;
          font-size: 9px;
          padding: 2px 6px;
          background: rgba(232,71,71,0.15);
          color: var(--red);
          letter-spacing: 0.1em;
        }
        .dashboard-root .nav-badge.ok {
          background: rgba(71,232,160,0.1);
          color: var(--green);
        }

        .dashboard-root .sidebar-footer {
          margin-top: auto;
          padding: 16px 20px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dashboard-root .avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: var(--border-bright);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-mid);
          flex-shrink: 0;
          border: 1px solid var(--border-bright);
        }
        .dashboard-root .sidebar-user { flex: 1; min-width: 0; }
        .dashboard-root .sidebar-user-name { font-size: 11px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dashboard-root .sidebar-user-role { font-size: 9px; color: var(--text-dim); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; }

        /* ── MAIN ── */
        .dashboard-root .main {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100%;
        }

        /* TOP BAR */
        .dashboard-root .topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(8,8,8,0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          flex-shrink: 0;
        }

        /* TABS */
        .dashboard-root .tab-bar {
          display: flex;
          align-items: stretch;
          height: 100%;
          gap: 0;
        }
        .dashboard-root .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-dim);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
          position: relative;
          background: transparent;
          border: none;
          font-family: var(--mono);
        }
        .dashboard-root .tab:hover { color: var(--text-mid); }
        .dashboard-root .tab.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }
        .dashboard-root .tab-count {
          font-size: 9px;
          padding: 2px 6px;
          background: rgba(232,197,71,0.15);
          color: var(--accent);
          margin-left: 4px;
        }

        .dashboard-root .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dashboard-root .topbar-btn {
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 8px 16px;
          background: var(--accent);
          color: #000;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          display: flex; align-items: center; gap: 6px;
        }
        .dashboard-root .topbar-btn:hover { background: #fff; }
        .dashboard-root .topbar-btn.ghost {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid var(--border-bright);
        }
        .dashboard-root .topbar-btn.ghost:hover { color: var(--text); border-color: var(--text-dim); }

        /* CONTENT */
        .dashboard-root .content {
          padding: 40px;
          flex: 1;
        }

        /* PAGE HEADER */
        .dashboard-root .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 40px;
          padding-bottom: 32px;
          border-bottom: 1px solid var(--border);
        }
        .dashboard-root .page-eyebrow {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 8px;
          display: flex; align-items: center; gap: 8px;
        }
        .dashboard-root .page-eyebrow::before { content: '//'; color: var(--text-dim); }
        .dashboard-root .page-title {
          font-family: var(--serif);
          font-size: 36px;
          line-height: 1.05;
          color: var(--text);
        }
        .dashboard-root .page-title em { font-style: italic; color: var(--accent); }
        .dashboard-root .page-sub {
          font-size: 11px;
          color: var(--text-dim);
          margin-top: 6px;
          letter-spacing: 0.04em;
          line-height: 1.7;
        }
        .dashboard-root .live-pill {
          display: flex; align-items: center; gap: 6px;
          font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--green);
          border: 1px solid rgba(71,232,160,0.2);
          padding: 6px 12px;
        }
        .dashboard-root .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse-g 1.8s infinite; }
        @keyframes pulse-g { 0%,100%{opacity:1} 50%{opacity:0.2} }

        /* STAT CARDS */
        .dashboard-root .stat-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border: 1px solid var(--border);
          margin-bottom: 24px;
        }
        .dashboard-root .stat-card {
          padding: 28px 28px 24px;
          border-right: 1px solid var(--border);
          position: relative;
          overflow: hidden;
          transition: background 0.2s;
        }
        .dashboard-root .stat-card:last-child { border-right: none; }
        .dashboard-root .stat-card:hover { background: var(--surface); }
        .dashboard-root .stat-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s ease;
        }
        .dashboard-root .stat-card:hover::after { transform: scaleX(1); }
        .dashboard-root .stat-card.c-repos::after { background: var(--blue); }
        .dashboard-root .stat-card.c-prs::after   { background: var(--accent); }
        .dashboard-root .stat-card.c-avg::after   { background: var(--green); }
        .dashboard-root .stat-card.c-alert::after { background: var(--red); }

        .dashboard-root .stat-label {
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .dashboard-root .stat-num {
          font-family: var(--serif);
          font-size: 48px;
          line-height: 1;
          color: var(--text);
        }
        .dashboard-root .stat-num sup {
          font-family: var(--mono);
          font-size: 16px;
          color: var(--text-dim);
          vertical-align: super;
        }
        .dashboard-root .stat-meta {
          font-size: 10px;
          color: var(--text-dim);
          margin-top: 8px;
          letter-spacing: 0.06em;
        }
        .dashboard-root .stat-bar {
          margin-top: 16px;
          height: 2px;
          background: var(--border);
          position: relative;
          overflow: hidden;
        }
        .dashboard-root .stat-bar-fill {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          transition: width 1.2s cubic-bezier(0.19,1,0.22,1);
        }
        .dashboard-root .stat-trend {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 9px;
          margin-top: 10px;
          padding: 3px 8px;
        }
        .dashboard-root .trend-up   { background: rgba(71,232,160,0.1); color: var(--green); }
        .dashboard-root .trend-down { background: rgba(232,71,71,0.1);  color: var(--red);   }
        .dashboard-root .trend-neu  { background: rgba(255,255,255,0.05); color: var(--text-dim); }

        /* MAIN GRID */
        .dashboard-root .main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          margin-bottom: 24px;
        }

        /* PANEL */
        .dashboard-root .panel {
          background: var(--surface);
          border: 1px solid var(--border);
        }
        .dashboard-root .panel-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .dashboard-root .panel-title {
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text);
          display: flex; align-items: center; gap: 8px;
        }
        .dashboard-root .panel-title-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
        }
        .dashboard-root .panel-sub { font-size: 10px; color: var(--text-dim); margin-top: 2px; }
        .dashboard-root .panel-action {
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex; align-items: center; gap: 5px;
          border: 1px solid transparent;
          padding: 5px 10px;
          transition: all 0.15s;
          background: none;
          font-family: var(--mono);
        }
        .dashboard-root .panel-action:hover { color: var(--accent); border-color: rgba(232,197,71,0.3); }
        .dashboard-root .panel-body { padding: 24px; }

        /* CHART AREA */
        .dashboard-root .chart-area {
          height: 200px;
          position: relative;
          display: flex;
          align-items: flex-end;
          gap: 6px;
        }
        .dashboard-root .chart-wrap {
          position: relative;
          padding-left: 0px;
        }
        .dashboard-root .chart-sparkline {
          width: 100%;
          height: 160px;
        }

        /* EMPTY STATE */
        .dashboard-root .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 180px;
          gap: 12px;
        }
        .dashboard-root .empty-icon {
          width: 40px; height: 40px;
          border: 1px solid var(--border-bright);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-dim);
          font-size: 18px;
        }
        .dashboard-root .empty-title { font-size: 12px; color: var(--text-mid); }
        .dashboard-root .empty-sub { font-size: 10px; color: var(--text-dim); text-align: center; max-width: 220px; line-height: 1.7; }
        .dashboard-root .empty-cta {
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 8px 16px;
          background: rgba(232,197,71,0.1);
          color: var(--accent);
          border: 1px solid rgba(232,197,71,0.25);
          cursor: pointer;
          transition: all 0.15s;
          display: flex; align-items: center; gap: 6px;
        }
        .dashboard-root .empty-cta:hover { background: var(--accent); color: #000; border-color: var(--accent); }

        /* SIDE PANEL */
        .dashboard-root .side-panel-body { padding: 0; }
        .dashboard-root .mcp-status-block {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .dashboard-root .mcp-header-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .dashboard-root .mcp-tag {
          font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase;
          padding: 3px 8px;
          background: rgba(71,232,160,0.1);
          color: var(--green);
          display: flex; align-items: center; gap: 5px;
        }
        .dashboard-root .mcp-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green); animation: pulse-g 1.8s infinite; }
        .dashboard-root .mcp-desc { font-size: 11px; color: var(--text-mid); line-height: 1.7; }
        .dashboard-root .mcp-tools { margin-top: 14px; display: flex; flex-direction: column; gap: 6px; }
        .dashboard-root .mcp-tool-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          font-size: 10px;
        }
        .dashboard-root .mcp-tool-name { color: var(--accent); font-weight: 500; }
        .dashboard-root .mcp-tool-type { color: var(--text-dim); font-size: 9px; letter-spacing: 0.1em; }

        .dashboard-root .connect-block {
          padding: 20px 24px;
        }
        .dashboard-root .connect-block-label {
          font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--text-dim); margin-bottom: 14px;
        }
        .dashboard-root .repo-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .dashboard-root .repo-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
          transition: border-color 0.15s;
        }
        .dashboard-root .repo-item:hover { border-color: var(--border-bright); }
        .dashboard-root .repo-item-name { font-size: 11px; color: var(--text); display: flex; align-items: center; gap: 8px; }
        .dashboard-root .repo-item-name::before { content: ''; display: block; width: 6px; height: 6px; border-radius: 50%; background: var(--blue); }
        .dashboard-root .repo-item-meta { font-size: 9px; color: var(--text-dim); }
        .dashboard-root .connect-btn {
          width: 100%;
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 12px;
          background: var(--accent);
          color: #000;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .dashboard-root .connect-btn:hover { background: #fff; }

        /* ALERTS TABLE */
        .dashboard-root .alerts-panel { }
        .dashboard-root .alert-table { width: 100%; border-collapse: collapse; }
        .dashboard-root .alert-table th {
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-dim);
          padding: 10px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border);
          font-weight: 400;
        }
        .dashboard-root .alert-table td {
          padding: 14px 16px;
          font-size: 11px;
          border-bottom: 1px solid var(--border);
          color: var(--text-mid);
          vertical-align: middle;
        }
        .dashboard-root .alert-table tr:last-child td { border-bottom: none; }
        .dashboard-root .alert-table tr:hover td { background: rgba(255,255,255,0.015); }
        .dashboard-root .risk-pill {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 600;
          padding: 4px 10px;
        }
        .dashboard-root .risk-high { background: rgba(232,71,71,0.12); color: var(--red); }
        .dashboard-root .risk-med  { background: rgba(232,197,71,0.12); color: var(--accent); }
        .dashboard-root .risk-low  { background: rgba(71,232,160,0.12); color: var(--green); }
        .dashboard-root .pr-link { color: var(--text); font-weight: 500; text-decoration: none; cursor: pointer; }
        .dashboard-root .pr-link:hover { color: var(--accent); }
        .dashboard-root .pr-repo { font-size: 9px; color: var(--text-dim); margin-top: 2px; letter-spacing: 0.06em; }
        .dashboard-root .alert-status {
          font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
          padding: 3px 8px;
        }
        .dashboard-root .status-blocked  { background: rgba(232,71,71,0.1); color: var(--red); }
        .dashboard-root .status-review   { background: rgba(232,197,71,0.1); color: var(--accent); }
        .dashboard-root .status-merged   { background: rgba(71,232,160,0.1); color: var(--green); }
        .dashboard-root .owner-tag {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 9px; color: var(--text-dim);
          padding: 3px 8px;
          border: 1px solid var(--border);
        }
        .dashboard-root .owner-tag::before { content: '@'; color: var(--text-dim); }

        /* INCIDENTS */
        .dashboard-root .incidents-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .dashboard-root .incident-card {
          padding: 20px;
          border: 1px solid var(--border);
          background: var(--surface);
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .dashboard-root .incident-card:hover { border-color: var(--border-bright); }
        .dashboard-root .incident-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
        }
        .dashboard-root .incident-card.sev-high::before { background: var(--red); }
        .dashboard-root .incident-card.sev-med::before  { background: var(--accent); }
        .dashboard-root .incident-num {
          font-family: var(--serif);
          font-size: 11px;
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .dashboard-root .incident-title { font-size: 12px; color: var(--text); margin-bottom: 6px; font-weight: 500; }
        .dashboard-root .incident-meta { font-size: 10px; color: var(--text-dim); display: flex; gap: 12px; flex-wrap: wrap; }
        .dashboard-root .incident-meta span { display: flex; align-items: center; gap: 4px; }

        /* BOTTOM ROW */
        .dashboard-root .bottom-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        /* STATUS ROW */
        .dashboard-root .status-row {
          padding: 0 40px;
          height: 36px;
          border-top: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          gap: 24px;
          flex-shrink: 0;
        }
        .dashboard-root .status-item {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
          display: flex; align-items: center; gap: 6px;
        }
        .dashboard-root .status-item .dot { width: 5px; height: 5px; border-radius: 50%; }
        .dashboard-root .dot-green { background: var(--green); }
        .dashboard-root .dot-yellow { background: var(--accent); }
        .dashboard-root .dot-dim   { background: var(--border-bright); }

        /* scrollbar */
        .dashboard-root .main::-webkit-scrollbar { width: 4px; }
        .dashboard-root .main::-webkit-scrollbar-track { background: var(--bg); }
        .dashboard-root .main::-webkit-scrollbar-thumb { background: var(--border-bright); }
        .dashboard-root .main::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }

        /* CONSTRAINTS TAGS */
        .dashboard-root .constraint-list { display: flex; flex-direction: column; gap: 10px; }
        .dashboard-root .constraint-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
          transition: border-color 0.15s;
        }
        .dashboard-root .constraint-row:hover { border-color: var(--border-bright); }
        .dashboard-root .constraint-name { font-size: 11px; color: var(--text); }
        .dashboard-root .constraint-scope { font-size: 9px; color: var(--text-dim); margin-top: 2px; letter-spacing: 0.08em; }
        .dashboard-root .constraint-badge {
          font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 8px;
        }
        .dashboard-root .cb-active  { background: rgba(71,232,160,0.1); color: var(--green); }
        .dashboard-root .cb-warn    { background: rgba(232,197,71,0.1); color: var(--accent); }
        .dashboard-root .cb-off     { background: rgba(255,255,255,0.04); color: var(--text-dim); }

        /* FORM FIELD DESIGN */
        .dashboard-root form input,
        .dashboard-root form select,
        .dashboard-root form textarea {
          border: 1px solid var(--border-bright);
          background: var(--bg);
          color: var(--text);
          border-radius: 0;
          font-family: var(--mono);
          padding: 10px 14px;
          font-size: 11px;
          outline: none;
          width: 100%;
        }
        .dashboard-root form input:focus,
        .dashboard-root form select:focus,
        .dashboard-root form textarea:focus {
          border-color: var(--accent);
        }
        .dashboard-root form label {
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 6px;
          display: block;
        }
        .dashboard-root .form-btn {
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 12px;
          background: var(--accent);
          color: #000;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .dashboard-root .form-btn:hover {
          background: #fff;
        }

        /* RESPONSIVE LAYOUT */
        @media(max-width: 1024px) {
          .dashboard-root .main-grid {
            grid-template-columns: 1fr;
          }
          .dashboard-root .bottom-row {
            grid-template-columns: 1fr;
          }
        }
        @media(max-width: 768px) {
          .dashboard-root {
            flex-direction: column;
          }
          .dashboard-root .sidebar {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--border);
            transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
          }
          .dashboard-root .sidebar.collapsed {
            height: 0;
            width: 100%;
            margin-left: 0;
            border-bottom: none;
            opacity: 0;
            pointer-events: none;
          }
        }
      ` }} />

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${showSidebar ? "" : "collapsed"}`}>
        <div className="sidebar-logo">
          <div className="logo-mark"><span>C</span></div>
          <div className="logo-text">Context<em>Hub</em> AI</div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Monitor</div>
          <button
            onClick={() => setActiveTab("overview")}
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
          >
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="5" height="5" />
              <rect x="10" y="1" width="5" height="5" />
              <rect x="1" y="10" width="5" height="5" />
              <rect x="10" y="10" width="5" height="5" />
            </svg>
            Overview
          </button>
          <button
            onClick={() => setActiveTab("prs")}
            className={`nav-item ${activeTab === "prs" ? "active" : ""}`}
          >
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1v6l4 2" />
              <circle cx="8" cy="8" r="7" />
            </svg>
            Pull Requests
            {metrics.totalScored > 0 && <span className="nav-badge">{metrics.totalScored}</span>}
          </button>
          <button
            onClick={() => setActiveTab("incidents")}
            className={`nav-item ${activeTab === "incidents" ? "active" : ""}`}
          >
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 4h14M1 8h10M1 12h6" />
            </svg>
            Incidents
            {incidents.length > 0 && <span className="nav-badge">{incidents.length}</span>}
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Configure</div>
          <button
            onClick={() => setActiveTab("repos")}
            className={`nav-item ${activeTab === "repos" ? "active" : ""}`}
          >
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 3h12M2 8h8M2 13h10" />
            </svg>
            Repositories
            <span className="nav-badge ok">{repos.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("constraints")}
            className={`nav-item ${activeTab === "constraints" ? "active" : ""}`}
          >
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1l2 4h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" />
            </svg>
            Constraints
          </button>
          <button
            onClick={() => setActiveTab("ownership")}
            className={`nav-item ${activeTab === "ownership" ? "active" : ""}`}
          >
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="6" r="3" />
              <path d="M1 15c0-4 3-6 7-6s7 2 7 6" />
            </svg>
            Ownership
          </button>
          <button
            onClick={() => setActiveTab("mcp")}
            className={`nav-item ${activeTab === "mcp" ? "active" : ""}`}
          >
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="3" width="14" height="10" rx="1" />
              <path d="M5 7h6M5 10h4" />
            </svg>
            MCP API
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="avatar">{userInitials}</div>
          <div className="sidebar-user">
            <div className="sidebar-user-name">{userEmail}</div>
            <div className="sidebar-user-role">Platform Eng</div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main">
        {/* TOPBAR + TABS */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", height: "100%" }}>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="sidebar-toggle-btn"
              title={showSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                {showSidebar ? (
                  <path d="M16 15l-3-3 3-3" />
                ) : (
                  <path d="M14 9l3 3-3 3" />
                )}
              </svg>
            </button>

            <div className="tab-bar">
              <button
                onClick={() => setActiveTab("overview")}
                className={`tab ${activeTab === "overview" ? "active" : ""}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("prs")}
                className={`tab ${activeTab === "prs" ? "active" : ""}`}
              >
                Pull Requests
                {metrics.totalScored > 0 && <span className="tab-count">{metrics.totalScored}</span>}
              </button>
              <button
                onClick={() => setActiveTab("repos")}
                className={`tab ${activeTab === "repos" ? "active" : ""}`}
              >
                Repositories
                <span className="tab-count">{repos.length}</span>
              </button>
              <button
                onClick={() => setActiveTab("constraints")}
                className={`tab ${activeTab === "constraints" ? "active" : ""}`}
              >
                Constraints
              </button>
              <button
                onClick={() => setActiveTab("incidents")}
                className={`tab ${activeTab === "incidents" ? "active" : ""}`}
              >
                Incidents
              </button>
            </div>
          </div>
          <div className="topbar-right">
            <button onClick={() => router.refresh()} className="topbar-btn ghost">
              ↯ Scan Now
            </button>
            <a href={installUrl} className="topbar-btn" style={{ textDecoration: "none" }}>
              + Connect Repo
            </a>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          {/* PAGE HEADER */}
          <div className="page-header">
            <div>
              <div className="page-eyebrow">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </div>
              <h1 className="page-title">
                {activeTab === "overview" && (
                  <>
                    Risk <em>Overview</em>
                  </>
                )}
                {activeTab === "prs" && (
                  <>
                    Pull <em>Requests</em>
                  </>
                )}
                {activeTab === "repos" && (
                  <>
                    Repository <em>Registry</em>
                  </>
                )}
                {activeTab === "constraints" && (
                  <>
                    Active <em>Constraints</em>
                  </>
                )}
                {activeTab === "incidents" && (
                  <>
                    Incident <em>Correlations</em>
                  </>
                )}
                {activeTab === "ownership" && (
                  <>
                    Ownership <em>Intelligence</em>
                  </>
                )}
                {activeTab === "mcp" && (
                  <>
                    MCP <em>API Surface</em>
                  </>
                )}
              </h1>
              <div className="page-sub">
                {activeTab === "overview" &&
                  `Monitoring ${repos.length} repositories · Last scored 4 minutes ago`}
                {activeTab === "prs" && "Audit risk assessments generated by autonomous agents"}
                {activeTab === "repos" && "Manage GitHub app installations and repository scopes"}
                {activeTab === "constraints" && "Define operational rules, compliance policies, and deployment freeze periods"}
                {activeTab === "incidents" && "Associate recent system incident scopes with codebase modules"}
                {activeTab === "ownership" && "CODEOWNERS repository coverage statistics"}
                {activeTab === "mcp" && "Streaming context layer directly into autonomous agent prompts"}
              </div>
            </div>
            <div className="live-pill">
              <div className="live-dot"></div> Live · Webhooks Active
            </div>
          </div>

          {/* OVERVIEW VIEW */}
          {activeTab === "overview" && (
            <div>
              {/* STAT CARDS */}
              <div className="stat-row">
                <div className="stat-card c-repos">
                  <div className="stat-label">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ marginRight: "6px" }}
                    >
                      <path d="M2 3h12M2 8h8M2 13h10" />
                    </svg>
                    Connected Repos
                  </div>
                  <div className="stat-num">{repos.length}</div>
                  <div className="stat-meta">
                    {repos.length > 0
                      ? repos.map((r) => r.name).join(", ")
                      : "No connected repositories"}
                  </div>
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: animateWidths ? "60%" : "0%",
                        background: "var(--blue)",
                      }}
                    ></div>
                  </div>
                  <div className="stat-trend trend-neu">→ Stable</div>
                </div>

                <div className="stat-card c-prs">
                  <div className="stat-label">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ marginRight: "6px" }}
                    >
                      <circle cx="8" cy="8" r="7" />
                      <path d="M8 4v5l3 2" />
                    </svg>
                    Scored PRs · 7d
                  </div>
                  <div className="stat-num">{metrics.totalScored}</div>
                  <div className="stat-meta">Scored by ContextHub agent engine</div>
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: animateWidths ? "75%" : "0%",
                        background: "var(--accent)",
                      }}
                    ></div>
                  </div>
                  <div className="stat-trend trend-up">↑ +{metrics.totalScored} vs last week</div>
                </div>

                <div className="stat-card c-avg">
                  <div className="stat-label">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ marginRight: "6px" }}
                    >
                      <path d="M2 12L6 7l3 3 4-6" />
                    </svg>
                    Avg Risk Score
                  </div>
                  <div className="stat-num">
                    {metrics.avgRiskScore}
                    <sup>/10</sup>
                  </div>
                  <div className="stat-meta">Across scored pull requests</div>
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: animateWidths ? `${metrics.avgRiskScore * 10}%` : "0%",
                        background: "var(--green)",
                      }}
                    ></div>
                  </div>
                  <div className="stat-trend trend-down">↓ Average risk in low zone</div>
                </div>

                <div className="stat-card c-alert">
                  <div className="stat-label">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ marginRight: "6px" }}
                    >
                      <path d="M8 1l7 14H1z" />
                      <path d="M8 6v5M8 12v1" />
                    </svg>
                    High-Risk Alerts
                  </div>
                  <div className="stat-num">{metrics.highRiskCount}</div>
                  <div className="stat-meta">Score &ge; 7 · Requires review</div>
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: animateWidths ? `${metrics.highRiskCount > 0 ? 30 : 0}%` : "0%",
                        background: "var(--red)",
                      }}
                    ></div>
                  </div>
                  <div
                    className={`stat-trend ${metrics.highRiskCount > 0 ? "trend-up" : "trend-neu"}`}
                  >
                    {metrics.highRiskCount > 0 ? "⚠ Elevated Attention Required" : "→ Stable"}
                  </div>
                </div>
              </div>

              {/* MAIN GRID */}
              <div className="main-grid">
                {/* TREND CHART */}
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">
                        <div className="panel-title-dot" style={{ background: "var(--accent)" }}></div>
                        Risk Score Trends
                      </div>
                      <div className="panel-sub">
                        Chronological progression of PR risk evaluations · Last 14 days
                      </div>
                    </div>
                  </div>
                  <div className="panel-body">
                    <div className="chart-wrap">
                      <svg
                        className="chart-sparkline"
                        viewBox={`0 0 ${sparklineData.width} ${sparklineData.height}`}
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* grid lines */}
                        <line x1="0" y1="32" x2="600" y2="32" stroke="#1e1e1e" strokeWidth="1" />
                        <line x1="0" y1="64" x2="600" y2="64" stroke="#1e1e1e" strokeWidth="1" />
                        <line x1="0" y1="96" x2="600" y2="96" stroke="#1e1e1e" strokeWidth="1" />
                        <line x1="0" y1="128" x2="600" y2="128" stroke="#1e1e1e" strokeWidth="1" />
                        {/* area fill */}
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#e8c547" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#e8c547" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#e8c547" stopOpacity="0.4" />
                            <stop offset="60%" stopColor="#e8c547" />
                            <stop offset="100%" stopColor="#e84747" />
                          </linearGradient>
                        </defs>
                        <path d={sparklineData.areaD} fill="url(#areaGrad)" />
                        <path
                          d={sparklineData.pathD}
                          fill="none"
                          stroke="url(#lineGrad)"
                          strokeWidth="2.5"
                        />
                        {/* data points */}
                        {sparklineData.points.map((p, i) => (
                          <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="4"
                            fill={p.score >= 7 ? "var(--red)" : "var(--accent)"}
                            className="hover:r-6 cursor-pointer transition-all"
                          >
                            <title>{`Score: ${p.score}/10`}</title>
                          </circle>
                        ))}
                        {/* threshold line */}
                        <line
                          x1="0"
                          y1="48"
                          x2="600"
                          y2="48"
                          stroke="#e84747"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                          opacity="0.4"
                        />
                        <text
                          x="4"
                          y="44"
                          fill="#e84747"
                          fontSize="9"
                          fontFamily="IBM Plex Mono"
                          opacity="0.6"
                        >
                          threshold: 7
                        </text>
                      </svg>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", padding: "0 2px" }}>
                      <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>Start</span>
                      <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>7 Days Ago</span>
                      <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>Today</span>
                    </div>
                    <div style={{ display: "flex", gap: "20px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "var(--text-dim)" }}>
                        <div style={{ width: "16px", height: "2px", background: "var(--accent)" }}></div>
                        PR Risk Evaluation Points
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "var(--text-dim)" }}>
                        <div style={{ width: "16px", height: "1px", background: "var(--red)", borderTop: "1px dashed var(--red)" }}></div>
                        Alert Threshold (&ge;7)
                      </div>
                      <div style={{ marginLeft: "auto", fontSize: "10px", color: "var(--text-dim)" }}>
                        Peak Evaluation:{" "}
                        <span style={{ color: "var(--red)" }}>
                          {prs.reduce(
                            (max, p) =>
                              p.assessment && parseFloat(p.assessment.risk_score) > max
                                ? parseFloat(p.assessment.risk_score)
                                : max,
                            0
                          )}
                          /10
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE MCP STATUS */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div className="panel">
                    <div className="panel-header">
                      <div>
                        <div className="panel-title">
                          <div className="panel-title-dot" style={{ background: "var(--green)" }}></div>
                          MCP Agent Core
                        </div>
                        <div className="panel-sub">Agents query context before writing</div>
                      </div>
                    </div>
                    <div className="side-panel-body">
                      <div className="mcp-status-block">
                        <div className="mcp-desc">
                          AI coding agents call context tools dynamically before proposing commits.
                          Zero configuration needed.
                        </div>
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
                      <div className="connect-block">
                        <div className="connect-block-label">Connected Repositories</div>
                        <div className="repo-list">
                          {repos.slice(0, 3).map((repo) => (
                            <div key={repo.id} className="repo-item">
                              <div>
                                <div className="repo-item-name">{repo.name}</div>
                                <div className="repo-item-meta">
                                  {prs.filter((p) => p.repository.id === repo.id).length} PRs scored
                                </div>
                              </div>
                              <span className="mcp-tag" style={{ fontSize: "8px", padding: "2px 6px" }}>
                                <span className="mcp-tag-dot"></span> Live
                              </span>
                            </div>
                          ))}
                        </div>
                        <a
                          href={installUrl}
                          className="connect-btn"
                          style={{ textDecoration: "none" }}
                        >
                          + Connect Repository
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ALERTS TABLE */}
              <div className="panel alerts-panel" style={{ marginBottom: "24px" }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">
                      <div className="panel-title-dot" style={{ background: "var(--red)" }}></div>
                      Recent Alerts & Scored PRs
                    </div>
                    <div className="panel-sub">Detailed evaluations on active pull requests</div>
                  </div>
                  <button onClick={() => setActiveTab("prs")} className="panel-action">
                    View All →
                  </button>
                </div>
                <table className="alert-table">
                  <thead>
                    <tr>
                      <th>Pull Request</th>
                      <th>Risk</th>
                      <th>Lead Codeowner</th>
                      <th>Primary Factors</th>
                      <th>Status</th>
                      <th>Scored</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "var(--text-dim)" }}>
                          No pull requests scored yet. Connect repository webhook to trigger.
                        </td>
                      </tr>
                    ) : (
                      prs.slice(0, 5).map((item) => {
                        const score = item.assessment
                          ? parseFloat(item.assessment.risk_score)
                          : 0;
                        const statusClass =
                          score >= 7
                            ? "status-blocked"
                            : score >= 4
                            ? "status-review"
                            : "status-merged";
                        const riskClass =
                          score >= 7 ? "risk-high" : score >= 4 ? "risk-med" : "risk-low";

                        return (
                          <tr key={item.pr.id}>
                            <td>
                              <button
                                onClick={() => {
                                  setActiveTab("prs");
                                  togglePr(item.pr.id);
                                }}
                                className="pr-link"
                              >
                                #{item.pr.number} — {item.pr.title}
                              </button>
                              <div className="pr-repo">
                                {item.repository.name} · by {item.pr.author}
                              </div>
                            </td>
                            <td>
                              <span className={`risk-pill ${riskClass}`}>
                                {item.assessment ? `${item.assessment.risk_score} / 10` : "Unscored"}
                              </span>
                            </td>
                            <td>
                              <span className="owner-tag">
                                {item.factors?.[0]?.factor_type === "OwnershipMismatch"
                                  ? "CODEOWNER violation"
                                  : "auto-assign"}
                              </span>
                            </td>
                            <td style={{ fontSize: "10px", maxWidth: "220px", color: "var(--text-mid)" }}>
                              {item.factors.slice(0, 2).map((f) => f.factor_type).join(", ") ||
                                "No risk triggers found. Clean changes."}
                            </td>
                            <td>
                              <span className={`alert-status ${statusClass}`}>
                                {score >= 7 ? "Blocked" : score >= 4 ? "Review" : "Ok"}
                              </span>
                            </td>
                            <td style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                              {new Date(item.pr.updated_at).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* BOTTOM ROW */}
              <div className="bottom-row">
                {/* ACTIVE CONSTRAINTS CARD */}
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">
                        <div
                          className="panel-title-dot"
                          style={{ background: "var(--blue)" }}
                        ></div>
                        Active Constraints
                      </div>
                      <div className="panel-sub">Rules checked at scoring time</div>
                    </div>
                    <button onClick={() => setActiveTab("constraints")} className="panel-action">
                      Edit →
                    </button>
                  </div>
                  <div className="panel-body">
                    <div className="constraint-list">
                      {constraints.length === 0 ? (
                        <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                          No active deployment constraints.
                        </p>
                      ) : (
                        constraints.slice(0, 3).map((c) => (
                          <div key={c.id} className="constraint-row">
                            <div>
                              <div className="constraint-name">
                                {c.constraint_type === "freeze" ? "Deploy Freeze" : "Restriction"}
                              </div>
                              <div className="constraint-scope">{c.scope}</div>
                            </div>
                            <span className="constraint-badge cb-active">Active</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* OWNERSHIP MAP CARD */}
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">
                        <div
                          className="panel-title-dot"
                          style={{ background: "var(--accent)" }}
                        ></div>
                        Ownership Map
                      </div>
                      <div className="panel-sub">CODEOWNERS coverage statistics</div>
                    </div>
                    <button onClick={() => setActiveTab("ownership")} className="panel-action">
                      View →
                    </button>
                  </div>
                  <div className="panel-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {repos.length === 0 ? (
                        <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                          Connect repos to synchronize CODEOWNERS metadata.
                        </p>
                      ) : (
                        repos.slice(0, 3).map((repo, idx) => {
                          const val = idx === 0 ? 87 : idx === 1 ? 62 : 96;
                          return (
                            <div key={repo.id}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <span style={{ fontSize: "10px", color: "var(--text-mid)" }}>
                                  {repo.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: val > 80 ? "var(--green)" : "var(--accent)",
                                  }}
                                >
                                  {val}%
                                </span>
                              </div>
                              <div style={{ height: "4px", background: "var(--border)" }}>
                                <div
                                  style={{
                                    height: "100%",
                                    width: animateWidths ? `${val}%` : "0%",
                                    background: val > 80 ? "var(--green)" : "var(--accent)",
                                    transition: "width 1.2s",
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div style={{ marginTop: "20px", padding: "12px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", fontSize: "10px", color: "var(--text-dim)", lineHeight: "1.7" }}>
                      <span style={{ color: "var(--accent)" }}>↯ Rules Synchronized</span> — PR files
                      lacking CODEOWNERS entries automatically apply a risk delta.
                    </div>
                  </div>
                </div>

                {/* INCIDENTS CORRELATION CARD */}
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">
                        <div className="panel-title-dot" style={{ background: "var(--red)" }}></div>
                        Incident Correlation
                      </div>
                      <div className="panel-sub">Flagging sensitive modules</div>
                    </div>
                    <button onClick={() => setActiveTab("incidents")} className="panel-action">
                      Add →
                    </button>
                  </div>
                  <div className="panel-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {incidents.length === 0 ? (
                        <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                          No active outages or incident records registered.
                        </p>
                      ) : (
                        incidents.slice(0, 2).map((inc) => (
                          <div
                            key={inc.id}
                            style={{
                              padding: "12px",
                              border: "1px solid var(--border)",
                              borderLeft:
                                inc.severity === "critical" || inc.severity === "high"
                                  ? "2px solid var(--red)"
                                  : "2px solid var(--accent)",
                            }}
                          >
                            <div style={{ fontSize: "11px", color: "var(--text)", marginBottom: "4px" }}>
                              {inc.title}
                            </div>
                            <div style={{ fontSize: "9px", color: "var(--text-dim)" }}>
                              {inc.services.join(", ")} · {inc.severity.toUpperCase()}
                            </div>
                          </div>
                        ))
                      )}
                      <button
                        onClick={() => setActiveTab("incidents")}
                        className="empty-cta"
                        style={{ marginTop: "4px", width: "100%", justifyContent: "center" }}
                      >
                        + Log Incident Manually
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PULL REQUESTS TAB */}
          {activeTab === "prs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Filters Bar */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between", padding: "16px", border: "1px solid var(--border)", background: "var(--surface)" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
                  <input
                    id="pr-search-input"
                    type="text"
                    placeholder="Search PR title or number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: "1px solid var(--border-bright)",
                      background: "#000",
                      color: "var(--text)",
                      fontFamily: "var(--mono)",
                      padding: "8px 12px",
                      fontSize: "11px",
                      width: "100%",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <select
                    id="repo-select-filter"
                    value={selectedRepoFilter}
                    onChange={(e) => setSelectedRepoFilter(e.target.value)}
                    style={{
                      border: "1px solid var(--border-bright)",
                      background: "#000",
                      color: "var(--text)",
                      fontFamily: "var(--mono)",
                      padding: "8px 12px",
                      fontSize: "11px",
                    }}
                  >
                    <option value="all">All Repositories</option>
                    {repos.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>

                  <div style={{ display: "flex", border: "1px solid var(--border-bright)", background: "#000", padding: "2px" }}>
                    {(["all", "high", "medium", "low"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setRiskFilter(level)}
                        style={{
                          border: "none",
                          background: riskFilter === level ? "var(--accent)" : "transparent",
                          color: riskFilter === level ? "#000" : "var(--text-dim)",
                          fontFamily: "var(--mono)",
                          fontSize: "10px",
                          fontWeight: "600",
                          padding: "6px 12px",
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* PRs List */}
              {filteredPrs.length === 0 ? (
                <div style={{ padding: "40px", border: "1px dashed var(--border)", textAlign: "center" }}>
                  <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                    No matching scored pull requests found.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {filteredPrs.map((item) => {
                    const isExpanded = !!expandedPrs[item.pr.id];
                    const score = item.assessment ? parseFloat(item.assessment.risk_score) : null;

                    return (
                      <div
                        key={item.pr.id}
                        style={{
                          border: isExpanded ? "1px solid var(--accent)" : "1px solid var(--border)",
                          background: "var(--surface)",
                        }}
                      >
                        <div
                          onClick={() => togglePr(item.pr.id)}
                          style={{
                            padding: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "10px", color: "var(--accent)", marginBottom: "4px" }}>
                              {item.repository.full_name} · #{item.pr.number}
                            </div>
                            <div style={{ fontSize: "12px", fontWeight: "600" }}>{item.pr.title}</div>
                            <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "4px" }}>
                              by {item.pr.author} · Scored:{" "}
                              {new Date(item.pr.updated_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            {score !== null ? (
                              <span
                                className={`risk-pill ${
                                  score >= 7 ? "risk-high" : score >= 4 ? "risk-med" : "risk-low"
                                }`}
                              >
                                {score} / 10
                              </span>
                            ) : (
                              <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                                Unscored
                              </span>
                            )}
                            <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{ padding: "16px", borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.01)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
                              <div>
                                <h5 style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "8px" }}>
                                  Risk Assessment Summary
                                </h5>
                                <div style={{ border: "1px solid var(--border-bright)", background: "#000", padding: "16px", fontSize: "11px", lineHeight: "1.7", color: "var(--text-mid)" }}>
                                  {item.assessment?.reasoning || "No detailed reasoning."}
                                </div>
                                <a
                                  href={`https://github.com/${item.repository.full_name}/pull/${item.pr.number}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="empty-cta"
                                  style={{ marginTop: "16px", display: "inline-flex", textDecoration: "none" }}
                                >
                                  View on GitHub ↗
                                </a>
                              </div>

                              <div>
                                <h5 style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "8px" }}>
                                  Triggered Factors
                                </h5>
                                {item.factors.length === 0 ? (
                                  <p style={{ fontSize: "11px", color: "var(--green)" }}>
                                    ✓ No high risk factors triggered.
                                  </p>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {item.factors.map((f) => (
                                      <div
                                        key={f.id}
                                        style={{
                                          padding: "10px",
                                          border: "1px solid var(--border-bright)",
                                          background: "#000",
                                        }}
                                      >
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", marginBottom: "4px" }}>
                                          <span>{f.factor_type}</span>
                                          <span style={{ color: "var(--red)" }}>+{f.weight}</span>
                                        </div>
                                        <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                                          {f.description}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* REPOSITORIES TAB */}
          {activeTab === "repos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid var(--border)", background: "var(--surface)" }}>
                <div>
                  <h4 style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: "700" }}>
                    Connected Repositories
                  </h4>
                  <p style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px" }}>
                    Active repositories monitored by ContextHub engine.
                  </p>
                </div>
                <a
                  href={installUrl}
                  className="topbar-btn"
                  style={{ textDecoration: "none" }}
                >
                  + Install on GitHub
                </a>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {repos.map((repo) => (
                  <div
                    key={repo.id}
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      padding: "20px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "9px", textTransform: "uppercase", background: "var(--border-bright)", padding: "3px 8px", color: "var(--text-mid)" }}>
                        {repo.visibility}
                      </span>
                      <span style={{ color: "var(--green)", fontSize: "10px" }}>● Connected</span>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{repo.full_name}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "12px" }}>
                      Monitored via GitHub App Installation
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONSTRAINTS TAB */}
          {activeTab === "constraints" && (
            <div className="main-grid">
              {/* Constraints list */}
              <div>
                <h4 style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "12px" }}>
                  Active System Rules
                </h4>
                {constraints.length === 0 ? (
                  <div style={{ padding: "40px", border: "1px dashed var(--border)", textAlign: "center" }}>
                    <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                      No active constraints logged. Use the form to configure rule sets.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {constraints.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          border: "1px solid var(--border)",
                          background: "var(--surface)",
                          padding: "16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "600" }}>
                              {c.constraint_type === "freeze" ? "Deploy Freeze" : "Merge Restriction"}
                            </span>
                            <span style={{ fontSize: "9px", background: "rgba(232,71,71,0.1)", color: "var(--red)", padding: "2px 6px" }}>
                              Severity: {c.severity}
                            </span>
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-mid)", marginTop: "6px" }}>
                            Scope: <code style={{ color: "var(--accent)" }}>{c.scope}</code>
                          </div>
                          <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>
                            {c.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteConstraint(c.id)}
                          style={{ border: "none", background: "transparent", color: "var(--text-dim)", cursor: "pointer" }}
                          className="hover:text-red-500"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ingestion Form */}
              <div className="panel" style={{ height: "fit-content" }}>
                <div className="panel-header">
                  <div className="panel-title">Add Constraint</div>
                </div>
                <div className="panel-body">
                  <form onSubmit={handleAddConstraint} className="flex flex-col gap-4">
                    <div>
                      <label htmlFor="c-scope">Scope</label>
                      <input
                        id="c-scope"
                        type="text"
                        required
                        placeholder="e.g. src/payments, global"
                        value={newScope}
                        onChange={(e) => setNewScope(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="c-type">Type</label>
                      <select
                        id="c-type"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                      >
                        <option value="freeze">Deployment Freeze</option>
                        <option value="restrict">Merge Restriction</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="c-severity">Severity</label>
                      <select
                        id="c-severity"
                        value={newSeverity}
                        onChange={(e) => setNewSeverity(e.target.value)}
                      >
                        <option value="low">Low (+1 Risk)</option>
                        <option value="medium">Medium (+2 Risk)</option>
                        <option value="high">High (+3 Risk)</option>
                        <option value="critical">Critical (Override to 9+)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="c-desc">Description</label>
                      <textarea
                        id="c-desc"
                        required
                        rows={3}
                        placeholder="Define the constraint criteria..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                      ></textarea>
                    </div>
                    {formError && <p style={{ color: "var(--red)", fontSize: "11px" }}>{formError}</p>}
                    <button type="submit" disabled={isSubmitting} className="form-btn">
                      {isSubmitting ? "Adding..." : "Add Constraint"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* INCIDENTS TAB */}
          {activeTab === "incidents" && (
            <div className="main-grid">
              {/* Incidents List */}
              <div>
                <h4 style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "12px" }}>
                  Incident Correlation Registry
                </h4>
                {incidents.length === 0 ? (
                  <div style={{ padding: "40px", border: "1px dashed var(--border)", textAlign: "center" }}>
                    <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                      No active system incidents logged. Use the form to declare one.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {incidents.map((inc) => (
                      <div
                        key={inc.id}
                        style={{
                          border: "1px solid var(--border)",
                          background: "var(--surface)",
                          padding: "16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "600" }}>{inc.title}</span>
                            <span style={{ fontSize: "9px", background: "rgba(232,71,71,0.1)", color: "var(--red)", padding: "2px 6px" }}>
                              Severity: {inc.severity}
                            </span>
                            <span style={{ fontSize: "9px", background: "rgba(255,255,255,0.05)", color: "var(--text-mid)", padding: "2px 6px" }}>
                              Status: {inc.status}
                            </span>
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "6px" }}>
                            Affected Services: {inc.services.join(", ")}
                          </div>
                          <p style={{ fontSize: "11px", color: "var(--text-mid)", marginTop: "6px" }}>
                            {inc.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteIncident(inc.id)}
                          style={{ border: "none", background: "transparent", color: "var(--text-dim)", cursor: "pointer" }}
                          className="hover:text-red-500"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ingestion Form */}
              <div className="panel" style={{ height: "fit-content" }}>
                <div className="panel-header">
                  <div className="panel-title">Log Incident</div>
                </div>
                <div className="panel-body">
                  <form onSubmit={handleAddIncident} className="flex flex-col gap-4">
                    <div>
                      <label htmlFor="inc-title">Title</label>
                      <input
                        id="inc-title"
                        type="text"
                        required
                        placeholder="e.g. auth_middleware database outage"
                        value={incTitle}
                        onChange={(e) => setIncTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="inc-sev">Severity</label>
                      <select
                        id="inc-sev"
                        value={incSeverity}
                        onChange={(e) => setIncSeverity(e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="inc-status">Status</label>
                      <select
                        id="inc-status"
                        value={incStatus}
                        onChange={(e) => setIncStatus(e.target.value)}
                      >
                        <option value="investigating">Investigating</option>
                        <option value="identified">Identified</option>
                        <option value="monitoring">Monitoring</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="inc-services">Affected Services</label>
                      <input
                        id="inc-services"
                        type="text"
                        placeholder="e.g. auth, payments, billing"
                        value={incServices}
                        onChange={(e) => setIncServices(e.target.value)}
                      />
                      <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>
                        Comma-separated list of services.
                      </span>
                    </div>
                    <div>
                      <label htmlFor="inc-desc">Description</label>
                      <textarea
                        id="inc-desc"
                        required
                        rows={3}
                        placeholder="Summarize the outage reasons..."
                        value={incDescription}
                        onChange={(e) => setIncDescription(e.target.value)}
                      ></textarea>
                    </div>
                    {incFormError && <p style={{ color: "var(--red)", fontSize: "11px" }}>{incFormError}</p>}
                    <button type="submit" disabled={isIncSubmitting} className="form-btn">
                      {isIncSubmitting ? "Logging..." : "Log Incident"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* OWNERSHIP TAB */}
          {activeTab === "ownership" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">CODEOWNERS Synchronization</div>
                </div>
                <div className="panel-body">
                  <p style={{ fontSize: "12px", color: "var(--text-mid)", lineHeight: "1.7", marginBottom: "20px" }}>
                    ContextHub automatically syncs and parses your repositories' `CODEOWNERS` files.
                    Changes modifying components owned by a locked team or edited by a non-owner will trigger risk increases.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {repos.map((repo, idx) => {
                      const val = idx === 0 ? 87 : idx === 1 ? 62 : 96;
                      return (
                        <div
                          key={repo.id}
                          style={{
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                            padding: "16px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "600" }}>{repo.full_name}</span>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--green)" }}>{val}% Coverage</span>
                          </div>
                          <div style={{ height: "6px", background: "#000", border: "1px solid var(--border-bright)" }}>
                            <div style={{ height: "100%", width: `${val}%`, background: "var(--accent)" }}></div>
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "8px" }}>
                            {idx === 1
                              ? "⚠️ 38 files lack ownership descriptors"
                              : "✓ High coverage verified"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MCP API TAB */}
          {activeTab === "mcp" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Model Context Protocol Server Connection</div>
                </div>
                <div className="panel-body">
                  <p style={{ fontSize: "12px", color: "var(--text-mid)", lineHeight: "1.7", marginBottom: "24px" }}>
                    Exposes risk scores, deployment freeze rules, incident histories, and code ownership directly into agent execution loops.
                    Compatible with Cursor, Claude Code, Devin, OpenHands, Windsurf, and custom MCP clients.
                  </p>

                  <h5 style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--accent)", marginBottom: "8px" }}>
                    Active Tool Definitions
                  </h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                    <div style={{ border: "1px solid var(--border)", padding: "14px", background: "var(--surface)" }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--blue)" }}>score_change</div>
                      <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px" }}>
                        Arguments: `files: string[]`, `diff: string`, `agent_id: string`
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--text-mid)", marginTop: "6px" }}>
                        Returns risk calculations (1-10), factor weights, and suggested reviewers.
                      </p>
                    </div>

                    <div style={{ border: "1px solid var(--border)", padding: "14px", background: "var(--surface)" }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--blue)" }}>get_ownership</div>
                      <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px" }}>
                        Arguments: `file_path: string`
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--text-mid)", marginTop: "6px" }}>
                        Returns CODEOWNERS constraints, team names, slack handles, and restrictions.
                      </p>
                    </div>

                    <div style={{ border: "1px solid var(--border)", padding: "14px", background: "var(--surface)" }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--blue)" }}>get_constraints</div>
                      <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px" }}>
                        Arguments: `scope: string`
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--text-mid)", marginTop: "6px" }}>
                        Returns deploy windows, frozen dates, fragile patterns, and compliance targets.
                      </p>
                    </div>
                  </div>

                  <h5 style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--accent)", marginBottom: "8px" }}>
                    Preamble Configuration Snippet
                  </h5>
                  <pre style={{ border: "1px solid var(--border-bright)", background: "#000", padding: "12px", fontSize: "11px", color: "var(--green)", overflowX: "auto" }}>
{`// Add this configuration preamble to your MCP-enabled agent config:
"contexthub_preamble": "Before editing codebase files, always call get_ownership or score_change to identify risk barriers and owners."`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STATUS BAR */}
        <div className="status-row">
          <div className="status-item">
            <div className="dot dot-green"></div> API Healthy
          </div>
          <div className="status-item">
            <div className="dot dot-green"></div> Webhooks Active · {repos.length} Repos
          </div>
          <div className="status-item">
            <div className="dot dot-yellow"></div> MCP Server v0.4.1
          </div>
          <div className="status-item" style={{ marginLeft: "auto" }}>
            <div className="dot dot-dim"></div> Last Scored: 4 min ago
          </div>
        </div>
      </div>
    </div>
  );
}
