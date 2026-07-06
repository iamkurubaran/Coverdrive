// Coverdrive rating engine — maps public GitHub signals onto a cricket
// scouting report: six headline attributes, an overall out of 99, a tier,
// a playing role, playstyle badges, scouting metrics, and a
// Cricinfo-style career-statistics table across Test / ODI / T20 "formats".

import { flagForLocation } from "./country.js";

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Squash a raw value into a 40–99 band with diminishing returns.
function band(value, softCap, floor = 40) {
  const scaled = floor + (99 - floor) * (1 - Math.exp(-value / softCap));
  return Math.max(floor, Math.min(99, Math.round(scaled)));
}

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${n}`;
}

function tallyLanguages(repos) {
  const counts = {};
  for (const r of repos) {
    if (r.language) counts[r.language] = (counts[r.language] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
}

function starsFrom(score) {
  return Math.max(1, Math.min(5, Math.round(score / 20)));
}

// ---------------------------------------------------------------------------

export function buildCard(user, repos, events, contributions = null) {
  const originals = repos.filter((r) => !r.fork);
  const totalStars = originals.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const totalForks = originals.reduce((s, r) => s + (r.forks_count || 0), 0);
  const topRepo = originals
    .slice()
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))[0];
  const topRepoStars = topRepo?.stargazers_count || 0;
  const languages = tallyLanguages(repos);
  const originalCount = originals.length;
  const accountYears = (Date.now() - new Date(user.created_at).getTime()) / YEAR_MS;

  const pushEvents = events.filter((e) => e.type === "PushEvent");
  const eventCommits = pushEvents.reduce(
    (s, e) => s + (e.payload?.commits?.length || 0),
    0
  );
  const issueCount = events.filter((e) => e.type === "IssuesEvent").length;
  const reviewCount = events.filter(
    (e) => e.type === "PullRequestReviewEvent"
  ).length;
  const prCount = events.filter((e) => e.type === "PullRequestEvent").length;

  // The contribution calendar (full year, always populated for active users)
  // is a far stronger signal than the public events feed, which only covers
  // ~90 days and misses much activity. Prefer it when available.
  const yearContribs = contributions?.total ?? null;
  const commitCount = Math.max(eventCommits, yearContribs ?? 0);
  const recentActivity =
    yearContribs != null ? Math.round(yearContribs / 4) : events.length;

  // ---- Six headline attributes (cricket batting order) ----
  const attributes = {
    BAT: band(totalStars, 120),        // Batting   — impact at the crease (stars)
    BWL: band(originalCount, 25),      // Bowling   — wickets taken (originals shipped)
    FLD: band(totalForks, 40),         // Fielding  — reach in the field (forks)
    TEC: band(languages.length, 6),    // Technique — range of shots (languages)
    EXP: band(accountYears, 6),        // Experience— years in the game
    STA:
      yearContribs != null
        ? band(yearContribs, 500)      // Stamina   — contributions this year
        : band(events.length, 60),     //            (fallback: recent events)
  };
  const overall = Math.round(
    Object.values(attributes).reduce((a, b) => a + b, 0) / 6
  );

  // ---- Scouting metrics (detailed bar list) ----
  const metrics = [
    {
      label: "Commits",
      detail:
        yearContribs != null
          ? `${fmt(yearContribs)} this year`
          : `${fmt(eventCommits)} commits`,
      score: yearContribs != null ? band(yearContribs, 500) : band(eventCommits, 40),
    },
    { label: "Stars earned", detail: `${fmt(totalStars)} stars`, score: band(totalStars, 120) },
    { label: "Highest score", detail: `${fmt(topRepoStars)} stars`, score: band(topRepoStars, 90) },
    { label: "Followers", detail: `${fmt(user.followers)} followers`, score: band(user.followers, 200) },
    { label: "Languages", detail: `${languages.length} languages`, score: band(languages.length, 6) },
    { label: "Issues", detail: `${issueCount} issues`, score: band(issueCount, 20) },
    { label: "Reviews", detail: `${reviewCount} reviews`, score: band(reviewCount, 15) },
    { label: "Repos shipped", detail: `${originalCount} originals`, score: band(originalCount, 25) },
  ];

  return {
    username: user.login,
    name: user.name || user.login,
    avatar: user.avatar_url,
    bio: user.bio,
    location: user.location,
    country: flagForLocation(user.location),
    company: user.company,
    followers: user.followers,
    publicRepos: user.public_repos,
    profileUrl: user.html_url,
    totalStars,
    languages,
    topLanguage: languages[0] || "Polyglot",
    attributes,
    overall,
    tier: tierFor(overall),
    role: roleFor(attributes),
    format: formatFor(attributes),
    trait: traitFor(overall, attributes),
    metrics,
    shotRange: starsFrom(band(languages.length + originalCount / 4, 8)),
    reverseSweep: starsFrom(band(languages.length, 5)),
    workRate: workRateFrom(recentActivity, originalCount),
    style: styleFor(attributes),
    playstyles: playstylesFor({
      followers: user.followers,
      totalStars,
      topRepoStars,
      accountYears,
      recentActivity,
      originalCount,
      languageCount: languages.length,
    }),
    career: careerTable(originals, {
      commitCount,
      issueCount,
      prCount,
      totalForks,
      accountYears,
    }),
    heatmap: contributions, // { total, weeks: [[{date,count,level}|null x7]] } | null
  };
}

// ---- Tiers -----------------------------------------------------------------

function tierFor(overall) {
  if (overall >= 90) return { name: "LEGEND", accent: "#e8c766", glow: "#f4d97a" };
  if (overall >= 82) return { name: "PLATINUM", accent: "#c7d0da", glow: "#e4ecf5" };
  if (overall >= 74) return { name: "GOLD", accent: "#d0a94b", glow: "#e6c568" };
  if (overall >= 64) return { name: "SILVER", accent: "#9aa4ad", glow: "#c2ccd6" };
  return { name: "BRONZE", accent: "#b07a4a", glow: "#cf9a63" };
}

// ---- Role (from the top attribute) ------------------------------------------

function roleFor(attributes) {
  const top = Object.entries(attributes).sort((a, b) => b[1] - a[1])[0][0];
  return {
    BAT: { abbr: "OP", name: "Opening Batter" },
    BWL: { abbr: "FB", name: "Fast Bowler" },
    FLD: { abbr: "WK", name: "Wicketkeeper" },
    TEC: { abbr: "AR", name: "All-Rounder" },
    EXP: { abbr: "CAP", name: "Captain" },
    STA: { abbr: "FIN", name: "Finisher" },
  }[top];
}

// ---- Preferred format --------------------------------------------------------

function formatFor(attributes) {
  if (attributes.STA >= 80 && attributes.BAT >= 80) return "T20";
  if (attributes.EXP >= 80) return "TEST";
  return "ODI";
}

// ---- Scout's trait line ------------------------------------------------------

function traitFor(overall, attributes) {
  if (overall >= 90)
    return {
      tag: "GENERATIONAL TALENT",
      note: "match-winner across every format; walks into the World XI.",
    };
  if (attributes.BAT >= 85)
    return {
      tag: "CROWD PULLER",
      note: "big-innings specialist whose stars pack the stands.",
    };
  if (attributes.BWL >= 85)
    return {
      tag: "WICKET MACHINE",
      note: "ships originals relentlessly; breakthroughs on demand.",
    };
  if (attributes.EXP >= 80)
    return {
      tag: "SEASONED PRO",
      note: "years at the crease; reads the game better than most.",
    };
  return {
    tag: "RISING PROSPECT",
    note: "raw talent with room to grow into the top order.",
  };
}

function workRateFrom(recentActivity, originalCount) {
  const bat = recentActivity > 40 ? "HIGH" : recentActivity > 15 ? "MED" : "LOW";
  const field = originalCount > 20 ? "HIGH" : originalCount > 8 ? "MED" : "LOW";
  return `${bat} / ${field}`;
}

function styleFor(attributes) {
  const top = Object.entries(attributes).sort((a, b) => b[1] - a[1])[0][0];
  return {
    BAT: "AGGRESSOR",
    BWL: "ENFORCER",
    FLD: "ACROBAT",
    TEC: "VERSATILE",
    EXP: "ANCHOR",
    STA: "RELENTLESS",
  }[top];
}

// ---- Playstyle badges --------------------------------------------------------

function playstylesFor(s) {
  return [
    { key: "Crowd Puller", icon: "users", earned: s.followers >= 500 },
    { key: "Star Magnet", icon: "star", earned: s.totalStars >= 1000 },
    { key: "Six Machine", icon: "flame", earned: s.topRepoStars >= 5000 },
    { key: "Marathon Innings", icon: "infinity", earned: s.accountYears >= 8 },
    { key: "Rapid Fire", icon: "forward", earned: s.recentActivity >= 50 },
    { key: "Veteran", icon: "clock", earned: s.accountYears >= 5 },
    { key: "Workhorse", icon: "bolt", earned: s.originalCount >= 20 },
    { key: "All-Rounder", icon: "globe", earned: s.languageCount >= 6 },
  ];
}

// ---- Cricinfo-style career statistics ----------------------------------------
// "Formats" are recency buckets over original repos:
//   T20  — repos pushed in the last 90 days   (short form, current)
//   ODI  — repos pushed in the last 12 months (middle form)
//   Test — everything, all-time               (long form)
// Batting maps: Mat = repos · Runs = stars · HS = top repo · Ave = runs/mat ·
// SR = stars per year on the account · 100s/50s = repos over those star marks ·
// 6s = repos ≥ 1k stars · Ct = forks caught.

function careerTable(originals, extra) {
  const now = Date.now();
  const inWindow = (r, days) =>
    days == null || now - new Date(r.pushed_at || r.created_at).getTime() <= days * DAY_MS;

  function rowFor(label, days) {
    const bucket = originals.filter((r) => inWindow(r, days));
    const mat = bucket.length;
    const runs = bucket.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    const top = bucket
      .slice()
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))[0];
    const hsVal = top?.stargazers_count || 0;
    const hs = hsVal ? `${fmt(hsVal)}${top && !top.archived ? "*" : ""}` : "-";
    const ave = mat ? (runs / mat).toFixed(1) : "-";
    const years = Math.max(0.25, extra.accountYears);
    const sr = runs ? (runs / years).toFixed(1) : "-";
    const hundreds = bucket.filter((r) => (r.stargazers_count || 0) >= 100).length;
    const fifties = bucket.filter(
      (r) => (r.stargazers_count || 0) >= 50 && (r.stargazers_count || 0) < 100
    ).length;
    const sixes = bucket.filter((r) => (r.stargazers_count || 0) >= 1000).length;
    const ct = bucket.reduce((s, r) => s + (r.forks_count || 0), 0);
    return {
      format: label,
      mat,
      runs: fmt(runs),
      hs,
      ave,
      sr,
      hundreds,
      fifties,
      sixes,
      ct: fmt(ct),
    };
  }

  return {
    columns: ["Format", "Mat", "Runs", "HS", "Ave", "SR", "100s", "50s", "6s", "Ct"],
    rows: [rowFor("Tests", null), rowFor("ODIs", 365), rowFor("T20s", 90)],
    legend:
      "Mat = original repos · Runs = stars · HS = top repo (* = still batting) · " +
      "Ave = stars per repo · SR = stars per year · 100s/50s = repos past those " +
      "star marks · 6s = 1k+ star repos · Ct = forks caught",
  };
}
