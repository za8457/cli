'use strict'

const Edge = require('../lib/edge.js')
const Node = require('../lib/node.js')
const OverrideSet = require('../lib/override-set.js')
const t = require('tap')

t.test('constructor validation', (t) => {
  t.throws(() => {
    new Edge({})
  }, { message: 'must provide string spec' })

  t.throws(() => {
    new Edge({ spec: null })
  }, { message: 'must provide string spec' })

  t.throws(() => {
    new Edge({
      spec: '^1.0.0',
      type: 'workspace',
    })
  }, { message: 'workspace edges must be a symlink' })

  t.throws(() => {
    new Edge({
      spec: '^1.0.0',
      accept: null,
    })
  }, { message: 'accept field must be a string if provided' })

  t.throws(() => {
    new Edge({
      spec: '^1.0.0',
      name: null,
    })
  }, { message: 'must provide dependency name' })

  t.throws(() => {
    new Edge({
      name: 'root',
      spec: '^1.0.0',
      type: 'nonsense',
    })
  }, { message: /invalid type: nonsense/ })

  t.throws(() => {
    new Edge({
      name: 'root',
      spec: '^1.0.0',
      type: 'prod',
    })
  }, { message: 'must provide "from" node' })

  t.end()
})

t.test('prod dependency is valid', (t) => {
  const root = new Node({
    pkg: {
      name: 'root',
      dependencies: {
        prod: '1.x',
      },
    },
    path: '/root',
  })

  const prod = new Node({
    pkg: {
      name: 'prod',
      version: '1.0.0',
    },
    path: '/root/node_modules/prod',
    parent: root,
  })

  const edge = new Edge({
    from: root,
    type: 'prod',
    name: 'prod',
    spec: '1.x',
  })

  t.ok(edge.valid, 'edge is valid')
  t.ok(edge.satisfiedBy(prod), 'edge is satisfied by node')

  t.end()
})

t.test('nested peer dependency from the root is valid', (t) => {
  const root = new Node({
    pkg: {
      name: 'root',
      peerDependencies: {
        peer: '^1.0.0',
      },
    },
    path: '/root',
  })

  const peer = new Node({
    pkg: {
      name: 'peer',
      version: '1.0.0',
    },
    path: '/root/node_modules/peer',
    parent: root,
  })

  const edge = new Edge({
    from: root,
    type: 'peer',
    name: 'peer',
    spec: '^1.0.0',
  })

  t.ok(edge.valid, 'edge is valid')
  t.ok(edge.satisfiedBy(peer), 'edge is satisfied')

  t.end()
})

t.test('nested peer dependency from a child is invalid', (t) => {
  const root = new Node({
    pkg: {
      name: 'root',
      dependencies: {
        prod: '^1.0.0',
      },
    },
    path: '/root',
  })

  const prod = new Node({
    pkg: {
      name: 'prod',
      version: '1.0.0',
      peerDependencies: {
        peer: '^1.0.0',
      },
    },
    path: '/root/node_modules/prod',
    parent: root,
  })

  const peer = new Node({
    pkg: {
      name: 'peer',
      version: '1.0.0',
    },
    path: '/root/node_modules/prod/node_modules/peer',
    parent: root,
  })

  const edge = new Edge({
    from: prod,
    type: 'peer',
    name: 'peer',
    spec: '^1.0.0',
  })

  t.not(edge.valid, 'edge is not valid')
  t.not(edge.satisfiedBy(peer), 'edge is not satisfied')

  t.end()
})

t.test('parallel peer dependency from a child is valid', (t) => {
  const root = new Node({
    pkg: {
      name: 'root',
      dependencies: {
        prod: '^1.0.0',
      },
    },
    path: '/root',
  })

  const prod = new Node({
    pkg: {
      name: 'prod',
      version: '1.0.0',
      peerDependencies: {
        peer: '^1.0.0',
      },
    },
    path: '/root/node_modules/prod',
    parent: root,
  })

  const peer = new Node({
    pkg: {
      name: 'peer',
      version: '1.0.0',
    },
    path: '/root/node_modules/peer',
    parent: root,
  })

  const edge = new Edge({
    from: prod,
    type: 'peer',
    name: 'peer',
    spec: '^1.0.0',
  })

  t.ok(edge.valid, 'edge is valid')
  t.ok(edge.satisfiedBy(peer), 'edge is satisfied')

  t.end()
})

t.test('missing optional dep is valid', (t) => {
  const root = new Node({
    pkg: {
      name: 'root',
      optionalDependencies: {
        optional: '^1.0.0',
      },
    },
    path: '/root',
  })

  const edge = new Edge({
    from: root,
    type: 'optional',
    name: 'optional',
    spec: '^1.0.0',
  })

  t.not(edge.to, 'has no target')
  t.ok(edge.valid, 'edge is valid')

  t.end()
})

t.test('accept takes priority over spec', (t) => {
  const root = new Node({
    pkg: {
      name: 'root',
      dependencies: {
        prod: '^1.0.0',
      },
    },
    path: '/root',
  })

  const prod = new Node({
    pkg: {
      name: 'prod',
      version: '2.0.0',
    },
    path: '/root/node_modules/prod',
    parent: root,
  })

  const edge = new Edge({
    from: root,
    type: 'prod',
    name: 'prod',
    spec: '^1.0.0',
    accept: '^2.0.0',
  })

  t.ok(edge.valid, 'edge is valid')
  t.ok(edge.satisfiedBy(prod), 'edge is satisfied')

  t.end()
})

t.test('empty accept means accept anything', (t) => {
  const root = new Node({
    pkg: {
      name: 'root',
      dependencies: {
        prod: '^1.0.0',
      },
    },
    path: '/root',
  })

  const prod = new Node({
    pkg: {
      name: 'prod',
      version: '2.0.0',
    },
    path: '/root/node_modules/prod',
    parent: root,
  })

  const edge = new Edge({
    from: root,
    type: 'prod',
    name: 'prod',
    spec: '^1.0.0',
    accept: '',
  })

  t.ok(edge.valid, 'edge is valid')
  t.ok(edge.satisfiedBy(prod), 'edge is satisfied')

  t.end()
})

t.test('edge is not satisfied by node of differing name', (t) => {
  const root = new Node({
    pkg: {
      name: 'root',
      dependencies: {
        prod: '^1.0.0',
      },
    },
    path: '/root',
  })

  const notProd = new Node({
    pkg: {
      name: 'not-prod',
      version: '1.0.0',
    },
    path: '/root/node_modules/not-prod',
    parent: root,
  })

  const edge = new Edge({
    from: root,
    type: 'prod',
    name: 'prod',
    spec: '^1.0.0',
  })

  t.not(edge.valid, 'edge is not valid')
  t.not(edge.satisfiedBy(notProd), 'edge is not satisfied')

  t.end()
})

t.test('override takes priority over spec', (t) => {
  const root = new Node({
    pkg: {
      name: 'root',
      dependencies: {
        prod: '^1.0.0',
      },
      overrides: {
        'prod-prod': '^2.0.0',
      },
    },
    path: '/root',
    loadOverrides: true,
  })

  const prod = new Node({
    pkg: {
      name: 'prod',
      version: '1.0.0',
      dependencies: {
        'prod-prod': '^1.0.0',
      },
    },
    path: '/root/node_modules/prod',
    parent: root,
  })

  const prodProd = new Node({
    pkg: {
      name: 'prod-prod',
      version: '2.0.0',
    },
    path: '/root/node_modules/prod-prod',
    parent: root,
  })

  const edge = new Edge({
    from: prod,
    type: 'prod',
    name: 'prod-prod',
    spec: '^1.0.0',
  })

  t.ok(edge.valid, 'edge is valid')
  t.ok(edge.satisfiedBy(prodProd), 'edge is satisfied')

  const printableEdge = edge.toJSON()
  t.equal(printableEdge.overridden, '^2.0.0', 'printableEdge recognizes override')

  const explanation = edge.explain()
  t.equal(explanation.overridden, true, 'overridden flag is set')
  t.equal(explanation.rawSpec, '^1.0.0', 'rawSpec holds original spec')
  t.equal(explanation.spec, '^2.0.0', 'spec holds overridden spec')

  t.end()
})

t.test('non-applicable overrides are ignored', (t) => {
  const root = new Node({
    pkg: {
      name: 'root',
      dependencies: {
        prod: '^1.0.0',
      },
      overrides: {
        'not-prod': '^2.0.0',
      },
    },
    path: '/root',
    loadOverrides: true,
  })

  const prod = new Node({
    pkg: {
      name: 'prod',
      version: '1.0.0',
      dependencies: {
        'prod-prod': '^1.0.0',
      },
    },
    path: '/root/node_modules/prod',
    parent: root,
  })

  const prodProd = new Node({
    pkg: {
      name: 'prod-prod',
      version: '1.0.0',
    },
    path: '/root/node_modules/prod-prod',
    parent: root,
  })

  const edge = new Edge({
    from: prod,
    type: 'prod',
    name: 'prod-prod',
    spec: '^1.0.0',
  })

  t.ok(edge.valid, 'edge is valid')
  t.ok(edge.satisfiedBy(prodProd), 'edge is satisfied')

  const printableEdge = edge.toJSON()
  t.not(printableEdge.overridden, 'printableEdge does not set overridden')

  const explanation = edge.explain()
  t.not(explanation.overridden, 'explanation does not set overridden')
  t.same(explanation.rawSpec, null, 'rawSpec is null')
  t.equal(explanation.spec, '^1.0.0', 'spec holds original spec')

  t.end()
})

t.test('overrides propagate from node to edge at reload', (t) => {
  const root = new Node({
    pkg: {
      name: 'root',
      dependencies: {
        prod: '^1.0.0',
      },
    },
    path: '/root',
  })

  const edge = new Edge({
    from: root,
    type: 'prod',
    name: 'prod',
    spec: '^1.0.0',
  })

  t.not(edge.overrides, 'edge starts with no overrides')
  root.overrides = new OverrideSet({ overrides: {} })
  t.not(edge.overrides, 'setting overrides on from has no effect')
  edge.reload()
  t.ok(edge.overrides, 'edge has overrides after reload')
  delete root.overrides
  edge.reload()
  t.not(edge.overrides, 'overrides are removed')

  t.end()
})

t.test('override references', (t) => {
  t.test('from dependencies', (t) => {
    const root = new Node({
      pkg: {
        name: 'root',
        dependencies: {
          prod: '^2.0.0',
        },
        overrides: {
          'prod-prod': '$prod',
        },
      },
      path: '/root',
      loadOverrides: true,
    })

    const prod = new Node({
      pkg: {
        name: 'prod',
        version: '2.0.0',
        dependencies: {
          'prod-prod': '^1.0.0',
        },
      },
      path: '/root/node_modules/prod',
      parent: root,
    })

    const prodProd = new Node({
      pkg: {
        name: 'prod-prod',
        version: '2.0.0',
      },
      path: '/root/node_modules/prod-prod',
      parent: root,
    })

    const edge = new Edge({
      from: prod,
      type: 'prod',
      name: 'prod-prod',
      spec: '^1.0.0',
    })

    t.ok(edge.valid, 'edge is valid')
    t.ok(edge.satisfiedBy(prodProd), 'edge is satisfied')
    t.equal(edge.rawSpec, '^1.0.0', 'rawSpec is original spec')
    t.equal(edge.spec, '^2.0.0', 'spec is overridden by reference')

    t.end()
  })

  t.test('from devDependencies', (t) => {
    const root = new Node({
      pkg: {
        name: 'root',
        devDependencies: {
          dev: '^2.0.0',
        },
        overrides: {
          'dev-prod': '$dev',
        },
      },
      path: '/root',
      loadOverrides: true,
    })

    const dev = new Node({
      pkg: {
        name: 'dev',
        version: '2.0.0',
        dependencies: {
          'dev-prod': '^1.0.0',
        },
      },
      path: '/root/node_modules/dev',
      parent: root,
    })

    const devProd = new Node({
      pkg: {
        name: 'dev-prod',
        version: '2.0.0',
      },
      path: '/root/node_modules/dev-prod',
      parent: root,
    })

    const edge = new Edge({
      from: dev,
      type: 'prod',
      name: 'dev-prod',
      spec: '^1.0.0',
    })

    t.ok(edge.valid, 'edge is valid')
    t.ok(edge.satisfiedBy(devProd), 'edge is satisfied')
    t.equal(edge.rawSpec, '^1.0.0', 'rawSpec is original spec')
    t.equal(edge.spec, '^2.0.0', 'spec is overridden by reference')

    t.end()
  })

  t.test('from optionalDependencies', (t) => {
    const root = new Node({
      pkg: {
        name: 'root',
        optionalDependencies: {
          optional: '^2.0.0',
        },
        overrides: {
          'optional-prod': '$optional',
        },
      },
      path: '/root',
      loadOverrides: true,
    })

    const optional = new Node({
      pkg: {
        name: 'optional',
        version: '2.0.0',
        dependencies: {
          'optional-prod': '^1.0.0',
        },
      },
      path: '/root/node_modules/optional',
      parent: root,
    })

    const optionalProd = new Node({
      pkg: {
        name: 'optional-prod',
        version: '2.0.0',
      },
      path: '/root/node_modules/optional-prod',
      parent: root,
    })

    const edge = new Edge({
      from: optional,
      type: 'prod',
      name: 'optional-prod',
      spec: '^1.0.0',
    })

    t.ok(edge.valid, 'edge is valid')
    t.ok(edge.satisfiedBy(optionalProd), 'edge is satisfied')
    t.equal(edge.rawSpec, '^1.0.0', 'rawSpec is original spec')
    t.equal(edge.spec, '^2.0.0', 'spec is overridden by reference')

    t.end()
  })

  t.test('from peerDependencies', (t) => {
    const root = new Node({
      pkg: {
        name: 'root',
        peerDependencies: {
          peer: '^2.0.0',
        },
        overrides: {
          'peer-prod': '$peer',
        },
      },
      path: '/root',
      loadOverrides: true,
    })

    const peer = new Node({
      pkg: {
        name: 'peer',
        version: '2.0.0',
        dependencies: {
          'peer-prod': '^1.0.0',
        },
      },
      path: '/root/node_modules/peer',
      parent: root,
    })

    const peerProd = new Node({
      pkg: {
        name: 'peer-prod',
        version: '2.0.0',
      },
      path: '/root/node_modules/peer-prod',
      parent: root,
    })

    const edge = new Edge({
      from: peer,
      type: 'prod',
      name: 'peer-prod',
      spec: '^1.0.0',
    })

    t.ok(edge.valid, 'edge is valid')
    t.ok(edge.satisfiedBy(peerProd), 'edge is satisfied')
    t.equal(edge.rawSpec, '^1.0.0', 'rawSpec is original spec')
    t.equal(edge.spec, '^2.0.0', 'spec is overridden by reference')

    t.end()
  })

  t.end()
})

t.test('incorrect override makes edge invalid', (t) => {
  const root = new Node({
    pkg: {
      name: 'root',
      dependencies: {
        prod: '^1.0.0',
      },
      overrides: {
        'prod-prod': '^2.0.0',
      },
    },
    path: '/root',
    loadOverrides: true,
  })

  const prod = new Node({
    pkg: {
      name: 'prod',
      version: '1.0.0',
      dependencies: {
        'prod-prod': '^1.0.0',
      },
    },
    path: '/root/node_modules/prod',
    parent: root,
  })

  const prodProd = new Node({
    pkg: {
      name: 'prod-prod',
      version: '1.0.0',
    },
    path: '/root/node_modules/prod-prod',
    parent: root,
  })

  const edge = new Edge({
    from: prod,
    type: 'prod',
    name: 'prod-prod',
    spec: '^1.0.0',
  })

  t.equal(edge.rawSpec, '^1.0.0', 'rawSpec is original spec')
  t.equal(edge.spec, '^2.0.0', 'spec is overridden')
  t.not(edge.valid, 'edge is not valid')
  t.not(edge.satisfiedBy(prodProd), 'edge is not satisfied')

  t.end()
})
// const old = new Edge({
//   from: a,
//   type: 'peer',
//   name: 'b',
//   spec: '1.2.3',
// })
// const neu = new Edge({
//   from: a,
//   type: 'prod',
//   name: 'b',
//   spec: '*',
// })
// t.matchSnapshot(old, 'clobbered edge')
// t.matchSnapshot(neu, 'clobbering edge')
//
// reset(a)
// reset(b)
//
// const abInvalid = new Edge({
//   from: a,
//   name: 'b',
//   spec: '1.69.420-nice',
//   type: 'optional',
// })
// t.matchSnapshot(abInvalid, 'invalid dependency')
// // make it valid, and then reload
// b.package.version = '1.69.420-nice'
// abInvalid.reload(true)
// t.equal(abInvalid.valid, true, 'valid after updating target and hard reload')
// // put it back for other tests
// b.package.version = '1.2.3'
//
// const moving = new Edge({
//   from: bb,
//   name: 'aa',
//   spec: '',
//   type: 'prod',
// })
// const explBeforeMove = moving.explain()
// t.matchSnapshot(moving, 'old location, missing dep')
// bb.parent = a
// moving.reload()
// const explAfterMove = moving.explain()
// t.not(explBeforeMove, explAfterMove, 'moving reloads the explanation')
// t.matchSnapshot(moving, 'new location, found dep')
// bb.parent = top
// moving.reload()
// t.matchSnapshot(moving, 'new location, missing dep again')
// new Edge({
//   from: bb,
//   name: 'aa',
//   spec: '*',
//   type: 'dev',
// })
// t.matchSnapshot(moving, 'clobbered and detached')
//
// t.throws(() => new Edge({
//   from: top,
//   type: 'prod',
//   name: 'yoinks',
//   spec: { yoinks: '1.2.3' },
// }), new TypeError('must provide string spec'))
//
// t.throws(() => new Edge({
//   from: top,
//   type: 'prod',
//   name: 'yoinks',
//   spec: '1.x',
//   accept: { yoinks: '2.2.3' },
// }), new TypeError('accept field must be a string if provided'))
//
// t.throws(() => new Edge({
//   from: top,
//   type: 'not a valid type',
//   name: 'yoinks',
//   spec: '*',
// }), new TypeError('invalid type: not a valid type\n(valid types are: '))
//
// t.throws(() => new Edge({
//   type: 'prod',
//   spec: '*',
//   from: top,
// }), new TypeError('must provide dependency name'))
//
// t.throws(() => new Edge({
//   type: 'prod',
//   name: 'foo',
//   spec: '',
// }), new TypeError('must provide "from" node'))
//
// t.throws(() => new Edge({
//   type: 'workspace',
//   name: 'foo',
//   spec: '*',
// }), new TypeError('workspace edges must be a symlink'))
//
// t.test('convenience type getter flags', async t => {
//   t.equal(new Edge({
//     from: a,
//     type: 'workspace',
//     name: 'foo',
//     spec: 'file:bar/baz',
//   }).workspace, true, 'workspace convenience getter')
//
//   t.equal(new Edge({
//     from: a,
//     type: 'prod',
//     name: 'foo',
//     spec: '*',
//   }).prod, true, 'prod convenience getter')
//
//   t.equal(new Edge({
//     from: a,
//     type: 'dev',
//     name: 'foo',
//     spec: '*',
//   }).dev, true, 'dev convenience getter')
//
//   t.equal(new Edge({
//     from: a,
//     type: 'optional',
//     name: 'foo',
//     spec: '*',
//   }).optional, true, 'optional convenience getter')
//
//   t.equal(new Edge({
//     from: a,
//     type: 'peer',
//     name: 'foo',
//     spec: '*',
//   }).peer, true, 'peer convenience getter')
//
//   t.equal(new Edge({
//     from: a,
//     type: 'optional',
//     name: 'foo',
//     spec: '*',
//   }).optional, true, 'optional convenience getter')
//
//   t.equal(new Edge({
//     from: a,
//     type: 'peerOptional',
//     name: 'foo',
//     spec: '*',
//   }).peer, true, 'peer convenience getter for peerOptional edge')
//
//   t.equal(new Edge({
//     from: a,
//     type: 'peerOptional',
//     name: 'foo',
//     spec: '*',
//   }).optional, true, 'optional convenience getter for peerOptional edge')
//
//   const explainEdge = new Edge({
//     from: a,
//     type: 'peerOptional',
//     name: 'foo',
//     spec: '*',
//   })
//   const expl = explainEdge.explain([])
//   t.equal(explainEdge.explain(), expl)
//   t.matchSnapshot(expl, 'explanation')
//   explainEdge.detach()
//   t.not(explainEdge.explain(), expl)
// })
//
// // FIXME: once we drop support to node10 we can remove this
// const normalizeNode10compatSnapshots = str =>
//   str
//     .replace(/\n +/g, '\n')
//     .replace(/\n\}/g, ' }')
//     .replace(/ArboristEdge /g, '')
//
// const printableTo = {
//   ...b,
//   location: '/node_modules/b',
// }
// const printableFrom = {
//   ...a,
//   resolve () {
//     return printableTo
//   },
//   location: '',
// }
// const printable = new Edge({
//   from: printableFrom,
//   type: 'prod',
//   name: 'b',
//   spec: '1.2.3',
// })
// t.matchSnapshot(
//   normalizeNode10compatSnapshots(
//     util.inspect(printable)
//   ),
//   'should return a human-readable representation of the edge obj'
// )
// printable.peerConflicted = true
// t.matchSnapshot(
//   normalizeNode10compatSnapshots(
//     util.inspect(printable)
//   ),
//   'return a human-readable representation of the edge obj, peerConflicted=true'
// )
//
// const minimalPrintableFrom = {
//   ...a,
//   resolve () {
//     return null
//   },
// }
// const minimalPrintable = new Edge({
//   from: minimalPrintableFrom,
//   type: 'dev',
//   name: 'b',
//   spec: '1.2.3',
// })
// t.match(
//   minimalPrintable.toJSON(),
//   {
//     name: 'b',
//     spec: '1.2.3',
//     type: 'dev',
//     error: 'MISSING',
//   },
//   'should return a minimal human-readable representation of the edge obj'
// )
//
// const bundleChild = {
//   name: 'bundle-child',
//   edgesOut: new Map(),
//   edgesIn: new Set(),
//   explain: () => 'bundleChild explanation',
//   package: { name: 'bundle-child', version: '1.2.3' },
//   get version () {
//     return this.package.version
//   },
//   isTop: false,
//   parent: top,
//   resolve (n) {
//     return this.parent.resolve(n)
//   },
//   addEdgeOut (edge) {
//     this.edgesOut.set(edge.name, edge)
//   },
//   addEdgeIn (edge) {
//     this.edgesIn.add(edge)
//   },
// }
//
// const bundleParent = {
//   name: 'bundle-parent',
//   edgesOut: new Map(),
//   edgesIn: new Set(),
//   explain: () => 'bundleParent explanation',
//   package: { name: 'bundle-parent', version: '5.6.7', bundleDependencies: ['bundle-child'] },
//   get version () {
//     return this.package.version
//   },
//   isTop: false,
//   parent: top,
//   resolve (n) {
//     return n === 'bundle-child' ? bundleChild : undefined
//   },
//   addEdgeOut (edge) {
//     this.edgesOut.set(edge.name, edge)
//   },
//   addEdgeIn (edge) {
//     this.edgesIn.add(edge)
//   },
// }
//
// const bundledEdge = new Edge({
//   from: bundleParent,
//   type: 'prod',
//   name: 'bundle-child',
//   spec: '1.2.3',
// })
//
// t.ok(bundledEdge.satisfiedBy(bundleChild), 'bundled dependency')
// const fromBundleDependencies = bundledEdge.from &&
//   bundledEdge.from.package.bundleDependencies
// t.same(fromBundleDependencies, ['bundle-child'], 'edge.from bundledDependencies as expected')
// t.same(bundledEdge.name, 'bundle-child', 'edge name as expected')
// t.equal(bundledEdge.bundled, true, 'bundled prop is true')
// t.same(bundledEdge.explain(), {
//   type: 'prod',
//   name: 'bundle-child',
//   spec: '1.2.3',
//   bundled: true,
//   from: bundleParent.explain(),
// }, 'bundled edge.explain as expected')
//
// t.test('override references find the correct root', (t) => {
//   const overrides = new OverrideSet({
//     overrides: {
//       foo: '$foo',
//     },
//   })
//
//   const root = {
//     name: 'root',
//     packageName: 'root',
//     edgesOut: new Map(),
//     edgesIn: new Set(),
//     explain: () => 'root node explanation',
//     package: {
//       name: 'root',
//       version: '1.2.3',
//       dependencies: {
//         foo: '^1.0.0',
//       },
//       overrides: {
//         foo: '$foo',
//       },
//     },
//     get version () {
//       return this.package.version
//     },
//     isTop: true,
//     parent: null,
//     overrides,
//     resolve (n) {
//       return n === 'foo' ? foo : null
//     },
//     addEdgeOut (edge) {
//       this.edgesOut.set(edge.name, edge)
//     },
//     addEdgeIn (edge) {
//       this.edgesIn.add(edge)
//     },
//   }
//
//   const foo = {
//     name: 'foo',
//     packageName: 'foo',
//     edgesOut: new Map(),
//     edgesIn: new Set(),
//     explain: () => 'foo node explanation',
//     package: {
//       name: 'foo',
//       version: '1.2.3',
//       dependencies: {},
//     },
//     get version () {
//       return this.package.version
//     },
//     parent: root,
//     root: root,
//     resolve (n) {
//       return n === 'bar' ? bar : this.parent.resolve(n)
//     },
//     addEdgeOut (edge) {
//       this.edgesOut.set(edge.name, edge)
//     },
//     addEdgeIn (edge) {
//       this.edgesIn.add(edge)
//     },
//   }
//   foo.overrides = overrides.getNodeRule(foo)
//
//   const bar = {
//     name: 'bar',
//     packageName: 'bar',
//     edgesOut: new Map(),
//     edgesIn: new Set(),
//     explain: () => 'bar node explanation',
//     package: {
//       name: 'bar',
//       version: '1.2.3',
//       dependencies: {
//         foo: '^2.0.0',
//       },
//     },
//     get version () {
//       return this.package.version
//     },
//     parent: foo,
//     root: root,
//     resolve (n) {
//       return this.parent.resolve(n)
//     },
//     addEdgeOut (edge) {
//       this.edgesOut.set(edge.name, edge)
//     },
//     addEdgeIn (edge) {
//       this.edgesIn.add(edge)
//     },
//   }
//   bar.overrides = foo.overrides.getNodeRule(bar)
//
//   const virtualBar = {
//     name: 'bar',
//     packageName: 'bar',
//     edgesOut: new Map(),
//     edgesIn: new Set(),
//     explain: () => 'bar node explanation',
//     package: {
//       name: 'bar',
//       version: '1.2.3',
//       dependencies: {
//         foo: '^2.0.0',
//       },
//     },
//     parent: null,
//     root: null,
//     sourceReference: bar,
//     get version () {
//       return this.package.version
//     },
//     resolve (n) {
//       return bar.resolve(n)
//     },
//     addEdgeOut (edge) {
//       this.edgesOut.set(edge.name, edge)
//     },
//     addEdgeIn (edge) {
//       this.edgesIn.add(edge)
//     },
//   }
//   virtualBar.overrides = overrides
//
//   const edge = new Edge({
//     from: virtualBar,
//     type: 'prod',
//     spec: '^2.0.0',
//     name: 'foo',
//     overrides: overrides.getEdgeRule({ name: 'foo', spec: '^2.0.0' }),
//   })
//
//   t.ok(edge.valid, 'edge is valid')
//   t.end()
// })
//
// t.test('shrinkwrapped and bundled deps are not overridden and remain valid', (t) => {
//   const overrides = new OverrideSet({
//     overrides: {
//       bar: '^2.0.0',
//     },
//   })
//
//   const root = {
//     name: 'root',
//     packageName: 'root',
//     edgesOut: new Map(),
//     edgesIn: new Set(),
//     explain: () => 'root node explanation',
//     package: {
//       name: 'root',
//       version: '1.2.3',
//       dependencies: {
//         foo: '^1.0.0',
//       },
//       overrides: {
//         bar: '^2.0.0',
//       },
//     },
//     get version () {
//       return this.package.version
//     },
//     isTop: true,
//     parent: null,
//     overrides,
//     resolve (n) {
//       return n === 'foo' ? foo : null
//     },
//     addEdgeOut (edge) {
//       this.edgesOut.set(edge.name, edge)
//     },
//     addEdgeIn (edge) {
//       this.edgesIn.add(edge)
//     },
//   }
//
//   const foo = {
//     name: 'foo',
//     packageName: 'foo',
//     edgesOut: new Map(),
//     edgesIn: new Set(),
//     explain: () => 'foo node explanation',
//     hasShrinkwrap: true,
//     package: {
//       name: 'foo',
//       version: '1.2.3',
//       dependencies: {
//         bar: '^1.0.0',
//       },
//     },
//     get version () {
//       return this.package.version
//     },
//     parent: root,
//     root,
//     resolve (n) {
//       return n === 'bar' ? bar : this.parent.resolve(n)
//     },
//     addEdgeOut (edge) {
//       this.edgesOut.set(edge.name, edge)
//     },
//     addEdgeIn (edge) {
//       this.edgesIn.add(edge)
//     },
//   }
//   foo.overrides = overrides.getNodeRule(foo)
//
//   const bar = {
//     name: 'bar',
//     packageName: 'bar',
//     edgesOut: new Map(),
//     edgesIn: new Set(),
//     explain: () => 'bar node explanation',
//     inShrinkwrap: true,
//     package: {
//       name: 'bar',
//       version: '1.2.3',
//       dependencies: {},
//     },
//     get version () {
//       return this.package.version
//     },
//     parent: foo,
//     root,
//     resolve (n) {
//       return this.parent.resolve(n)
//     },
//     addEdgeOut (edge) {
//       this.edgesOut.set(edge.name, edge)
//     },
//     addEdgeIn (edge) {
//       this.edgesIn.add(edge)
//     },
//   }
//   bar.overrides = foo.overrides.getNodeRule(bar)
//
//   const edge = new Edge({
//     from: foo,
//     type: 'prod',
//     spec: '^1.0.0',
//     name: 'bar',
//     overrides: overrides.getEdgeRule({ name: 'bar', spec: '^1.0.0' }),
//   })
//
//   t.ok(edge.valid, 'edge is valid')
//   t.end()
// })
