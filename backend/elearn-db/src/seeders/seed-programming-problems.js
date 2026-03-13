/* eslint-disable no-console */
/**
 * Seed programming problems into elearn-db.
 *
 * Notes:
 * - We intentionally DO NOT copy LeetCode statements (copyright).
 *   Instead, we generate original problems inspired by classic patterns.
 * - elearn-fe renders math via `${...}` (react-katex) using FormattedDescription.
 *
 * Usage:
 *   node src/seeders/seed-programming-problems.js --mongo mongodb://127.18.0.2:27017/elearn-test --count 50 --author teacher01 --wipe
 *
 * Options:
 *   --mongo   Mongo URI (required)
 *   --count   number of problems to insert (default 50)
 *   --author  username in elearn-db to set as author (default: first user found)
 *   --wipe    if true, delete existing problems first
 *   --seed    deterministic seed integer (default 1337)
 */

require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");
const Problem = require("../models/Problem");

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith("--")) {
      args._.push(raw);
      continue;
    }
    const eq = raw.indexOf("=");
    if (eq > 0) {
      args[raw.slice(2, eq)] = raw.slice(eq + 1);
      continue;
    }
    const k = raw.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[k] = true;
    } else {
      args[k] = next;
      i += 1;
    }
  }
  return args;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, arr) {
  return arr[randInt(rng, 0, arr.length - 1)];
}

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = randInt(rng, 0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function normalizeOut(s) {
  return String(s ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function tc({ input, output, isHidden = false, points = 10, explanation = "" }) {
  return { input: String(input), output: normalizeOut(output), isHidden, points, explanation };
}

function latexConstraints(lines) {
  // IMPORTANT: elearn-fe renders ${...} patterns.
  return [
    "Constraints:",
    ...lines.map((l) => `- ${l}`),
  ].join("\n");
}

function makeHints(contents) {
  return contents
    .filter((c) => String(c).trim())
    .slice(0, 4)
    .map((content, idx) => ({
      level: idx + 1,
      content: String(content).trim(),
      cost: 0,
    }));
}

// -------------------------
// Problem generators
// Each generator returns { title, rank, description, tags, testCases, hints, supportedLanguages, languageTemplates, ... }
// -------------------------

function genTwoSum(rng) {
  const title = "Pair Sum Indices";
  const rank = "D";
  const tags = ["array", "hashmap", "leetcode:two-sum"];

  const description = [
    "Given an array of integers and a target, find two distinct indices i and j such that nums[i] + nums[j] = target.",
    "Output the indices in increasing order (0-based). If multiple answers exist, output any one.",
    "",
    "Input format:",
    "- Line 1: n target",
    "- Line 2: n integers",
    "Output format:",
    "- One line: i j",
    "",
    latexConstraints([
      "${2 \\le n \\le 2\\cdot 10^5}",
      "${-10^9 \\le nums[i] \\le 10^9}",
    ]),
  ].join("\n");

  function solve(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i += 1) {
      const need = target - nums[i];
      if (map.has(need)) return [map.get(need), i].sort((a, b) => a - b);
      map.set(nums[i], i);
    }
    return null;
  }

  const cases = [];
  for (let k = 0; k < 6; k += 1) {
    const n = randInt(rng, 6, 14);
    const nums = Array.from({ length: n }, () => randInt(rng, -20, 30));
    const i = randInt(rng, 0, n - 1);
    let j = randInt(rng, 0, n - 1);
    while (j === i) j = randInt(rng, 0, n - 1);
    const target = nums[i] + nums[j];
    const ans = solve(nums, target);
    const input = `${n} ${target}\n${nums.join(" ")}\n`;
    const output = ans ? `${ans[0]} ${ans[1]}` : "";
    cases.push(
      tc({
        input,
        output,
        isHidden: k >= 4,
        explanation:
          k < 2
            ? `One valid pair exists because ${nums[i]} + ${nums[j]} = ${target}.`
            : "",
      })
    );
  }

  return {
    title,
    rank,
    description,
    tags,
    testCases: cases,
    hints: makeHints([
      "Try scanning once while remembering previously seen numbers.",
      "A hash map from value -> index lets you check if (target - current) appeared before.",
      "Be careful to use distinct indices.",
    ]),
  };
}

function genValidParentheses(rng) {
  const title = "Balanced Brackets";
  const rank = "D";
  const tags = ["stack", "string", "leetcode:valid-parentheses"];
  const description = [
    "You are given a string s consisting only of the characters ()[]{}.",
    "Return true if the brackets are balanced and properly nested, otherwise return false.",
    "",
    "Input format:",
    "- One line: s",
    "Output format:",
    "- true or false",
    "",
    latexConstraints([
      "${1 \\le |s| \\le 2\\cdot 10^5}",
    ]),
  ].join("\n");

  function solve(s) {
    const st = [];
    const m = { ")": "(", "]": "[", "}": "{" };
    for (const ch of s) {
      if (ch === "(" || ch === "[" || ch === "{") st.push(ch);
      else {
        if (st.length === 0) return false;
        const top = st.pop();
        if (top !== m[ch]) return false;
      }
    }
    return st.length === 0;
  }

  const pool = [
    "()",
    "()[]{}",
    "(]",
    "([)]",
    "{[]}",
    "(((())))",
    "({[()]})",
    "(((",
    "){",
  ];
  const cases = shuffle(rng, pool)
    .slice(0, 7)
    .map((s, idx) =>
      tc({
        input: `${s}\n`,
        output: solve(s) ? "true" : "false",
        isHidden: idx >= 5,
        explanation:
          idx < 2
            ? "Maintain a stack of opening brackets and match when you see a closing bracket."
            : "",
      })
    );

  return {
    title,
    rank,
    description,
    tags,
    testCases: cases,
    hints: makeHints([
      "Scan left to right and use a stack for open brackets.",
      "Each closing bracket must match the most recent unmatched opening bracket.",
      "At the end, the stack must be empty.",
    ]),
  };
}

function genMaxSubarray(rng) {
  const title = "Maximum Subarray Sum";
  const rank = "C";
  const tags = ["dp", "array", "leetcode:maximum-subarray"];

  const description = [
    "Given an integer array, find the maximum possible sum of a non-empty contiguous subarray.",
    "",
    "Input format:",
    "- Line 1: n",
    "- Line 2: n integers",
    "Output format:",
    "- One integer: maximum sum",
    "",
    latexConstraints([
      "${1 \\le n \\le 2\\cdot 10^5}",
      "${-10^4 \\le a[i] \\le 10^4}",
    ]),
  ].join("\n");

  function solve(arr) {
    let best = -Infinity;
    let cur = -Infinity;
    for (const x of arr) {
      cur = Math.max(x, cur + x);
      best = Math.max(best, cur);
    }
    return best;
  }

  const cases = [];
  for (let k = 0; k < 7; k += 1) {
    const n = randInt(rng, 5, 20);
    const arr = Array.from({ length: n }, () => randInt(rng, -20, 30));
    cases.push(
      tc({
        input: `${n}\n${arr.join(" ")}\n`,
        output: String(solve(arr)),
        isHidden: k >= 5,
        explanation: k === 0 ? "Use a running best-ending-here value (Kadane's algorithm)." : "",
      })
    );
  }

  return {
    title,
    rank,
    description,
    tags,
    testCases: cases,
    hints: makeHints([
      "Let dp[i] be the best subarray sum that ends at i.",
      "Transition: dp[i] = max(a[i], dp[i-1] + a[i]).",
      "The answer is max(dp[i]) over all i.",
    ]),
  };
}

function genBinarySearch(rng) {
  const title = "Lower Bound Search";
  const rank = "D";
  const tags = ["binary-search", "array", "leetcode:binary-search"];

  const description = [
    "Given a sorted (non-decreasing) array and a value x, find the smallest index i such that a[i] >= x.",
    "If no such index exists, output -1.",
    "",
    "Input format:",
    "- Line 1: n x",
    "- Line 2: n integers (sorted)",
    "Output format:",
    "- One integer: index",
    "",
    latexConstraints([
      "${1 \\le n \\le 2\\cdot 10^5}",
      "${-10^9 \\le a[i], x \\le 10^9}",
    ]),
  ].join("\n");

  function solve(arr, x) {
    let lo = 0;
    let hi = arr.length; // exclusive
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] >= x) hi = mid;
      else lo = mid + 1;
    }
    return lo === arr.length ? -1 : lo;
  }

  const cases = [];
  for (let k = 0; k < 7; k += 1) {
    const n = randInt(rng, 6, 30);
    const base = randInt(rng, -20, 5);
    const arr = Array.from({ length: n }, (_, i) => base + i + randInt(rng, 0, 2));
    arr.sort((a, b) => a - b);
    const x = pick(rng, [arr[0] - 3, arr[0], arr[n - 1], arr[n - 1] + 3, randInt(rng, -10, 40)]);
    cases.push(
      tc({
        input: `${n} ${x}\n${arr.join(" ")}\n`,
        output: String(solve(arr, x)),
        isHidden: k >= 5,
      })
    );
  }

  return {
    title,
    rank,
    description,
    tags,
    testCases: cases,
    hints: makeHints([
      "Maintain an invariant: answer is in [lo, hi).",
      "Move hi left when a[mid] is already >= x.",
      "Return -1 if lo runs out of bounds.",
    ]),
  };
}

function genGridPaths(rng) {
  const title = "Unique Paths in a Grid";
  const rank = "C";
  const tags = ["dp", "combinatorics", "leetcode:unique-paths"];
  const description = [
    "You are given two integers r and c (rows, columns).",
    "Starting at the top-left cell, you can only move Right or Down.",
    "Count how many distinct paths lead to the bottom-right cell.",
    "",
    "Input format:",
    "- One line: r c",
    "Output format:",
    "- One integer: number of paths",
    "",
    "Hint: the answer is a binomial coefficient ${\\binom{(r-1)+(c-1)}{r-1}} for small enough sizes.",
    latexConstraints([
      "${1 \\le r, c \\le 30}",
    ]),
  ].join("\n");

  function solve(r, c) {
    const dp = Array.from({ length: r }, () => Array(c).fill(0n));
    dp[0][0] = 1n;
    for (let i = 0; i < r; i += 1) {
      for (let j = 0; j < c; j += 1) {
        if (i === 0 && j === 0) continue;
        const up = i > 0 ? dp[i - 1][j] : 0n;
        const left = j > 0 ? dp[i][j - 1] : 0n;
        dp[i][j] = up + left;
      }
    }
    return dp[r - 1][c - 1].toString();
  }

  const cases = [];
  for (let k = 0; k < 7; k += 1) {
    const r = randInt(rng, 2, 10);
    const c = randInt(rng, 2, 10);
    cases.push(
      tc({
        input: `${r} ${c}\n`,
        output: solve(r, c),
        isHidden: k >= 5,
        explanation: k === 0 ? "Classic DP: dp[i][j] = dp[i-1][j] + dp[i][j-1]." : "",
      })
    );
  }

  return {
    title,
    rank,
    description,
    tags,
    testCases: cases,
    hints: makeHints([
      "Use DP on a grid: ways to reach a cell equals ways from top + ways from left.",
      "Initialize dp[0][0] = 1.",
      "If using combinatorics: choose where the Down moves occur.",
    ]),
  };
}

function genLISLength(rng) {
  const title = "Longest Increasing Subsequence Length";
  const rank = "B";
  const tags = ["dp", "binary-search", "leetcode:longest-increasing-subsequence"];
  const description = [
    "Given an integer array, compute the length of the longest strictly increasing subsequence (not necessarily contiguous).",
    "",
    "Input format:",
    "- Line 1: n",
    "- Line 2: n integers",
    "Output format:",
    "- One integer: LIS length",
    "",
    latexConstraints([
      "${1 \\le n \\le 2\\cdot 10^5}",
    ]),
  ].join("\n");

  function solve(arr) {
    const tails = [];
    for (const x of arr) {
      let lo = 0;
      let hi = tails.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (tails[mid] >= x) hi = mid;
        else lo = mid + 1;
      }
      tails[lo] = x;
    }
    return tails.length;
  }

  const cases = [];
  for (let k = 0; k < 6; k += 1) {
    const n = randInt(rng, 10, 35);
    const arr = Array.from({ length: n }, () => randInt(rng, -10, 40));
    cases.push(tc({ input: `${n}\n${arr.join(" ")}\n`, output: String(solve(arr)), isHidden: k >= 4 }));
  }

  return {
    title,
    rank,
    description,
    tags,
    testCases: cases,
    hints: makeHints([
      "O(n log n) approach: maintain an array `tails` where tails[k] is the minimum tail of an increasing subsequence of length k+1.",
      "For each number x, binary search the first tails[i] >= x and replace it.",
      "Answer is tails.length.",
    ]),
  };
}

function genBFSShortestPath(rng) {
  const title = "Shortest Path in an Unweighted Graph";
  const rank = "C";
  const tags = ["graph", "bfs", "leetcode:shortest-path-unweighted"];
  const description = [
    "Given an undirected unweighted graph with n nodes labeled 0..n-1, and two nodes s and t, compute the length of the shortest path from s to t.",
    "If unreachable, output -1.",
    "",
    "Input format:",
    "- Line 1: n m s t",
    "- Next m lines: u v (edge)",
    "Output format:",
    "- One integer: distance",
    "",
    latexConstraints([
      "${1 \\le n \\le 2\\cdot 10^5}",
      "${0 \\le m \\le 2\\cdot 10^5}",
    ]),
  ].join("\n");

  function solve(n, edges, s, t) {
    const g = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) {
      g[u].push(v);
      g[v].push(u);
    }
    const dist = Array(n).fill(-1);
    const q = [s];
    dist[s] = 0;
    for (let qi = 0; qi < q.length; qi += 1) {
      const u = q[qi];
      for (const v of g[u]) {
        if (dist[v] !== -1) continue;
        dist[v] = dist[u] + 1;
        q.push(v);
      }
    }
    return dist[t];
  }

  const cases = [];
  for (let k = 0; k < 6; k += 1) {
    const n = randInt(rng, 6, 12);
    const maxEdges = (n * (n - 1)) / 2;
    const m = randInt(rng, n - 1, clamp(maxEdges, n - 1, n + 10));
    const all = [];
    for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) all.push([i, j]);
    const edges = shuffle(rng, all).slice(0, m);
    const s = randInt(rng, 0, n - 1);
    let t = randInt(rng, 0, n - 1);
    while (t === s) t = randInt(rng, 0, n - 1);
    const out = solve(n, edges, s, t);
    const input = `${n} ${edges.length} ${s} ${t}\n${edges.map(([u, v]) => `${u} ${v}`).join("\n")}\n`;
    cases.push(tc({ input, output: String(out), isHidden: k >= 4 }));
  }

  return {
    title,
    rank,
    description,
    tags,
    testCases: cases,
    hints: makeHints([
      "Use BFS from s because edges are unweighted.",
      "Maintain a dist array initialized to -1.",
      "First time you visit a node is its shortest distance.",
    ]),
  };
}

function genMergeIntervals(rng) {
  const title = "Merge Overlapping Intervals";
  const rank = "C";
  const tags = ["sorting", "intervals", "leetcode:merge-intervals"];
  const description = [
    "You are given m closed intervals [l, r]. Merge all overlapping intervals and output the resulting set of disjoint intervals.",
    "",
    "Input format:",
    "- Line 1: m",
    "- Next m lines: l r",
    "Output format:",
    "- Line 1: k (number of merged intervals)",
    "- Next k lines: l r",
    "",
    latexConstraints([
      "${1 \\le m \\le 2\\cdot 10^5}",
      "${-10^9 \\le l \\le r \\le 10^9}",
    ]),
  ].join("\n");

  function solve(intervals) {
    const a = [...intervals].sort((x, y) => (x[0] - y[0]) || (x[1] - y[1]));
    const out = [];
    for (const [l, r] of a) {
      if (out.length === 0 || out[out.length - 1][1] < l) out.push([l, r]);
      else out[out.length - 1][1] = Math.max(out[out.length - 1][1], r);
    }
    return out;
  }

  const cases = [];
  for (let k = 0; k < 6; k += 1) {
    const m = randInt(rng, 5, 12);
    const intervals = [];
    for (let i = 0; i < m; i += 1) {
      const l = randInt(rng, -10, 20);
      const r = l + randInt(rng, 0, 10);
      intervals.push([l, r]);
    }
    const merged = solve(intervals);
    const input = `${m}\n${intervals.map(([l, r]) => `${l} ${r}`).join("\n")}\n`;
    const output = `${merged.length}\n${merged.map(([l, r]) => `${l} ${r}`).join("\n")}`.trim();
    cases.push(tc({ input, output, isHidden: k >= 4 }));
  }

  return {
    title,
    rank,
    description,
    tags,
    testCases: cases,
    hints: makeHints([
      "Sort intervals by starting point.",
      "Keep a current merged interval; if the next one overlaps, extend the end.",
      "Otherwise, push the current one and start a new interval.",
    ]),
  };
}

function genClimbStairs(rng) {
  const title = "Staircase Ways";
  const rank = "D";
  const tags = ["dp", "math", "leetcode:climbing-stairs"];
  const description = [
    "You are standing at step 0 of a staircase with n steps. Each move you can climb 1 or 2 steps.",
    "How many distinct ways are there to reach exactly step n?",
    "",
    "Input format:",
    "- One integer: n",
    "Output format:",
    "- One integer: number of ways",
    "",
    latexConstraints([
      "${0 \\le n \\le 90}",
    ]),
  ].join("\n");

  function solve(n) {
    let a = 1n; // ways(0)
    let b = 1n; // ways(1)
    if (n === 0) return "1";
    for (let i = 2; i <= n; i += 1) {
      const c = a + b;
      a = b;
      b = c;
    }
    return b.toString();
  }

  const cases = [];
  for (let k = 0; k < 7; k += 1) {
    const n = pick(rng, [0, 1, 2, 3, 5, 10, randInt(rng, 12, 40)]);
    cases.push(tc({ input: `${n}\n`, output: solve(n), isHidden: k >= 5 }));
  }

  return {
    title,
    rank,
    description,
    tags,
    testCases: cases,
    hints: makeHints([
      "This is Fibonacci: ways(n) = ways(n-1) + ways(n-2).",
      "Use iteration to avoid recursion overhead.",
      "Use 64-bit / BigInt for larger n.",
    ]),
  };
}

function genLongestSubstringNoRepeat(rng) {
  const title = "Longest Substring Without Repeating Characters";
  const rank = "C";
  const tags = ["two-pointers", "hashmap", "leetcode:longest-substring-without-repeating-characters"];
  const description = [
    "Given a string s, find the length of the longest substring with all distinct characters.",
    "",
    "Input format:",
    "- One line: s",
    "Output format:",
    "- One integer: max length",
    "",
    latexConstraints([
      "${1 \\le |s| \\le 2\\cdot 10^5}",
    ]),
  ].join("\n");

  function solve(s) {
    const last = new Map();
    let best = 0;
    let l = 0;
    for (let r = 0; r < s.length; r += 1) {
      const ch = s[r];
      if (last.has(ch)) l = Math.max(l, last.get(ch) + 1);
      last.set(ch, r);
      best = Math.max(best, r - l + 1);
    }
    return best;
  }

  const alpha = "abcdeffghijklmnopqrstuvxyz";
  const cases = [];
  for (let k = 0; k < 7; k += 1) {
    const len = randInt(rng, 6, 22);
    let s = "";
    for (let i = 0; i < len; i += 1) s += alpha[randInt(rng, 0, alpha.length - 1)];
    if (k === 0) s = "abcabcbb";
    if (k === 1) s = "bbbbb";
    cases.push(tc({ input: `${s}\n`, output: String(solve(s)), isHidden: k >= 5 }));
  }

  return {
    title,
    rank,
    description,
    tags,
    testCases: cases,
    hints: makeHints([
      "Use a sliding window with two pointers.",
      "Track the last index of each character to jump the left pointer forward.",
      "Maintain the best window length while expanding right.",
    ]),
  };
}

function genTopKFrequent(rng) {
  const title = "Top K Frequent Numbers";
  const rank = "C";
  const tags = ["hashmap", "sorting", "leetcode:top-k-frequent-elements"];
  const description = [
    "Given an integer array and an integer k, output the k numbers with the highest frequency.",
    "If there is a tie, output smaller numbers first. Output the answer as k integers on one line.",
    "",
    "Input format:",
    "- Line 1: n k",
    "- Line 2: n integers",
    "Output format:",
    "- One line: k integers",
    "",
    latexConstraints([
      "${1 \\le k \\le n \\le 2\\cdot 10^5}",
    ]),
  ].join("\n");

  function solve(nums, k) {
    const freq = new Map();
    for (const x of nums) freq.set(x, (freq.get(x) || 0) + 1);
    const entries = Array.from(freq.entries());
    entries.sort((a, b) => (b[1] - a[1]) || (a[0] - b[0]));
    return entries.slice(0, k).map(([x]) => x);
  }

  const cases = [];
  for (let t = 0; t < 6; t += 1) {
    const n = randInt(rng, 10, 30);
    const nums = Array.from({ length: n }, () => randInt(rng, -5, 8));
    const uniq = Array.from(new Set(nums));
    const k = randInt(rng, 1, Math.min(5, uniq.length));
    const ans = solve(nums, k);
    cases.push(
      tc({
        input: `${n} ${k}\n${nums.join(" ")}\n`,
        output: ans.join(" "),
        isHidden: t >= 4,
        explanation: t === 0 ? "Count frequencies then sort by (freq desc, value asc)." : "",
      })
    );
  }

  return {
    title,
    rank,
    description,
    tags,
    testCases: cases,
    hints: makeHints([
      "First count occurrences in a hash map.",
      "Sort unique values by frequency descending.",
      "For ties, sort by the value ascending to make output deterministic.",
    ]),
  };
}

function genNumberOfIslands(rng) {
  const title = "Count Islands";
  const rank = "B";
  const tags = ["graph", "dfs", "bfs", "leetcode:number-of-islands"];
  const description = [
    "Given a grid of '0' and '1' characters, count how many 4-directionally connected components of '1' exist (islands).",
    "",
    "Input format:",
    "- Line 1: r c",
    "- Next r lines: a string of length c (0/1)",
    "Output format:",
    "- One integer: number of islands",
    "",
    latexConstraints([
      "${1 \\le r,c \\le 50}",
    ]),
  ].join("\n");

  function solve(grid) {
    const r = grid.length;
    const c = grid[0].length;
    const seen = Array.from({ length: r }, () => Array(c).fill(false));
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    let cnt = 0;
    for (let i = 0; i < r; i += 1) {
      for (let j = 0; j < c; j += 1) {
        if (grid[i][j] !== "1" || seen[i][j]) continue;
        cnt += 1;
        const st = [[i, j]];
        seen[i][j] = true;
        while (st.length) {
          const [x, y] = st.pop();
          for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= r || ny < 0 || ny >= c) continue;
            if (seen[nx][ny] || grid[nx][ny] !== "1") continue;
            seen[nx][ny] = true;
            st.push([nx, ny]);
          }
        }
      }
    }
    return cnt;
  }

  const cases = [];
  for (let t = 0; t < 6; t += 1) {
    const r = randInt(rng, 5, 10);
    const c = randInt(rng, 5, 10);
    const grid = Array.from({ length: r }, () =>
      Array.from({ length: c }, () => (rng() < 0.35 ? "1" : "0")).join("")
    );
    const out = solve(grid);
    const input = `${r} ${c}\n${grid.join("\n")}\n`;
    cases.push(tc({ input, output: String(out), isHidden: t >= 4 }));
  }

  return {
    title,
    rank,
    description,
    tags,
    testCases: cases,
    hints: makeHints([
      "Each island is a connected component of '1' cells.",
      "Run DFS/BFS from each unvisited '1' and mark the entire component.",
      "Count how many times you start a new traversal.",
    ]),
  };
}

// A lightweight catalog: we repeat some generator families with different tags/slugs to reach ~50 problems.
const CATALOG = [
  genTwoSum,
  genValidParentheses,
  genMaxSubarray,
  genBinarySearch,
  genGridPaths,
  genLISLength,
  genBFSShortestPath,
  genMergeIntervals,
  genClimbStairs,
  genLongestSubstringNoRepeat,
  genTopKFrequent,
  genNumberOfIslands,
];

function generateProblem(rng, index) {
  const g = CATALOG[index % CATALOG.length];
  const base = g(rng);
  // Ensure uniqueness of title by adding a suffix when repeating
  const suffix = index >= CATALOG.length ? ` #${Math.floor(index / CATALOG.length) + 1}` : "";
  return {
    ...base,
    title: `${base.title}${suffix}`,
    // Defaults expected by schema
    supportedLanguages: base.supportedLanguages || ["cpp", "python", "java"],
    languageTemplates: base.languageTemplates || undefined,
    isInteractiveTutorial: !!base.isInteractiveTutorial,
    tutorialSteps: base.tutorialSteps || [],
    timeLimit: base.timeLimit || 5000,
    memoryLimit: base.memoryLimit || 256000,
    isPublic: true,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const mongo = args.mongo || args.mongodb || args.uri;
  const count = Number(args.count || 50);
  const seed = Number(args.seed || 1337);
  const authorUsername = args.author ? String(args.author) : null;
  const wipe = !!args.wipe;

  if (!mongo) {
    console.error("Missing --mongo");
    process.exit(1);
  }

  await mongoose.connect(mongo);
  console.log("[seed-problems] Connected:", mongo);

  const author =
    (authorUsername ? await User.findOne({ username: authorUsername }) : null) ||
    (await User.findOne({})) ||
    null;

  if (!author) {
    console.error("[seed-problems] No user found in elearn-db to use as author.");
    process.exit(1);
  }

  console.log("[seed-problems] Using author:", author.username || author._id.toString());

  if (wipe) {
    const del = await Problem.deleteMany({});
    console.log("[seed-problems] Wiped problems:", del.deletedCount);
  }

  const rng = mulberry32(seed);
  const docs = [];
  for (let i = 0; i < count; i += 1) {
    const p = generateProblem(rng, i);
    docs.push({
      ...p,
      author: author._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const inserted = await Problem.insertMany(docs, { ordered: false });
  console.log("[seed-problems] Inserted:", inserted.length);

  await mongoose.disconnect();
  console.log("[seed-problems] Done.");
}

main().catch((err) => {
  console.error("[seed-problems] Fatal:", err);
  process.exit(1);
});

