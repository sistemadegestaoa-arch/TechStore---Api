import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

try {
  const result = execSync('node_modules\\.bin\\prisma.cmd migrate deploy', {
    cwd: 'c:\\loja\\backend',
    env: process.env,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  writeFileSync('migrate_output.txt', 'SUCCESS:\n' + result);
  console.log('SUCCESS:', result);
} catch (err) {
  const output = 'STDOUT:\n' + (err.stdout || '') + '\n\nSTDERR:\n' + (err.stderr || '') + '\n\nMESSAGE:\n' + err.message;
  writeFileSync('migrate_output.txt', output);
  console.error(output);
  process.exit(1);
}
