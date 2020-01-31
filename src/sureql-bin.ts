import { ArgumentParser } from 'argparse';
import fs from 'fs';
import path from 'path';
import sureql from './sureql';

const parser = new ArgumentParser({
    addHelp: true,
    description: 'Create JavaScript wrappers for PostgreSQL statements with named parameters',
    prog: 'sureql',
});

parser.addArgument('sql_dirs', {
    nargs: '*',
    help: 'directories to scan for SQL files',
});
parser.addArgument('out_dir', {
    nargs: 1,
    help: 'output directory for generated Typescript files',
});

const args = parser.parseArgs();
const sqlDirs = args.sql_dirs.map((dir: string) => path.resolve(dir));
const outDir = path.resolve(args.out_dir[0]);

for (const dir of sqlDirs) {
    const queries = sureql(dir);

    for (const [key, query] of Object.entries(queries)) {
        const outPath = path.join(outDir, `${key}.ts`);
        fs.writeFileSync(outPath, query);
    }
}
