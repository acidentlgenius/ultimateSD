const fs = require('fs');

let c = fs.readFileSync('ultimate-sd/src/components/widgets/PrivacyRequestManager.tsx', 'utf8');

c = c.replace('timeoutsRef.current.push(timeout1); \n            return timeout1;', 'timeoutsRef.current.push(timeout1);');

fs.writeFileSync('ultimate-sd/src/components/widgets/PrivacyRequestManager.tsx', c);

console.log("Fixed tests");
