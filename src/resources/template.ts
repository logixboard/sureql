import { QueryConfig as PgQuery } from 'pg';

const namedQuery = `$$SUREQL$$NAMEDQUERY$$SUREQL$$`;

/**
 * @param data params to func
 * @returns pgquery
 */
export default function generateQuery(
    data: Readonly<Record<string, any>>
): PgQuery {
    const values: any[] = [];
    const text = namedQuery.replace(
        /(?<prefix>::?)(?<quote>['"]?)(?<key>[a-zA-Z0-9_]+)\k<quote>/g,
        (_, prefix, _quote, key) => {
            // don't change casts: '::'
            // if (prefix !== ':') {
            if (isPgCast(data, _, prefix, _quote, key)) {
                return prefix + key;
            } else if (haveValueForPlaceholder(data, _, prefix, _quote, key)) {
                // for each named value in the query, replace with a
                // positional placeholder and accumulate the value in
                // the values list
                values.push(data[key]);
                return `$${values.length}`;
            }
            throw new Error(
                // eslint-disable-next-line max-len
                `Missing value for statement.\n${key} not provided for statement:\n${namedQuery}\nthis was provided:\n${JSON.stringify(
                    data
                )}`
            );
        }
    );
    return { text, values };
}

// The following two functions could use some cleaning up
/* eslint-disable */
function isPgCast(
  data: any,
  _: any,
  prefix: string,
  _quote: string,
  key: string
): boolean {
  return prefix === "::";
}

function haveValueForPlaceholder(
  data: any,
  _: any,
  prefix: string,
  _quote: string,
  key: string
): boolean {
  return key in data;
}
/* eslint-enable */
