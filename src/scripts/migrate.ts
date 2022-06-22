import { migrate } from '../database';

console.log('Starting migrations...');
migrate()
  .then(() => {
    console.log('Migrations complete.');
    process.exit();
  })
  .catch((reason) => {
    console.log('Migrations failed!');
    console.log(reason);
    process.exit(1);
  });
