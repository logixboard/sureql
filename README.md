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

import { MissingValueError } from './common';

export const argumentPattern = /(?<prefix>::?)(?<quote>['"]?)(?<key>[a-zA-Z0-9_]+)\k<quote>/g;
export const rawQuery = `-- selectUsingTwoDisparateKeys
SELECT mt.blah_id
FROM   public.mytable mt
WHERE  mt.customer_id = :'customerId'
AND    mt.date_of_purchase < :'dateOfPurchase'
;
`;

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
    return {
        text,
        values,
        name: 'selectUsingTwoDisparateKeys'
    };
}
```

## Releasing sureql

Versioning and tagging is all managed with [Semantic
Release](https://github.com/semantic-release/semantic-release), so assuming commit messages follow
the expected format, this is fairly hands-off.

## Legal

sureql is released under the ISC License, [the same terms as yesql, which it was originally forked
from](https://github.com/pihvi/yesql/blob/8327f3faa0458f547ab22d3db7b62e208355b645/package.json#L29).
See `LICENSE.md` for the full text.
