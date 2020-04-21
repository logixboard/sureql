import { QueryConfig as PgQuery } from 'pg';

export const argumentPattern = /(?<prefix>::?)(?<quote>['"]?)(?<key>[a-zA-Z0-9_]+)\k<quote>/g;
export const rawQuery = `-- selectUsingTwoDisparateKeys
SELECT mt.blah_id
FROM   public.mytable mt
WHERE  mt.customer_id = :'customerId'
AND    mt.date_of_purchase < :'dateOfPurchase'
;
`;

export class MissingValueError extends Error {
    key: string;
    query: string | null | undefined;

    error = 'MissingValueError';

    constructor(key: string, query?: string) {
        super(`Missing value for key \`${key}\``);

        this.key = key;
        this.query = query;
    }
}

export interface InputParameters {
    customerId: any;
    dateOfPurchase: any;
}

export default function generateQuery(
    parameters: Readonly<InputParameters>
): PgQuery {
    const values: any[] = [];
    const text = rawQuery.replace(
        argumentPattern,
        (_, prefix: string, _quote: string, key: string) => {
            if (prefix === '::') {
                return prefix + key;
            } else if (key in parameters) {
                // for each named value in the query, replace with a
                // positional placeholder and accumulate the value in
                // the values list
                values.push(parameters[key as keyof InputParameters]);
                return `$${values.length}`;
            }

            throw new MissingValueError(key, rawQuery);
        }
    );
    return { text, values };
}
