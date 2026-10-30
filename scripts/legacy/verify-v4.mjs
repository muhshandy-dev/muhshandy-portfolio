import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync('src/data/site.json','utf8'));
const ids=d.sections.map(x=>x.id);
if(ids.length!==10||new Set(ids).size!==10) throw new Error('Section tidak lengkap/duplikat');
for(const x of d.sections){if(!['carousel','pages','grid'].includes(x.displayMode)) throw new Error('Mode tidak sah: '+x.id); if(x.intervalSeconds<3||x.intervalSeconds>20) throw new Error('Jeda tidak valid'); if(x.mobileColumns<1||x.mobileColumns>2)throw new Error('Kolom HP di luar rentang');}
for(const key of ['work','education','projects','certifications','activities','skills','posts']) if(!Array.isArray(d[key])) throw new Error('Data '+key+' rusak');
const demoCount=['work','education','projects','certifications','activities','skills','posts'].reduce((n,k)=>n+d[k].filter(x=>x.demo).length,0);
console.log('✅ Data OK:',ids.length,'bagian,',demoCount,'konten contoh terlabel.');
