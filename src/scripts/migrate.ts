import { migrate } from '../database';

process.stdout.write('Starting migrations...\n');
migrate()
  .then(() => {
    process.stdout.write('Migrations complete.\n');
    process.exit();
  })
  .catch((reason: unknown) => {
    process.stdout.write('Migrations failed!\n');
    if (reason instanceof Error) {
      process.stdout.write(`${reason.message}\n`);
    }
    process.exit(1);
  });
