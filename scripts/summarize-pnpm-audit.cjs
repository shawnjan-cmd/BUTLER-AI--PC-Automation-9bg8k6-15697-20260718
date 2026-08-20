const fs = require('fs');

const audit = JSON.parse(fs.readFileSync('/tmp/butler_pnpm_audit.json', 'utf8'));
const vulnerabilities = audit.vulnerabilities || {};
const rows = Object.entries(vulnerabilities)
  .map(([name, item]) => ({
    name,
    severity: item.severity || 'unknown',
    direct: Boolean(item.isDirect),
    effects: item.effects || [],
    range: item.range || '',
    fixAvailable: item.fixAvailable === true ? 'yes' : item.fixAvailable ? 'manual/major' : 'no',
  }))
  .sort((a, b) => `${a.severity}:${a.name}`.localeCompare(`${b.severity}:${b.name}`));

for (const row of rows) {
  if (row.severity === 'critical' || row.severity === 'high') console.log(JSON.stringify(row));
}
console.log(`HIGH_OR_CRITICAL=${rows.filter((row) => row.severity === 'high' || row.severity === 'critical').length}`);
console.log(`DIRECT_HIGH_OR_CRITICAL=${rows.filter((row) => row.direct && (row.severity === 'high' || row.severity === 'critical')).length}`);
