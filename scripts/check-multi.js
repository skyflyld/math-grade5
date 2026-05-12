// Check multi-concept lesson mappings
const fs = require("fs");
const data = fs.readFileSync("shared/concepts.js","utf-8");
const match = data.match(/const lessonByConcept = \{([\s\S]*?)\};/);
const block = match[1];
const lines = block.split("\n").filter(l => l.includes("href:withHash"));
const entries = lines.map(l => {
  const nm = l.match(/^\s+'([^']+)'/);
  const hf = l.match(/withHash\('([^']+)'/);
  return {name: nm?.[1] ?? "?", href: hf?.[1] ?? "?"};
});
console.log("Total entries: " + entries.length);
const byUrl = {};
entries.forEach(e => {
  if (!byUrl[e.href]) byUrl[e.href] = [];
  byUrl[e.href].push(e.name);
});
const multi = Object.entries(byUrl).filter(([_,n]) => n.length > 1);
console.log("Multi-concept lessons: " + multi.length);
multi.sort((a,b) => b[1].length - a[1].length).forEach(([url,names]) => console.log("  " + names.join(", ") + " -> " + url));
