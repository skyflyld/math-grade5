const fs=require("fs"), path=require("path");

let pass=0, fail=0, issues=[];
function check(ok, msg){
  if(!ok){fail++; issues.push(msg)}
  else pass++;
}

// === Phase 1: Parse concept graph ===
const html=fs.readFileSync("index.html","utf-8");
const nm=html.match(/const nodes = (\[[\s\S]*?\]);/);
const em=html.match(/const edges = (\[[\s\S]*?\]);/);
if(!nm||!em){console.log("FATAL: cannot parse graph data");process.exit(1);}
const nodes=JSON.parse(nm[1]), edges=JSON.parse(em[1]);
const nodeMap=new Map(nodes.map(n=>[n.id,n]));
const nodeNameSet=new Set(nodes.map(n=>n.name));
const baselineConceptCount=40;
const baselineEdgeCount=57;

// === Phase 1: Node data integrity ===
console.log("=== Phase 1: Node data integrity ===");
check(nodes.length>=baselineConceptCount, "Concept node count: "+nodes.length+" (expected at least "+baselineConceptCount+")");
nodes.forEach(n=>{
  check(n.id && n.id.length>=6, "Node missing ID: "+n.name);
  check(n.name && n.name.length>0, "Node missing name: "+n.id);
  check(n.category, "Node missing category: "+n.name);
  check(n.difficulty>=1 && n.difficulty<=5, n.name+" difficulty="+n.difficulty+" out of 1-5 range");
  check(n.desc&&n.desc.length>5, n.name+" desc too short: "+(n.desc||"").slice(0,30));
});
const cats=new Set(nodes.map(n=>n.category));
check(cats.size>=5, "Category count: "+cats.size+" "+[...cats].join(","));
const sems=new Set(nodes.map(n=>n.semester));
check(sems.size>=2, "Semester count: "+sems.size);
console.log("  Categories: "+[...cats].join(", "));
console.log("  Semesters: "+[...sems].join(", "));
console.log("  Pass: "+pass+" current (nodes done)");

// === Phase 2: Edge data integrity ===
let p2pass=pass;
console.log("\n=== Phase 2: Edge data integrity ===");
check(edges.length>=baselineEdgeCount, "Edge count: "+edges.length+" (expected at least "+baselineEdgeCount+")");
edges.forEach((e,i)=>{
  check(nodeMap.has(e.from), "Edge "+i+': from="'+e.from+'" bad');
  check(nodeMap.has(e.to), "Edge "+i+': to="'+e.to+'" bad');
  check(e.type==="prerequisite_of"||e.type==="related_to", "Edge "+i+': unknown type "'+e.type+'"');
  check(e.exp&&e.exp.length>5, "Edge "+i+': missing explanation');
});
const edgeSet=new Set(edges.map(e=>e.from+"->"+e.to));
check(edgeSet.size===edges.length, "Duplicate edges: "+(edges.length - edgeSet.size));
const prereqCount=edges.filter(e=>e.type==="prerequisite_of").length;
const relCount=edges.filter(e=>e.type==="related_to").length;
console.log("  prerequisite_of: "+prereqCount+", related_to: "+relCount);
console.log("  Pass: "+(pass-p2pass)+" in this phase");

// === Phase 3: DAG check ===
let p3pass=pass;
console.log("\n=== Phase 3: DAG (dependency loop check) ===");
const prereq=edges.filter(e=>e.type==="prerequisite_of");
const inDeg=new Map; nodes.forEach(n=>inDeg.set(n.id,0));
prereq.forEach(e=>inDeg.set(e.to,(inDeg.get(e.to)||0)+1));
let q=[...inDeg.entries()].filter(([_,d])=>d===0).map(([id])=>id);
let sorted=0;
while(q.length){
  const id=q.shift(); sorted++;
  prereq.filter(e=>e.from===id).forEach(e=>{
    const nd=(inDeg.get(e.to)||0)-1; inDeg.set(e.to,nd);
    if(nd===0)q.push(e.to);
  });
}
check(sorted===nodes.length, "DAG: "+sorted+"/"+nodes.length+" reachable -> "+(nodes.length-sorted)+" cyclic");

const hasOut = new Set(prereq.filter(e=>e.from!==e.to).map(e=>e.from));
const hasIn = new Set(prereq.filter(e=>e.from!==e.to).map(e=>e.to));
const roots = nodes.filter(n=>!hasIn.has(n.id)).map(n=>n.name);
const leaves = nodes.filter(n=>!hasOut.has(n.id)).map(n=>n.name);
console.log("  Roots (no prereq): "+roots.join(", "));
console.log("  Leaves (no dependents): "+leaves.join(", "));
console.log("  Pass: "+(pass-p3pass)+" in this phase");

// === Phase 4: File link integrity ===
let p4pass=pass;
console.log("\n=== Phase 4: Courseware file links ===");
const conceptsJS=fs.readFileSync("shared/concepts.js","utf-8");
const lcMatch=conceptsJS.match(/const lessonByConcept = \{([\s\S]*?)\n\};/);
const hrefRegex=/'([^']+)':\{href:withHash\('([^']+)'/g;
let m, fileCount=0, missingFiles=0;
if(lcMatch){
  while((m=hrefRegex.exec(lcMatch[0]))!==null){
    fileCount++;
    const cname=m[1], filePath=m[2];
    const absPath=path.join(__dirname, "..", filePath);
    if(!fs.existsSync(absPath)){
      missingFiles++;
      check(false, "File MISSING: "+cname+" -> "+filePath);
    }
  }
}
check(fileCount===nodes.length, "lessonByConcept entries: "+fileCount+" (expected "+nodes.length+")");
check(missingFiles===0, "Missing files: "+missingFiles);
console.log("  Entries: "+fileCount+", Missing: "+missingFiles);
console.log("  Pass: "+(pass-p4pass)+" in this phase");

// === Phase 5: Courseware structural check ===
let p5pass=pass;
console.log("\n=== Phase 5: Courseware structural check ===");
let totalCW=0, deepLessons=0, noGate=0, noAdv=0, noFeyn=0, noEx=0, noComponents=0, noConceptAttr=0;
let nonMatchingAttr=[];
fs.readdirSync("modules",{recursive:true}).filter(f=>f.endsWith(".html")).forEach(f=>{
  const fp=path.join("modules",f);
  if(!fs.existsSync(fp))return;
  totalCW++;
  const isModuleIndex=path.basename(f)==="index.html";
  const c=fs.readFileSync(fp,"utf-8");
  if(!isModuleIndex){
    deepLessons++;
    if(!c.includes("createGate")) noGate++;
    if(!c.includes("createAdversarialChallenge")) noAdv++;
    if(!c.includes("createFeynmanFill")) noFeyn++;
    if(!c.includes("createExerciseSet")) noEx++;
  }
  if(!isModuleIndex && !c.includes("shared/components.js")) noComponents++;
  if(!c.includes("data-concept=")) noConceptAttr++;
  const cd=c.match(/data-concept="([^"]+)"/);
  if(cd){
    cd[1].split(",").map(v=>v.trim()).filter(Boolean).forEach(name=>{
      if(!nodeNameSet.has(name)) nonMatchingAttr.push(f+" -> \""+name+"\" not in graph");
    });
  }
});
check(totalCW===fileCount, "Total courseware: "+totalCW+" (expected "+fileCount+")");
check(noGate===0, "Missing createGate: "+noGate);
check(noAdv===0, "Missing AdversarialChallenge: "+noAdv);
check(noFeyn===0, "Missing FeynmanFill: "+noFeyn);
check(noEx===0, "Missing ExerciseSet: "+noEx);
check(noComponents===0, "Missing components.js import: "+noComponents);
check(noConceptAttr===0, "Missing data-concept: "+noConceptAttr);
nonMatchingAttr.forEach(v=>check(false, v));
console.log("  Courseware files: "+totalCW+", deep lessons: "+deepLessons+", structural issues: "+(noGate+noAdv+noFeyn+noEx+noComponents+noConceptAttr+nonMatchingAttr.length));
console.log("  Pass: "+(pass-p5pass)+" in this phase");

// === Phase 6: Shared components ===
let p6pass=pass;
console.log("\n=== Phase 6: Shared components ===");
["shared/components.js","shared/concepts.js","shared/concept-sync.js","shared/layout.css"].forEach(f=>{
  check(fs.existsSync(f), "MISSING: "+f);
});
if(fs.existsSync("shared/components.js")){
  const comp=fs.readFileSync("shared/components.js","utf-8");
  ["createGate","createAdversarialChallenge","createFeynmanFill","createExerciseSet",
   "createNumberLine","createAreaModel","createFractionBar","createBalance",
   "saveProgress","getProgress","celebrate"].forEach(fn=>{
    check(comp.includes("function "+fn), "Component MISSING: "+fn);
  });
}
console.log("  Pass: "+(pass-p6pass)+" in this phase");

// === Phase 7: Cross-concept consistency ===
let p7pass=pass;
console.log("\n=== Phase 7: Cross-concept consistency ===");
let difficultyIssues=0;
nodes.forEach(n=>{
  const prereqIds = edges.filter(e=>e.to===n.id && e.type==="prerequisite_of").map(e=>e.from);
  prereqIds.forEach(pid=>{
    const pn=nodeMap.get(pid);
    if(pn && pn.difficulty > n.difficulty){
      difficultyIssues++;
      check(false, n.name+"(d="+n.difficulty+") has harder prereq "+pn.name+"(d="+pn.difficulty+")");
    }
  });
});
if(difficultyIssues===0) console.log("  DAG difficulty constraint: ALL CLEAR (prereq <= successor)");
console.log("  Pass: "+(pass-p7pass)+" in this phase");

// === Phase 8: Mobile CSS check ===
let p8pass=pass;
console.log("\n=== Phase 8: Mobile CSS check ===");
const hasMobile=html.includes("@media (max-width:720px)");
check(hasMobile, "index.html missing mobile media query");
if(hasMobile){
  check(html.includes("safe-area"), "Missing safe-area-inset-bottom");
  check(html.includes("overflow-x:auto"), "Missing horizontal scroll");
  check(html.includes("position:fixed"), "Missing position:fixed for bottom panel");
  check(html.includes("100vw"), "Missing viewport-width constraints");
  check(html.includes("scrollbar-width:none"), "Missing scrollbar hiding");
}
console.log("  Pass: "+(pass-p8pass)+" in this phase");

// === Final ===
console.log("\n========================================");
console.log("ADVERSARIAL AUDIT REPORT");
console.log("========================================");
console.log(" PASS: "+pass);
console.log(" FAIL: "+fail);
console.log("========================================");
if(fail>0){
  console.log("\nFAILURES:");
  issues.forEach((v,i)=>console.log("  "+(i+1)+". "+v));
} else {
  console.log("\nAll checks passed. No issues found.");
}
