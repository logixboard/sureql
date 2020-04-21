# sureql

Create TypeScript wrappers for PostgreSQL statements with named parameters.

## Examples

The CLI (exposed through the usual `npx sureql` / `yarn run sureql` workflows) expects 1+
directories of `.sql` files [following the same rules and syntax as
yesql](https://github.com/pihvi/yesql/blob/8327f3faa0458f547ab22d3db7b62e208355b645/README.md) and a
TypeScript output directory as arguments, and will compile, for example, this:

```sql
-- selectUsingTwoDisparateKeys
SELECT mt.blah_id
FROM   public.mytable mt
WHERE  mt.customer_id = :'customerId'
AND    mt.date_of_purchase < :'dateOfPurchase'
;
```

... into this, a TypeScript wrapper function which takes named parameters validated at compile
time!:

```typescript
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
    query: string;

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
        (_, prefix, _quote, key) => {
            if (prefix === '::') {
                return prefix + key;
            } else if (Object.keys(parameters).includes(key)) {
                // for each named value in the query, replace with a
                // positional placeholder and accumulate the value in
                // the values list
                values.push(parameters[key]);
                return `$${values.length}`;
            }

            throw new MissingValueError(key, rawQuery);
        }
    );
    return { text, values };
}
```

## Legal

sureql is released under the ISC License, [the same terms as yesql, which it was originally forked
from](https://github.com/pihvi/yesql/blob/8327f3faa0458f547ab22d3db7b62e208355b645/package.json#L29).
See `LICENSE.md` for the full text.