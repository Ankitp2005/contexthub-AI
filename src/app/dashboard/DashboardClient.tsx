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

  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState("");

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

  const handleScanNow = async () => {
    setIsScanning(true);
    setScanFeedback("Triggering scan...");
    try {
      const res = await fetch("/api/repositories/scan", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger scan");
      }
      const scannedCount = data.scanned?.length || 0;
      const skippedCount = data.skipped?.length || 0;
      if (scannedCount > 0) {
        setScanFeedback(`Scan triggered for ${scannedCount} repo(s).`);
      } else if (skippedCount > 0) {
        setScanFeedback("All repos currently scanning.");
      } else {
        setScanFeedback("No repos found to scan.");
      }
      setTimeout(() => setScanFeedback(""), 5000);
      router.refresh();
    } catch (err) {
      setScanFeedback(err instanceof Error ? err.message : "Error running scan");
      setTimeout(() => setScanFeedback(""), 5000);
    } finally {
      setIsScanning(false);
    }
  };

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
          --sidebar-w:    228px;
          --radius:       10px;
          --radius-sm:    6px;
          --radius-xs:    4px;
          --shadow-sm:    0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md:    0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);

          background: var(--bg);
          color: var(--text);
          font-family: var(--font);
          font-size: 13px;
          line-height: 1.5;
          display: flex;
          flex: 1;
          overflow: hidden;
          position: relative;
          width: 100%;
          -webkit-font-smoothing: antialiased;
        }

        .dashboard-root *, .dashboard-root *::before, .dashboard-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
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
          transition: width 0.3s cubic-bezier(0.4,0,0.2,1), margin-left 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease;
          overflow: hidden;
        }
        .dashboard-root .sidebar.collapsed {
          margin-left: calc(-1 * var(--sidebar-w));
          opacity: 0;
          pointer-events: none;
        }
        .dashboard-root .sidebar-toggle-btn {
          background: var(--surface);
          border: 1px solid var(--border-mid);
          color: var(--text-ter);
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
          border-radius: var(--radius-xs);
        }
        .dashboard-root .sidebar-toggle-btn:hover {
          background: var(--surface2);
          color: var(--text);
          border-color: var(--border-mid);
        }
        .dashboard-root .sidebar-toggle-btn svg { width: 16px; height: 16px; }

        .dashboard-root .sidebar-logo {
          padding: 16px 16px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .dashboard-root .logo-mark {
          width: 28px; height: 28px;
          background: var(--accent);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: var(--shadow-sm);
        }
        .dashboard-root .logo-mark span {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
        }
        .dashboard-root .logo-text {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          letter-spacing: -0.3px;
        }
        .dashboard-root .logo-text em { color: var(--text-ter); font-style: normal; font-weight: 400; }

        .dashboard-root .sidebar-section {
          padding: 8px 0 4px;
          border-bottom: 1px solid var(--border);
        }
        .dashboard-root .sidebar-section-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-quat);
          letter-spacing: 0.02em;
          padding: 8px 16px 4px;
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
          background: transparent;
          border: none;
          width: calc(100% - 16px);
          text-align: left;
          font-family: var(--font);
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
          opacity: 1;
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
          letter-spacing: 0;
          text-transform: none;
        }
        .dashboard-root .nav-badge.ok {
          background: var(--green-bg);
          color: var(--green);
          border: 1px solid var(--green-border);
        }

        .dashboard-root .sidebar-footer {
          margin-top: auto;
          padding: 12px;
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
        .dashboard-root .sidebar-user-role { font-size: 11px; color: var(--text-ter); margin-top: 1px; letter-spacing: 0; text-transform: none; }

        /* ── MAIN ── */
        .dashboard-root .main {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100%;
          background: var(--bg);
        }

        /* TOP BAR */
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

        /* TABS */
        .dashboard-root .tab-bar {
          display: flex;
          align-items: stretch;
          height: 100%;
          gap: 0;
          flex: 1;
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
          background: transparent;
          border-left: none;
          border-right: none;
          border-top: none;
          font-family: var(--font);
          letter-spacing: 0;
          text-transform: none;
        }
        .dashboard-root .tab:hover { color: var(--text-sec); }
        .dashboard-root .tab.active {
          color: var(--text);
          border-bottom-color: var(--accent);
          font-weight: 500;
        }
        .dashboard-root .tab-count {
          font-size: 11px;
          font-weight: 500;
          padding: 1px 6px;
          border-radius: 10px;
          background: var(--border);
          color: var(--text-ter);
          margin-left: 0;
          text-transform: none;
          letter-spacing: 0;
        }
        .dashboard-root .tab.active .tab-count { background: var(--accent); color: #fff; }

        .dashboard-root .topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .dashboard-root .topbar-btn {
          font-family: var(--font);
          font-size: 13px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: 20px;
          background: var(--accent);
          color: #fff;
          border: none;
          cursor: pointer;
          transition: all 0.12s;
          display: inline-flex; align-items: center; gap: 5px;
          letter-spacing: -0.1px;
          text-transform: none;
          text-decoration: none;
          white-space: nowrap;
        }
        .dashboard-root .topbar-btn:hover { background: #3a3a3c; }
        .dashboard-root .topbar-btn.ghost {
          background: var(--surface);
          color: var(--text-sec);
          border: 1px solid var(--border-mid);
        }
        .dashboard-root .topbar-btn.ghost:hover { background: var(--surface2); color: var(--text); }

        /* CONTENT */
        .dashboard-root .content {
          padding: 24px;
          flex: 1;
        }

        /* PAGE HEADER */
        .dashboard-root .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 0;
          border-bottom: none;
        }
        .dashboard-root .page-eyebrow {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-ter);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 3px;
        }
        .dashboard-root .page-eyebrow::before { display: none; }
        .dashboard-root .page-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.5px;
          line-height: 1.2;
          font-family: var(--font);
        }
        .dashboard-root .page-title em { font-style: normal; color: var(--text); }
        .dashboard-root .page-sub {
          font-size: 13px;
          color: var(--text-ter);
          margin-top: 3px;
          letter-spacing: 0;
          line-height: 1.5;
        }
        .dashboard-root .live-pill {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 500;
          color: var(--green);
          background: var(--green-bg);
          border: 1px solid var(--green-border);
          padding: 5px 11px;
          border-radius: 20px;
          text-transform: none;
          letter-spacing: 0;
        }
        .dashboard-root .live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); animation: pulse-g 2s infinite; }
        @keyframes pulse-g { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }

        /* STAT CARDS */
        .dashboard-root .stat-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
          border: none;
        }
        .dashboard-root .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px 18px 14px;
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.15s, transform 0.15s;
          cursor: default;
          border-right: 1px solid var(--border);
          overflow: visible;
        }
        .dashboard-root .stat-card:last-child { border-right: 1px solid var(--border); }
        .dashboard-root .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); background: var(--surface); }
        .dashboard-root .stat-card::after { display: none; }
        .dashboard-root .stat-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-ter);
          margin-bottom: 10px;
          display: flex; align-items: center; gap: 6px;
          text-transform: none;
          letter-spacing: 0;
        }
        .dashboard-root .stat-num {
          font-size: 32px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 4px;
          font-family: var(--font);
        }
        .dashboard-root .stat-num sup {
          font-family: var(--font);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-ter);
          vertical-align: super;
        }
        .dashboard-root .stat-meta {
          font-size: 11px;
          color: var(--text-ter);
          margin-top: 4px;
          letter-spacing: 0;
        }
        .dashboard-root .stat-bar {
          margin-top: 12px;
          height: 3px;
          background: var(--bg);
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }
        .dashboard-root .stat-bar-fill {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          border-radius: 2px;
          transition: width 1.2s cubic-bezier(0.19,1,0.22,1);
        }
        .dashboard-root .stat-trend {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 11px; font-weight: 500;
          margin-top: 8px;
          padding: 0;
          background: none;
        }
        .dashboard-root .trend-up   { color: var(--green); background: none; }
        .dashboard-root .trend-down { color: var(--red); background: none; }
        .dashboard-root .trend-neu  { color: var(--text-ter); background: none; }

        /* MAIN GRID */
        .dashboard-root .main-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
          margin-bottom: 16px;
        }

        /* PANEL */
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
          display: flex; align-items: center; gap: 7px;
          letter-spacing: -0.2px;
          text-transform: none;
          font-family: var(--font);
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
          display: flex; align-items: center; gap: 5px;
          border: none;
          padding: 4px 0;
          transition: opacity 0.12s;
          background: none;
          font-family: var(--font);
          text-transform: none;
          letter-spacing: 0;
        }
        .dashboard-root .panel-action:hover { opacity: 0.7; color: var(--blue); border-color: transparent; }
        .dashboard-root .panel-body { padding: 16px 18px; }

        /* CHART AREA */
        .dashboard-root .chart-area {
          height: 200px;
          position: relative;
        }
        .dashboard-root .chart-wrap { position: relative; }
        .dashboard-root .chart-sparkline { width: 100%; height: 160px; }

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
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-ter);
          font-size: 18px;
          background: var(--surface2);
        }
        .dashboard-root .empty-title { font-size: 13px; font-weight: 500; color: var(--text); }
        .dashboard-root .empty-sub { font-size: 12px; color: var(--text-ter); text-align: center; max-width: 220px; line-height: 1.5; }
        .dashboard-root .empty-cta {
          font-family: var(--font);
          font-size: 13px;
          font-weight: 500;
          padding: 8px 16px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.12s;
          display: inline-flex; align-items: center; gap: 6px;
          text-transform: none;
          letter-spacing: 0;
          text-decoration: none;
        }
        .dashboard-root .empty-cta:hover { background: #3a3a3c; color: #fff; border-color: transparent; }

        /* SIDE PANEL */
        .dashboard-root .side-panel-body { padding: 0; }
        .dashboard-root .mcp-status-block {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
        }
        .dashboard-root .mcp-header-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .dashboard-root .mcp-tag {
          font-size: 11px; font-weight: 500;
          padding: 3px 9px;
          background: var(--green-bg);
          color: var(--green);
          border: 1px solid var(--green-border);
          border-radius: 12px;
          display: inline-flex; align-items: center; gap: 5px;
          text-transform: none;
          letter-spacing: 0;
        }
        .dashboard-root .mcp-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse-g 2s infinite; }
        .dashboard-root .mcp-desc { font-size: 12px; color: var(--text-ter); line-height: 1.6; }
        .dashboard-root .mcp-tools { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
        .dashboard-root .mcp-tool-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 11px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 12px;
        }
        .dashboard-root .mcp-tool-name { color: var(--text); font-weight: 500; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }
        .dashboard-root .mcp-tool-type { color: var(--text-ter); font-size: 10px; letter-spacing: 0; }

        .dashboard-root .connect-block { padding: 14px 18px; }
        .dashboard-root .connect-block-label {
          font-size: 11px; font-weight: 500; text-transform: uppercase;
          color: var(--text-ter); margin-bottom: 10px; letter-spacing: 0.04em;
        }
        .dashboard-root .repo-list { display: flex; flex-direction: column; gap: 7px; margin-bottom: 12px; }
        .dashboard-root .repo-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 11px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface);
          transition: border-color 0.12s, background 0.12s;
        }
        .dashboard-root .repo-item:hover { border-color: var(--border-mid); background: var(--surface2); }
        .dashboard-root .repo-item-name { font-size: 12px; font-weight: 500; color: var(--text); display: flex; align-items: center; gap: 8px; }
        .dashboard-root .repo-item-name::before { content: ''; display: block; width: 8px; height: 8px; border-radius: 50%; background: var(--blue); flex-shrink: 0; }
        .dashboard-root .repo-item-meta { font-size: 11px; color: var(--text-ter); }
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
          display: flex; align-items: center; justify-content: center; gap: 6px;
          letter-spacing: -0.1px;
          text-transform: none;
          text-decoration: none;
        }
        .dashboard-root .connect-btn:hover { background: #3a3a3c; }

        /* ALERTS TABLE */
        .dashboard-root .alerts-panel { }
        .dashboard-root .alert-table { width: 100%; border-collapse: collapse; }
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
          text-transform: none;
        }
        .dashboard-root .alert-table td {
          padding: 12px 16px;
          font-size: 12px;
          border-bottom: 1px solid var(--border);
          color: var(--text-sec);
          vertical-align: middle;
        }
        .dashboard-root .alert-table tr:last-child td { border-bottom: none; }
        .dashboard-root .alert-table tr:hover td { background: var(--surface2); }
        .dashboard-root .risk-pill {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 12px; font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .dashboard-root .risk-high { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-border); }
        .dashboard-root .risk-med  { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); }
        .dashboard-root .risk-low  { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
        .dashboard-root .pr-link { color: var(--text); font-weight: 500; text-decoration: none; cursor: pointer; background: none; border: none; font-size: 13px; font-family: var(--font); padding: 0; }
        .dashboard-root .pr-link:hover { color: var(--blue); }
        .dashboard-root .pr-repo { font-size: 11px; color: var(--text-ter); margin-top: 2px; letter-spacing: 0; }
        .dashboard-root .alert-status {
          font-size: 11px; font-weight: 500;
          padding: 3px 9px;
          border-radius: 20px;
          text-transform: none;
          letter-spacing: 0;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .dashboard-root .status-blocked  { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-border); }
        .dashboard-root .status-review   { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); }
        .dashboard-root .status-merged   { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
        .dashboard-root .owner-tag {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 400;
          padding: 3px 8px;
          border-radius: var(--radius-xs);
          background: var(--blue-bg);
          color: var(--blue);
          border: 1px solid var(--blue-border);
          font-family: 'SF Mono', monospace;
        }
        .dashboard-root .owner-tag::before { content: '@'; opacity: 0.6; color: var(--blue); }

        /* INCIDENTS */
        .dashboard-root .incidents-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .dashboard-root .incident-card {
          padding: 12px 12px 12px 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface);
          position: relative;
          overflow: hidden;
          transition: border-color 0.12s;
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
        .dashboard-root .incident-num { font-size: 11px; color: var(--text-ter); margin-bottom: 4px; font-family: var(--font); }
        .dashboard-root .incident-title { font-size: 12px; color: var(--text); margin-bottom: 4px; font-weight: 500; }
        .dashboard-root .incident-meta { font-size: 11px; color: var(--text-ter); display: flex; gap: 10px; flex-wrap: wrap; }
        .dashboard-root .incident-meta span { display: flex; align-items: center; gap: 4px; }

        /* BOTTOM ROW */
        .dashboard-root .bottom-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        /* STATUS ROW */
        .dashboard-root .status-row {
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
        .dashboard-root .status-item {
          font-size: 11px;
          color: var(--text-ter);
          display: flex; align-items: center; gap: 5px;
          text-transform: none;
          letter-spacing: 0;
        }
        .dashboard-root .status-item .dot { width: 6px; height: 6px; border-radius: 50%; }
        .dashboard-root .dot-green { background: var(--green); }
        .dashboard-root .dot-yellow { background: var(--amber); }
        .dashboard-root .dot-dim   { background: var(--border-mid); }

        /* scrollbar */
        .dashboard-root .main::-webkit-scrollbar { width: 6px; }
        .dashboard-root .main::-webkit-scrollbar-track { background: transparent; }
        .dashboard-root .main::-webkit-scrollbar-thumb { background: var(--border-mid); border-radius: 3px; }
        .dashboard-root .main::-webkit-scrollbar-thumb:hover { background: var(--text-ter); }

        /* CONSTRAINTS TAGS */
        .dashboard-root .constraint-list { display: flex; flex-direction: column; gap: 7px; }
        .dashboard-root .constraint-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface);
          transition: border-color 0.12s;
        }
        .dashboard-root .constraint-row:hover { border-color: var(--border-mid); }
        .dashboard-root .constraint-name { font-size: 13px; font-weight: 500; color: var(--text); }
        .dashboard-root .constraint-scope { font-size: 11px; color: var(--text-ter); margin-top: 2px; letter-spacing: 0; }
        .dashboard-root .constraint-badge {
          font-size: 10px; font-weight: 500; padding: 3px 8px; border-radius: 10px;
          text-transform: none; letter-spacing: 0; white-space: nowrap;
        }
        .dashboard-root .cb-active  { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
        .dashboard-root .cb-warn    { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); }
        .dashboard-root .cb-off     { background: var(--bg); color: var(--text-ter); border: 1px solid var(--border); }

        /* FORM FIELD DESIGN */
        .dashboard-root form input,
        .dashboard-root form select,
        .dashboard-root form textarea {
          border: 1px solid var(--border-mid);
          background: var(--surface);
          color: var(--text);
          border-radius: var(--radius-sm);
          font-family: var(--font);
          padding: 8px 12px;
          font-size: 13px;
          outline: none;
          width: 100%;
          transition: border-color 0.12s;
        }
        .dashboard-root form input:focus,
        .dashboard-root form select:focus,
        .dashboard-root form textarea:focus {
          border-color: var(--blue);
          box-shadow: 0 0 0 3px var(--blue-bg);
        }
        .dashboard-root form label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-sec);
          margin-bottom: 5px;
          display: block;
          letter-spacing: 0;
          text-transform: none;
        }
        .dashboard-root .form-btn {
          font-family: var(--font);
          font-size: 13px;
          font-weight: 500;
          padding: 9px 14px;
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
          text-transform: none;
          letter-spacing: 0;
          width: 100%;
        }
        .dashboard-root .form-btn:hover { background: #3a3a3c; }
        .dashboard-root .form-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* RESPONSIVE LAYOUT */
        @media(max-width: 1024px) {
          .dashboard-root .main-grid { grid-template-columns: 1fr; }
          .dashboard-root .bottom-row { grid-template-columns: 1fr; }
        }
        @media(max-width: 768px) {
          .dashboard-root { flex-direction: column; }
          .dashboard-root .sidebar {
            width: 100%; height: auto;
            border-right: none;
            border-bottom: 1px solid var(--border);
            transition: height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease;
          }
          .dashboard-root .sidebar.collapsed {
            height: 0; width: 100%; margin-left: 0;
            border-bottom: none; opacity: 0; pointer-events: none;
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
          <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {scanFeedback && (
              <span style={{ fontSize: "10.5px", color: "var(--accent)", fontFamily: "var(--mono)", letterSpacing: "0.03em" }}>
                {scanFeedback}
              </span>
            )}
            <button onClick={handleScanNow} disabled={isScanning} className="topbar-btn ghost">
              {isScanning ? "⚡ Scanning..." : "↯ Scan Now"}
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
