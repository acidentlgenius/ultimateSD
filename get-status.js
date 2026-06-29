const fs = require('fs');

const filesToFix = [
  'ultimate-sd/src/components/widgets/CrawlerFrontier.tsx',
  'ultimate-sd/src/components/widgets/PrivacyRequestManager.tsx',
  'ultimate-sd/src/components/widgets/SocketPulse.tsx',
  'ultimate-sd/src/components/widgets/JobSchedulerViz.tsx',
  'ultimate-sd/src/components/widgets/RAGArchitect.tsx'
];

filesToFix.forEach(f => {
    const c = fs.readFileSync(f, 'utf8');
    if (c.indexOf('timeoutsRef') > -1) {
        console.log(`${f} has timeoutsRef`);
    } else {
        console.log(`${f} DOES NOT have timeoutsRef`);
    }
});
