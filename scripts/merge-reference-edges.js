#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const inputArg = args.find(arg => !arg.startsWith('--')) || 'reference/tier1-tier2-edges.json';
const inputPath = path.resolve(repoRoot, inputArg);
const htmlPath = path.join(repoRoot, 'index.html');
const allowedTypes = new Set(['prerequisite_of', 'related_to']);
const allowedGroups = new Set([
  'dependency',
  'representation_bridge',
  'spatial_structure',
  'number_structure',
  'data_reasoning',
  'unit_transfer',
  'application',
  'cross_category'
]);

function fail(message){
  console.error(message);
  process.exit(1);
}

function extractConstArray(html,name){
  const match = html.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\]);`));
  if(!match)fail(`Cannot find const ${name} in index.html`);
  return JSON.parse(match[1]);
}

function rawEdgesFrom(value){
  if(Array.isArray(value))return value;
  if(value && Array.isArray(value.edges))return value.edges;
  if(value && Array.isArray(value.relations))return value.relations;
  fail('Reference file must be an array, or an object with edges/relations array.');
}

function endpointValue(raw,key){
  const value = raw[key] ?? raw[`${key}Id`] ?? raw[`${key}Name`] ?? raw[`${key}Concept`];
  if(value && typeof value === 'object')return value.id ?? value.name ?? value.concept;
  return value;
}

function resolveEndpoint(value,nameToId,nodeIds,index,label){
  if(typeof value !== 'string' || !value.trim())fail(`Edge ${index}: missing ${label}`);
  const trimmed = value.trim();
  if(nodeIds.has(trimmed))return trimmed;
  if(nameToId.has(trimmed))return nameToId.get(trimmed);
  fail(`Edge ${index}: unknown ${label} "${trimmed}"`);
}

function normalizeEdge(raw,index,nameToId,nodeIds){
  const from = resolveEndpoint(endpointValue(raw,'from') ?? raw.source ?? raw.sourceConcept ?? raw[0], nameToId, nodeIds, index, 'from');
  const to = resolveEndpoint(endpointValue(raw,'to') ?? raw.target ?? raw.targetConcept ?? raw[1], nameToId, nodeIds, index, 'to');
  const type = raw.type || raw.relation || raw.kind || 'related_to';
  if(!allowedTypes.has(type))fail(`Edge ${index}: unsupported type "${type}"`);
  const fallbackGroup = type === 'prerequisite_of' ? 'dependency' : 'cross_category';
  const group = raw.group || raw.edgeGroup || fallbackGroup;
  if(!allowedGroups.has(group))fail(`Edge ${index}: unsupported group "${group}"`);
  const exp = raw.exp || raw.explanation || raw.reason || raw.description || raw.label;
  if(typeof exp !== 'string' || exp.trim().length < 6)fail(`Edge ${index}: explanation is missing or too short`);
  const critical = typeof raw.critical === 'boolean'
    ? raw.critical
    : raw.priority === 'critical' || raw.level === 'critical' || raw.criticality === 'critical';
  return {
    from,
    to,
    type,
    exp: exp.trim(),
    group: type === 'prerequisite_of' ? 'dependency' : group,
    critical: type === 'prerequisite_of' ? true : critical,
    source: raw.source || 'reference'
  };
}

function exactKey(edge){return `${edge.from}->${edge.to}|${edge.type}`;}
function relatedPairKey(edge){return [edge.from,edge.to].sort().join('<->');}

function enrichExisting(target,incoming){
  let changed = false;
  if(incoming.critical && !target.critical){target.critical = true; changed = true;}
  if(incoming.group && (!target.group || target.group === 'cross_category')){
    target.group = incoming.group;
    changed = true;
  }
  if(!target.source && incoming.source){target.source = incoming.source; changed = true;}
  return changed;
}

if(!fs.existsSync(inputPath)){
  fail(`Reference file not found: ${path.relative(repoRoot,inputPath)}`);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const nodes = extractConstArray(html, 'nodes');
const edges = extractConstArray(html, 'edges');
const nodeIds = new Set(nodes.map(node => node.id));
const nameToId = new Map(nodes.map(node => [node.name, node.id]));
const rawInput = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const incomingEdges = rawEdgesFrom(rawInput).map((edge,index)=>normalizeEdge(edge,index,nameToId,nodeIds));
const byExact = new Map(edges.map(edge=>[exactKey(edge),edge]));
const relatedByPair = new Map(edges.filter(edge=>edge.type==='related_to').map(edge=>[relatedPairKey(edge),edge]));

let added = 0, updated = 0, skipped = 0;
for(const edge of incomingEdges){
  const exact = byExact.get(exactKey(edge));
  if(exact){
    updated += enrichExisting(exact,edge) ? 1 : 0;
    skipped += 1;
    continue;
  }
  if(edge.type === 'related_to'){
    const reverse = relatedByPair.get(relatedPairKey(edge));
    if(reverse){
      updated += enrichExisting(reverse,edge) ? 1 : 0;
      skipped += 1;
      continue;
    }
  }
  edges.push(edge);
  byExact.set(exactKey(edge),edge);
  if(edge.type === 'related_to')relatedByPair.set(relatedPairKey(edge),edge);
  added += 1;
}

console.log(`Reference merge: ${incomingEdges.length} input, ${added} added, ${updated} enriched, ${skipped} existing.`);
if(dryRun){
  console.log('Dry run only. index.html was not changed.');
  process.exit(0);
}

const nextHtml = html.replace(/const edges = \[[\s\S]*?\];/, `const edges = ${JSON.stringify(edges)};`);
fs.writeFileSync(htmlPath, nextHtml);
