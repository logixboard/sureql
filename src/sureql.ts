import fs from 'fs';
import path from 'path';

export const fileTemplate: string = fs.readFileSync(
    path.resolve(__dirname, 'resources', 'sureql-fillin.ts'),
    'utf8'
);

/**
 * @param dir the directory to scan for SQL queries (which must end with .sql)
 * @returns a map with query names as keys and query generators as values
 */
export default function readSqlFiles(
    dir: string
): Readonly<Record<string, string>> {
    return fs
        .readdirSync(dir)
        .filter(filename => filename.endsWith('.sql'))
        .map((filename: string) => ({
            filename,
            content: fs
                .readFileSync(path.resolve(dir, filename), 'utf8')
                .replace(/\r\n/g, '\n')
        }))
        .reduce((acc: Record<string, string>, file) => {
            file.content.split('\n\n').forEach(namedQuery => {
                if (namedQuery.startsWith('-- ')) {
                    const sqlName = namedQuery
                        .split('\n')[0]
                        .substring(2)
                        .trim();
                    acc[sqlName] = fileTemplate.replace(
                        '$$SUREQL$$NAMEDQUERY$$SUREQL$$',
                        namedQuery
                    );
                }
            });
            return acc;
        }, {});
}
/* eslint-enable */
