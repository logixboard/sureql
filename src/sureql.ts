import fs from 'fs';
import path from 'path';

import { ArgumentParser } from 'argparse';
import mustache from 'mustache';

interface ArgumentPatternResult {
    prefix: string;
    quote: string;
    key: string;
}

function isArgumentPatternResult(candidate: any): candidate is ArgumentPatternResult {
    return candidate.prefix && candidate.quote && candidate.key;
}

export class UnnamedQueryError extends Error {
    query: string;

    constructor(query: string) {
        super(`Attempted to compile unnamed query: ${query}`);

        this.query = query;
    }
}

export const argumentPattern = /(?<prefix>::?)(?<quote>['"]?)(?<key>[a-zA-Z0-9_]+)\k<quote>/g;
export const fileTemplate = fs.readFileSync(
    path.resolve(__dirname, 'resources', 'template.ts.mustache'),
    'utf8'
);
const queryWithinFileDelimiter = '\n\n';

export function main(): void {
    const parser = new ArgumentParser({
        addHelp: true,
        description: 'Create JavaScript wrappers for PostgreSQL statements with named parameters',
        prog: 'sureql',
    });

    parser.addArgument('sql-dirs', {
        nargs: '*',
        help: 'directories to scan for SQL files',
    });
    parser.addArgument('out-dir', {
        nargs: 1,
        help: 'output directory for generated Typescript files',
    });

    const args = parser.parseArgs();
    const sqlDirs = args['sql-dirs'].map((dir: string) => path.resolve(dir));
    const outDir = path.resolve(args['out-dir'][0]);

    for (const dir of sqlDirs) {
        const queries = compileDirectory(dir);

        for (const [key, query] of Object.entries(queries)) {
            const outPath = path.join(outDir, `${key}.ts`);
            fs.writeFileSync(outPath, query);
        }
    }
}

export function compileDirectory(
    dir: string
): Readonly<Record<string, string>> {
    const mappedFiles = fs
        .readdirSync(dir)
        .filter(filename => filename.endsWith('.sql'))
        .map((filename: string) => ({
            filename,
            content: fs
                .readFileSync(path.resolve(dir, filename), 'utf8')
                .replace(/\r\n/g, '\n')
        }));

    const queries: Record<string, string> = {};

    for (const file of mappedFiles) {
        file.content
            .split(queryWithinFileDelimiter)
            .map(compileQueryFromString)
            .forEach((namedQuery) => Object.assign(queries, namedQuery))
    }

    return queries;
}

export function compileQueryFromString(query: string): Readonly<Record<string, string>> {
    if (!query.startsWith('-- ')) {
        throw new UnnamedQueryError(query);
    }

    const sqlName = query
        .split('\n')[0]
        .substring(2)
        .trim();

    let match;
    const matchGroups: ArgumentPatternResult[] = [];
    while ((match = argumentPattern.exec(query)) !== null) {
        if (isArgumentPatternResult(match.groups)) {
            matchGroups.push(match.groups)
        }
    }

    return {
        [sqlName]: mustache.render(fileTemplate, {
            argumentPattern: argumentPattern.toString(),
            parameters: Array.from(new Set(matchGroups.map(group => group.key))),
            rawQuery: query
        })
    };
}
