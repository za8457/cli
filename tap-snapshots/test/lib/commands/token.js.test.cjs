/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/lib/commands/token.js TAP token list default output > should list both tokens 1`] = `
[90m┌─────────[39m[90m┬─────────[39m[90m┬────────────[39m[90m┬──────────[39m[90m┬────────────────┐[39m
[90m│[39m[31m id      [39m[90m│[39m[31m token   [39m[90m│[39m[31m created    [39m[90m│[39m[31m readonly [39m[90m│[39m[31m CIDR whitelist [39m[90m│[39m
[90m├─────────[39m[90m┼─────────[39m[90m┼────────────[39m[90m┼──────────[39m[90m┼────────────────┤[39m
[90m│[39m abcd123 [90m│[39m efgh56… [90m│[39m 2020-10-10 [90m│[39m no       [90m│[39m                [90m│[39m
[90m├─────────[39m[90m┼─────────[39m[90m┼────────────[39m[90m┼──────────[39m[90m┼────────────────┤[39m
[90m│[39m abcd125 [90m│[39m hgfe87… [90m│[39m 2020-10-10 [90m│[39m yes      [90m│[39m 192.168.1.1/32 [90m│[39m
[90m└─────────[39m[90m┴─────────[39m[90m┴────────────[39m[90m┴──────────[39m[90m┴────────────────┘[39m
`

exports[`test/lib/commands/token.js TAP token list parseable output > should list both tokens 1`] = `
key	token	created	readonly	CIDR whitelist
abcd1234abcd1234	efgh5678efgh5678	2020-10-10	false	
abcd1256	hgfe8765	2020-10-10	true	192.168.1.1/32
`
