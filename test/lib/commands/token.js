const t = require('tap')

const { load: loadMockNpm } = require('../../fixtures/mock-npm.js')
const MockRegistry = require('../../fixtures/mock-registry.js')
const mockGlobals = require('../../fixtures/mock-globals.js')
const stream = require('stream')

// t.test('completion', t => {
//   t.plan(5)

//   const [token] = tokenWithMocks()

//   const testComp = (argv, expect) => {
//     t.resolveMatch(token.completion({ conf: { argv: { remain: argv } } }), expect, argv.join(' '))
//   }

//   testComp(['npm', 'token'], ['list', 'revoke', 'create'])
//   testComp(['npm', 'token', 'list'], [])
//   testComp(['npm', 'token', 'revoke'], [])
//   testComp(['npm', 'token', 'create'], [])

//   t.rejects(token.completion({ conf: { argv: { remain: ['npm', 'token', 'foobar'] } } }), {
//     message: 'foobar not recognize',
//   })
// })

const tokens = () => {
  const _tokens = [
    {
      key: 'abcd1234abcd1234',
      token: 'efgh5678efgh5678',
      cidr_whitelist: null,
      readonly: false,
      created: '2020-10-10T00:10:24.109Z',
      updated: '2020-10-10T00:10:24.109Z',
    },
    {
      key: 'abcd1256',
      token: 'hgfe8765',
      cidr_whitelist: ['192.168.1.1/32'],
      readonly: true,
      created: '2020-10-10T00:10:24.109Z',
      updated: '2020-10-10T00:10:24.109Z',
    },
  ]
  return {
    tokens: _tokens,
    registry: {
      tokens: _tokens.map((t) => ({
        ...t,
        token: t.token.slice(0, 6),
      })),
    },
  }
}

const mockToken = async (t) => {
  const { npm, ...rest } = await loadMockNpm(t, {
    config: {
      '//registry.npmjs.org/:_authToken': 'test-auth-token',
    },
  })
  const registry = new MockRegistry({
    tap: t,
    registry: npm.config.get('registry'),
    authorization: 'test-auth-token',
  })
  return {
    ...rest,
    npm,
    registry,
  }
}

t.test('invalid subcommand', async t => {
  const { npm } = await loadMockNpm(t)
  await t.rejects(npm.exec('token', ['foobar']), /foobar is not a recognized subcommand/)
})

t.test('token list default output', async t => {
  const { npm, registry, joinedOutput } = await mockToken(t)
  registry.listTokens(tokens().registry)
  await npm.exec('token', ['list'])
  console.log(joinedOutput)
  // t.matchSnapshot(joinedOutput, 'should list both tokens')
})

// t.test('token list json output', async t => {
//   const { npm, joinedOutput } = await loadMockNpm(t, {
//     config: { ...auth, json: true },
//   })
//   const registry = new MockRegistry({
//     tap: t,
//     registry: npm.config.get('registry'),
//     authorization: 'test-auth-token',
//   })
//   registry.listTokens({ tokens })
//   await npm.exec('token', ['list'])
//   t.match(JSON.parse(joinedOutput), tokens)
// })

// t.test('token list parseable output', async t => {
//   const { npm, joinedOutput } = await loadMockNpm(t, {
//     config: { ...auth, parseable: true },
//   })

//   const registry = new MockRegistry({
//     tap: t,
//     registry: npm.config.get('registry'),
//     authorization: 'test-auth-token',
//   })
//   registry.listTokens({ tokens })
//   await npm.exec('token', ['list'])
//   t.matchSnapshot(joinedOutput, 'should list both tokens')
// })

// t.test('token revoke', async t => {
//   const { npm, joinedOutput } = await loadMockNpm(t, {
//     config: { ...auth },
//   })
//   const registry = new MockRegistry({
//     tap: t,
//     registry: npm.config.get('registry'),
//     authorization: 'test-auth-token',
//   })
//   registry.listTokens({ tokens })
//   registry.removeToken({ key: 'abcd1234abcd1234' })

//   await npm.exec('token', ['rm', 'abcd1234'])
//   t.equal(joinedOutput, 'Removed 1 token')
// })

// t.test('token revoke multiple tokens', async t => {
//   const { npm, joinedOutput } = await loadMockNpm(t, {
//     config: { ...auth },
//   })
//   const registry = new MockRegistry({
//     tap: t,
//     registry: npm.config.get('registry'),
//     authorization: 'test-auth-token',
//   })
//   registry.listTokens({ tokens })
//   registry.removeToken({ key: 'abcd1234abcd1234' })
//   registry.removeToken({ key: 'abcd1256' })

//   await npm.exec('token', ['rm', 'abcd1234', 'abcd1256'])
//   t.equal(joinedOutput, 'Removed 2 tokens')
// })

// t.test('token revoke json output', async t => {
//   const { npm, joinedOutput } = await loadMockNpm(t, {
//     config: { ...auth, json: true },
//   })
//   const registry = new MockRegistry({
//     tap: t,
//     registry: npm.config.get('registry'),
//     authorization: 'test-auth-token',
//   })
//   registry.listTokens({ tokens })
//   registry.removeToken({ key: 'abcd1234abcd1234' })

//   await npm.exec('token', ['rm', 'abcd1234'])
//   t.equal(joinedOutput, '["abcd1234abcd1234"]')
// })

// t.test('token revoke parseable output', async t => {
//   const { npm, joinedOutput } = await loadMockNpm(t, {
//     config: { ...auth, parseable: true },
//   })
//   const registry = new MockRegistry({
//     tap: t,
//     registry: npm.config.get('registry'),
//     authorization: 'test-auth-token',
//   })
//   registry.listTokens({ tokens })
//   registry.removeToken({ key: 'abcd1234abcd1234' })

//   await npm.exec('token', ['rm', 'abcd1234'])
//   t.equal(joinedOutput, 'abcd1234abcd1234')
// })

// t.test('token revoke by token', async t => {
//   const { npm, joinedOutput } = await loadMockNpm(t, {
//     config: { ...auth },
//   })
//   const registry = new MockRegistry({
//     tap: t,
//     registry: npm.config.get('registry'),
//     authorization: 'test-auth-token',
//   })
//   registry.listTokens({ tokens })
//   registry.removeToken({ key: 'abcd1234abcd1234' })

//   await npm.exec('token', ['rm', 'efgh5678efgh5678'])
//   t.equal(joinedOutput, 'Removed 1 token')
// })

// t.test('token revoke requires an id', async t => {
//   t.plan(2)

//   const [token, reset] = tokenWithMocks({
//     log: {
//       gauge: {
//         show: name => {
//           t.equal(name, 'token')
//         },
//       },
//     },
//   })

//   t.teardown(reset)

//   await t.rejects(token.exec(['rm']), /`<tokenKey>` argument is required/)
// })

// t.test('token revoke ambiguous id errors', async t => {
//   t.plan(7)

//   const [token, reset] = tokenWithMocks({
//     npm: {
//       flatOptions: { registry: 'https://registry.npmjs.org' },
//       config: {
//         getCredentialsByURI: uri => {
//           t.equal(uri, 'https://registry.npmjs.org', 'requests correct registry')
//           return { token: 'thisisnotarealtoken' }
//         },
//       },
//     },
//     log: {
//       gauge: {
//         show: name => {
//           t.equal(name, 'token', 'starts a gauge')
//         },
//       },
//       newItem: (action, len) => {
//         t.equal(action, 'removing tokens')
//         t.equal(len, 0)
//         return {
//           info: (name, progress) => {
//             t.equal(name, 'token')
//             t.equal(progress, 'getting existing list')
//           },
//         }
//       },
//     },
//     profile: {
//       listTokens: () => Promise.resolve([{ key: 'abcd1234' }, { key: 'abcd5678' }]),
//     },
//   })

//   t.teardown(reset)

//   await t.rejects(token.exec(['rm', 'abcd']), /Token ID "abcd" was ambiguous/)
// })

// t.test('token revoke unknown id errors', async t => {
//   t.plan(7)

//   const [token, reset] = tokenWithMocks({
//     npm: {
//       flatOptions: { registry: 'https://registry.npmjs.org' },
//       config: {
//         getCredentialsByURI: uri => {
//           t.equal(uri, 'https://registry.npmjs.org', 'requests correct registry')
//           return { token: 'thisisnotarealtoken' }
//         },
//       },
//     },
//     log: {
//       gauge: {
//         show: name => {
//           t.equal(name, 'token', 'starts a gauge')
//         },
//       },
//       newItem: (action, len) => {
//         t.equal(action, 'removing tokens')
//         t.equal(len, 0)
//         return {
//           info: (name, progress) => {
//             t.equal(name, 'token')
//             t.equal(progress, 'getting existing list')
//           },
//         }
//       },
//     },
//     profile: {
//       listTokens: () => Promise.resolve([{ key: 'abcd1234' }]),
//     },
//   })

//   t.teardown(reset)

//   await t.rejects(token.exec(['rm', 'efgh']), /Unknown token id or value "efgh"./)
// })

// t.test('token create', async t => {
//   t.plan(14)

//   const now = new Date().toISOString()
//   const password = 'thisisnotreallyapassword'

//   const [token, reset] = tokenWithMocks({
//     npm: {
//       flatOptions: {
//         registry: 'https://registry.npmjs.org',
//         cidr: ['10.0.0.0/8', '192.168.1.0/24'],
//       },
//       config: {
//         getCredentialsByURI: uri => {
//           t.equal(uri, 'https://registry.npmjs.org', 'requests correct registry')
//           return { token: 'thisisnotarealtoken' }
//         },
//       },
//     },
//     log: {
//       gauge: {
//         show: name => {
//           t.equal(name, 'token', 'starts a gauge')
//         },
//       },
//       info: (name, message) => {
//         t.equal(name, 'token')
//         t.equal(message, 'creating')
//       },
//     },
//     readUserInfo: {
//       password: () => Promise.resolve(password),
//     },
//     profile: {
//       createToken: (pw, readonly, cidr) => {
//         t.equal(pw, password)
//         t.equal(readonly, undefined)
//         t.same(cidr, ['10.0.0.0/8', '192.168.1.0/24'], 'defaults to empty array')
//         return {
//           key: 'abcd1234',
//           token: 'efgh5678',
//           created: now,
//           updated: now,
//           readonly: false,
//           cidr_whitelist: [],
//         }
//       },
//     },
//     output: spec => {
//       const lines = spec.split(/\r?\n/)
//       t.match(lines[1], 'token')
//       t.match(lines[1], 'efgh5678', 'prints the whole token')
//       t.match(lines[3], 'created')
//       t.match(lines[3], now, 'prints the correct timestamp')
//       t.match(lines[5], 'readonly')
//       t.match(lines[5], 'false', 'prints the readonly flag')
//       t.match(lines[7], 'cidr_whitelist')
//     },
//   })

//   t.teardown(reset)

//   await token.exec(['create'])
// })

// t.test('token create json output', async t => {
//   t.plan(9)

//   const now = new Date().toISOString()
//   const password = 'thisisnotreallyapassword'

//   const [token, reset] = tokenWithMocks({
//     npm: {
//       flatOptions: { registry: 'https://registry.npmjs.org', json: true },
//       config: {
//         getCredentialsByURI: uri => {
//           t.equal(uri, 'https://registry.npmjs.org', 'requests correct registry')
//           return { token: 'thisisnotarealtoken' }
//         },
//       },
//     },
//     log: {
//       gauge: {
//         show: name => {
//           t.equal(name, 'token', 'starts a gauge')
//         },
//       },
//       info: (name, message) => {
//         t.equal(name, 'token')
//         t.equal(message, 'creating')
//       },
//     },
//     readUserInfo: {
//       password: () => Promise.resolve(password),
//     },
//     profile: {
//       createToken: (pw, readonly, cidr) => {
//         t.equal(pw, password)
//         t.equal(readonly, undefined)
//         t.same(cidr, [], 'defaults to empty array')
//         return {
//           key: 'abcd1234',
//           token: 'efgh5678',
//           created: now,
//           updated: now,
//           readonly: false,
//           cidr_whitelist: [],
//         }
//       },
//     },
//     output: spec => {
//       t.type(spec, 'string', 'outputs a string')
//       const parsed = JSON.parse(spec)
//       t.same(
//         parsed,
//         { token: 'efgh5678', created: now, readonly: false, cidr_whitelist: [] },
//         'outputs the correct object'
//       )
//     },
//   })

//   t.teardown(reset)

//   await token.exec(['create'])
// })

// t.test('token create parseable output', async t => {
//   t.plan(11)

//   const now = new Date().toISOString()
//   const password = 'thisisnotreallyapassword'

//   let callCount = 0
//   const [token, reset] = tokenWithMocks({
//     npm: {
//       flatOptions: { registry: 'https://registry.npmjs.org', parseable: true },
//       config: {
//         getCredentialsByURI: uri => {
//           t.equal(uri, 'https://registry.npmjs.org', 'requests correct registry')
//           return { token: 'thisisnotarealtoken' }
//         },
//       },
//     },
//     log: {
//       gauge: {
//         show: name => {
//           t.equal(name, 'token', 'starts a gauge')
//         },
//       },
//       info: (name, message) => {
//         t.equal(name, 'token')
//         t.equal(message, 'creating')
//       },
//     },
//     readUserInfo: {
//       password: () => Promise.resolve(password),
//     },
//     profile: {
//       createToken: (pw, readonly, cidr) => {
//         t.equal(pw, password)
//         t.equal(readonly, undefined)
//         t.same(cidr, [], 'defaults to empty array')
//         return {
//           key: 'abcd1234',
//           token: 'efgh5678',
//           created: now,
//           updated: now,
//           readonly: false,
//           cidr_whitelist: [],
//         }
//       },
//     },
//     output: spec => {
//       ++callCount
//       if (callCount === 1) {
//         t.match(spec, 'token\tefgh5678', 'prints the token')
//       } else if (callCount === 2) {
//         t.match(spec, `created\t${now}`, 'prints the created timestamp')
//       } else if (callCount === 3) {
//         t.match(spec, 'readonly\tfalse', 'prints the readonly flag')
//       } else {
//         t.match(spec, 'cidr_whitelist\t', 'prints the cidr whitelist')
//       }
//     },
//   })

//   t.teardown(reset)

//   await token.exec(['create'])
// })

// t.test('token create ipv6 cidr', async t => {
//   t.plan(3)

//   const password = 'thisisnotreallyapassword'

//   const [token, reset] = tokenWithMocks({
//     npm: {
//       flatOptions: { registry: 'https://registry.npmjs.org', cidr: '::1/128' },
//       config: {
//         getCredentialsByURI: uri => {
//           t.equal(uri, 'https://registry.npmjs.org', 'requests correct registry')
//           return { token: 'thisisnotarealtoken' }
//         },
//       },
//     },
//     log: {
//       gauge: {
//         show: name => {
//           t.equal(name, 'token', 'starts a gauge')
//         },
//       },
//     },
//     readUserInfo: {
//       password: () => Promise.resolve(password),
//     },
//   })

//   t.teardown(reset)

//   await t.rejects(
//     token.exec(['create']),
//     {
//       code: 'EINVALIDCIDR',
//       message: /CIDR whitelist can only contain IPv4 addresses, ::1\/128 is IPv6/,
//     },
//     'returns correct error'
//   )
// })

// t.test('token create invalid cidr', async t => {
//   t.plan(3)

//   const password = 'thisisnotreallyapassword'

//   const [token, reset] = tokenWithMocks({
//     npm: {
//       flatOptions: { registry: 'https://registry.npmjs.org', cidr: 'apple/cider' },
//       config: {
//         getCredentialsByURI: uri => {
//           t.equal(uri, 'https://registry.npmjs.org', 'requests correct registry')
//           return { token: 'thisisnotarealtoken' }
//         },
//       },
//     },
//     log: {
//       gauge: {
//         show: name => {
//           t.equal(name, 'token', 'starts a gauge')
//         },
//       },
//     },
//     readUserInfo: {
//       password: () => Promise.resolve(password),
//     },
//   })

//   t.teardown(reset)

//   await t.rejects(
//     token.exec(['create']),
//     { code: 'EINVALIDCIDR', message: /CIDR whitelist contains invalid CIDR entry: apple\/cider/ },
//     'returns correct error'
//   )
// })
