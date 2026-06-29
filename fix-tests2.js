const fs = require('fs');

let content = fs.readFileSync('ultimate-sd/src/components/widgets/JobSchedulerViz.tsx', 'utf8');

// remove completeTask from dependency array as it creates a circular dependency since it uses state setters
content = content.replace('}, [isRunning, workers, tasks, addLog, completeTask]);', '}, [isRunning, workers, tasks, addLog]);');

fs.writeFileSync('ultimate-sd/src/components/widgets/JobSchedulerViz.tsx', content);

let c = fs.readFileSync('ultimate-sd/src/components/widgets/PrivacyRequestManager.tsx', 'utf8');

c = c.replace('timeoutsRef.current.push(timeout1);', 'timeoutsRef.current.push(timeout1); \n            return timeout1;');

console.log("Fixed dependencies");
