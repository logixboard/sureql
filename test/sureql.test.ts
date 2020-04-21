import fs from 'fs';
import path from 'path';

import { compileDirectory } from '../src/sureql';

test('correctly compiles example queries', () => {
    const queriesDir = path.join(__dirname, 'queries');
    const specsDir = path.join(__dirname, 'specs');

    const allQueries = new Set(fs.readdirSync(queriesDir));
    const allSpecs = new Set(fs.readdirSync(specsDir));

    const compiledQueries = compileDirectory(queriesDir);

    const calculatedSpecFileNames = new Set(Object.keys(compiledQueries).map(key => `${key}.spec.ts`));
    expect(calculatedSpecFileNames).toStrictEqual(allSpecs);

    for (const [queryName, queryContents] of Object.entries(compiledQueries)) {
        const specContents = fs.readFileSync(
            path.join(specsDir, `${queryName}.spec.ts`),
            { encoding: 'utf-8' }
        );

        expect(queryContents).toStrictEqual(specContents);
    }
})
