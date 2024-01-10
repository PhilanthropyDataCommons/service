import path from 'path';
import { TinyPg } from 'tinypg';

export const db = new TinyPg({
	root_dir: [path.resolve(__dirname, 'queries')],
});
