import { QueryConfig as PgQuery } from 'pg';

import { MissingValueError } from './common';

export const argumentPattern = /(?<prefix>::?)(?<quote>['"]?)(?<key>[a-zA-Z0-9_]+)\k<quote>/g;
export const rawQuery = `-- selectUsingTwoDisparateKeys
SELECT mt.blah_id
FROM   public.mytable mt
WHERE  mt.customer_id = :'customerId'
AND    mt.date_of_purchase < :'dateOfPurchase'
;
`;

// eslint-disable @typescript-eslint/no-empty-interface
export interface InputParameters {
    customerId: any;
    dateOfPurchase: any;
}
// eslint-enable @typescript-eslint/no-empty-interface

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
    return {
        text,
        values,
        name: 'selectUsingTwoDisparateKeys'
    };
}
