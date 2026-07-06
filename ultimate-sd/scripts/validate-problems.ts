import { PROBLEMS } from '../src/lib/problems';
import { validateProblem } from '../src/lib/problem-validation';

let hasErrors = false;

for (const problem of PROBLEMS) {
  const result = validateProblem(problem);

  if (result.missingPhases.length > 0) {
    hasErrors = true;
    console.error(`[structure] ${result.slug}: missing ${result.missingPhases.join(', ')} phase(s)`);
  }

  if (result.contentErrors.length > 0) {
    hasErrors = true;
    console.error(`[content] ${result.slug}:`);
    for (const error of result.contentErrors) {
      console.error(`  - ${error}`);
    }
  }
}

if (hasErrors) {
  console.error(`\n${PROBLEMS.length} problems checked, failures above.`);
  process.exit(1);
} else {
  console.log(`All ${PROBLEMS.length} problems pass validation.`);
}
