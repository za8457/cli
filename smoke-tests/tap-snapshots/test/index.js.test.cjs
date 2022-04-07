/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/index.js TAP npm (no args) > should have expected no args output 1`] = `
npm <command>

Usage:

npm install        install all the dependencies in your project
npm install <foo>  add the <foo> dependency to your project
npm test           run this project's tests
npm run <foo>      run the script named <foo>
npm <command> -h   quick help on <command>
npm -l             display usage info for all commands
npm help <term>    search for help on <term>
npm help npm       more involved overview

All commands:

    access, adduser, audit, bin, bugs, cache, ci, completion,
    config, dedupe, deprecate, diff, dist-tag, docs, doctor,
    edit, exec, explain, explore, find-dupes, fund, get, help,
    hook, init, install, install-ci-test, install-test, link,
    ll, login, logout, ls, org, outdated, owner, pack, ping,
    pkg, prefix, profile, prune, publish, rebuild, repo,
    restart, root, run-script, search, set, set-script,
    shrinkwrap, star, stars, start, stop, team, test, token,
    uninstall, unpublish, unstar, update, version, view, whoami

Specify configs in the ini-formatted file:
    {CWD}/smoke-tests/test/tap-testdir-index/.npmrc
or on the command line via: npm <command> --key=value

More configuration info: npm help config
Configuration fields: npm help 7 config

npm {CWD}

`

exports[`test/index.js TAP npm diff > should have expected diff output 1`] = `
diff --git a/package.json b/package.json
index v1.0.4..v1.1.1 100644
--- a/package.json
+++ b/package.json
@@ -1,15 +1,21 @@
 {
   "name": "abbrev",
-  "version": "1.0.4",
+  "version": "1.1.1",
   "description": "Like ruby's abbrev module, but in js",
   "author": "Isaac Z. Schlueter <i@izs.me>",
-  "main": "./lib/abbrev.js",
+  "main": "abbrev.js",
   "scripts": {
-    "test": "node lib/abbrev.js"
+    "test": "tap test.js --100",
+    "preversion": "npm test",
+    "postversion": "npm publish",
+    "postpublish": "git push origin --all; git push origin --tags"
   },
   "repository": "http://github.com/isaacs/abbrev-js",
-  "license": {
-    "type": "MIT",
-    "url": "https://github.com/isaacs/abbrev-js/raw/master/LICENSE"
-  }
+  "license": "ISC",
+  "devDependencies": {
+    "tap": "^10.1"
+  },
+  "files": [
+    "abbrev.js"
+  ]
 }
diff --git a/LICENSE b/LICENSE
index v1.0.4..v1.1.1 100644
--- a/LICENSE
+++ b/LICENSE
@@ -1,4 +1,27 @@
-Copyright 2009, 2010, 2011 Isaac Z. Schlueter.
+This software is dual-licensed under the ISC and MIT licenses.
+You may use this software under EITHER of the following licenses.
+
+----------
+
+The ISC License
+
+Copyright (c) Isaac Z. Schlueter and Contributors
+
+Permission to use, copy, modify, and/or distribute this software for any
+purpose with or without fee is hereby granted, provided that the above
+copyright notice and this permission notice appear in all copies.
+
+THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
+WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
+MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
+ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
+WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
+ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
+IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
+
+----------
+
+Copyright Isaac Z. Schlueter and Contributors
 All rights reserved.
 
 Permission is hereby granted, free of charge, to any person
diff --git a/lib/abbrev.js b/lib/abbrev.js
deleted file mode 100644
index v1.0.4..v1.1.1 
--- a/lib/abbrev.js
+++ b/lib/abbrev.js
@@ -1,111 +0,0 @@
-
-module.exports = exports = abbrev.abbrev = abbrev
-
-abbrev.monkeyPatch = monkeyPatch
-
-function monkeyPatch () {
-  Object.defineProperty(Array.prototype, 'abbrev', {
-    value: function () { return abbrev(this) },
-    enumerable: false, configurable: true, writable: true
-  })
-
-  Object.defineProperty(Object.prototype, 'abbrev', {
-    value: function () { return abbrev(Object.keys(this)) },
-    enumerable: false, configurable: true, writable: true
-  })
-}
-
-function abbrev (list) {
-  if (arguments.length !== 1 || !Array.isArray(list)) {
-    list = Array.prototype.slice.call(arguments, 0)
-  }
-  for (var i = 0, l = list.length, args = [] ; i < l ; i ++) {
-    args[i] = typeof list[i] === "string" ? list[i] : String(list[i])
-  }
-
-  // sort them lexicographically, so that they're next to their nearest kin
-  args = args.sort(lexSort)
-
-  // walk through each, seeing how much it has in common with the next and previous
-  var abbrevs = {}
-    , prev = ""
-  for (var i = 0, l = args.length ; i < l ; i ++) {
-    var current = args[i]
-      , next = args[i + 1] || ""
-      , nextMatches = true
-      , prevMatches = true
-    if (current === next) continue
-    for (var j = 0, cl = current.length ; j < cl ; j ++) {
-      var curChar = current.charAt(j)
-      nextMatches = nextMatches && curChar === next.charAt(j)
-      prevMatches = prevMatches && curChar === prev.charAt(j)
-      if (!nextMatches && !prevMatches) {
-        j ++
-        break
-      }
-    }
-    prev = current
-    if (j === cl) {
-      abbrevs[current] = current
-      continue
-    }
-    for (var a = current.substr(0, j) ; j <= cl ; j ++) {
-      abbrevs[a] = current
-      a += current.charAt(j)
-    }
-  }
-  return abbrevs
-}
-
-function lexSort (a, b) {
-  return a === b ? 0 : a > b ? 1 : -1
-}
-
-
-// tests
-if (module === require.main) {
-
-var assert = require("assert")
-var util = require("util")
-
-console.log("running tests")
-function test (list, expect) {
-  var actual = abbrev(list)
-  assert.deepEqual(actual, expect,
-    "abbrev("+util.inspect(list)+") === " + util.inspect(expect) + "/n"+
-    "actual: "+util.inspect(actual))
-  actual = abbrev.apply(exports, list)
-  assert.deepEqual(abbrev.apply(exports, list), expect,
-    "abbrev("+list.map(JSON.stringify).join(",")+") === " + util.inspect(expect) + "/n"+
-    "actual: "+util.inspect(actual))
-}
-
-test([ "ruby", "ruby", "rules", "rules", "rules" ],
-{ rub: 'ruby'
-, ruby: 'ruby'
-, rul: 'rules'
-, rule: 'rules'
-, rules: 'rules'
-})
-test(["fool", "foom", "pool", "pope"],
-{ fool: 'fool'
-, foom: 'foom'
-, poo: 'pool'
-, pool: 'pool'
-, pop: 'pope'
-, pope: 'pope'
-})
-test(["a", "ab", "abc", "abcd", "abcde", "acde"],
-{ a: 'a'
-, ab: 'ab'
-, abc: 'abc'
-, abcd: 'abcd'
-, abcde: 'abcde'
-, ac: 'acde'
-, acd: 'acde'
-, acde: 'acde'
-})
-
-console.log("pass")
-
-}
/ No newline at end of file
diff --git a/abbrev.js b/abbrev.js
new file mode 100644
index v1.0.4..v1.1.1 
--- a/abbrev.js
+++ b/abbrev.js
@@ -0,0 +1,61 @@
+module.exports = exports = abbrev.abbrev = abbrev
+
+abbrev.monkeyPatch = monkeyPatch
+
+function monkeyPatch () {
+  Object.defineProperty(Array.prototype, 'abbrev', {
+    value: function () { return abbrev(this) },
+    enumerable: false, configurable: true, writable: true
+  })
+
+  Object.defineProperty(Object.prototype, 'abbrev', {
+    value: function () { return abbrev(Object.keys(this)) },
+    enumerable: false, configurable: true, writable: true
+  })
+}
+
+function abbrev (list) {
+  if (arguments.length !== 1 || !Array.isArray(list)) {
+    list = Array.prototype.slice.call(arguments, 0)
+  }
+  for (var i = 0, l = list.length, args = [] ; i < l ; i ++) {
+    args[i] = typeof list[i] === "string" ? list[i] : String(list[i])
+  }
+
+  // sort them lexicographically, so that they're next to their nearest kin
+  args = args.sort(lexSort)
+
+  // walk through each, seeing how much it has in common with the next and previous
+  var abbrevs = {}
+    , prev = ""
+  for (var i = 0, l = args.length ; i < l ; i ++) {
+    var current = args[i]
+      , next = args[i + 1] || ""
+      , nextMatches = true
+      , prevMatches = true
+    if (current === next) continue
+    for (var j = 0, cl = current.length ; j < cl ; j ++) {
+      var curChar = current.charAt(j)
+      nextMatches = nextMatches && curChar === next.charAt(j)
+      prevMatches = prevMatches && curChar === prev.charAt(j)
+      if (!nextMatches && !prevMatches) {
+        j ++
+        break
+      }
+    }
+    prev = current
+    if (j === cl) {
+      abbrevs[current] = current
+      continue
+    }
+    for (var a = current.substr(0, j) ; j <= cl ; j ++) {
+      abbrevs[a] = current
+      a += current.charAt(j)
+    }
+  }
+  return abbrevs
+}
+
+function lexSort (a, b) {
+  return a === b ? 0 : a > b ? 1 : -1
+}

`

exports[`test/index.js TAP npm explain > should have expected explain output 1`] = `
abbrev@1.0.4
smoke-tests/node_modules/abbrev
  abbrev@"^1.0.4" from smoke-tests@1.0.0
  smoke-tests
    smoke-tests@1.0.0
    node_modules/smoke-tests
      workspace smoke-tests from the root project

`

exports[`test/index.js TAP npm fund > should have expected fund output 1`] = `
npm@8.6.0
\`-- https://github.com/sponsors/isaacs
    \`-- glob@7.2.0, rimraf@3.0.2, tap@16.0.1, libtap@1.3.0, promise-all-reject-late@1.0.1


`

exports[`test/index.js TAP npm init > should have successful npm init result 1`] = `
Wrote to {CWD}/smoke-tests/package.json:

{
  "name": "smoke-tests",
  "description": "The npm cli smoke tests",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "lint": "eslint /"**/*.js/"",
    "postlint": "template-oss-check",
    "lintfix": "npm run lint -- --fix",
    "preversion": "npm test",
    "postversion": "git push origin --follow-tags",
    "snap": "tap",
    "test": "tap",
    "template-oss-apply": "template-oss-apply --force",
    "posttest": "npm run lint",
    "hello": "echo Hello"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/npm/cli.git",
    "directory": "smoke-tests"
  },
  "dependencies": {
    "abbrev": "1.0.4",
    "minify-registry-metadata": "^2.2.0"
  },
  "devDependencies": {
    "@npmcli/template-oss": "3.3.2",
    "tap": "^16.0.1"
  },
  "author": "GitHub Inc.",
  "license": "ISC",
  "templateOSS": {
    "//@npmcli/template-oss": "This file is partially managed by @npmcli/template-oss. Edits may be overwritten.",
    "version": "3.3.2",
    "workspaceRepo": false
  },
  "tap": {
    "no-coverage": true
  },
  "files": [
    "bin/",
    "lib/"
  ],
  "engines": {
    "node": "^12.13.0 || ^14.15.0 || >=16.0.0"
  },
  "bugs": {
    "url": "https://github.com/npm/cli/issues"
  },
  "homepage": "https://github.com/npm/cli#readme",
  "main": ".eslintrc.js",
  "directories": {
    "lib": "lib",
    "test": "test"
  },
  "keywords": []
}



`

exports[`test/index.js TAP npm install dev dep > should have expected dev dep added reify output 1`] = `

up to date 

134 packages are looking for funding
  run \`npm fund\` for details

`

exports[`test/index.js TAP npm install prodDep@version > should have expected install reify output 1`] = `

up to date 

134 packages are looking for funding
  run \`npm fund\` for details

`

exports[`test/index.js TAP npm ls > should have expected ls output 1`] = `
npm {CWD}
\`-- smoke-tests@1.0.0 -> ./smoke-tests
  +-- @npmcli/template-oss@3.3.2
  +-- abbrev@1.0.4
  +-- minify-registry-metadata@2.2.0
  +-- promise-all-reject-late@1.0.1
  \`-- tap@16.0.1


`

exports[`test/index.js TAP npm outdated > should have expected outdated output 1`] = `
Package  Current  Wanted  Latest  Location                         Depended by
abbrev     1.0.4   1.1.1   1.1.1  smoke-tests/node_modules/abbrev  smoke-tests@1.0.0

`

exports[`test/index.js TAP npm pkg > should have expected pkg get output 1`] = `
{
  "smoke-tests": "ISC"
}

`

exports[`test/index.js TAP npm pkg > should have expected pkg set output 1`] = `
{}

`

exports[`test/index.js TAP npm prefix > should have expected prefix output 1`] = `
{CWD}

`

exports[`test/index.js TAP npm run-script > should have expected run-script output 1`] = `

> smoke-tests@1.0.0 hello
> echo Hello

Hello

`

exports[`test/index.js TAP npm set-script > should have expected set-script output 1`] = `

`

exports[`test/index.js TAP npm uninstall > should have expected uninstall reify output 1`] = `

up to date 

134 packages are looking for funding
  run \`npm fund\` for details

`

exports[`test/index.js TAP npm update dep > should have expected update reify output 1`] = `

removed 1 package 

134 packages are looking for funding
  run \`npm fund\` for details

`

exports[`test/index.js TAP npm view > should have expected view output 1`] = `

[4m[1m[32mabbrev[39m@[32m1.0.4[39m[22m[24m | [32mMIT[39m | deps: [32mnone[39m | versions: [33m8[39m
Like ruby's abbrev module, but in js
[36mhttps://github.com/isaacs/abbrev-js#readme[39m

dist
.tarball: [36mhttps://registry.npmjs.org/abbrev/-/abbrev-1.0.4.tgz[39m
.shasum: [33mbd55ae5e413ba1722ee4caba1f6ea10414a59ecd[39m

maintainers:
- [33mnlf[39m <[36mquitlahok@gmail.com[39m>
- [33mruyadorno[39m <[36mruyadorno@hotmail.com[39m>
- [33mdarcyclarke[39m <[36mdarcy@darcyclarke.me[39m>
- [33madam_baldwin[39m <[36mevilpacket@gmail.com[39m>
- [33misaacs[39m <[36mi@izs.me[39m>

dist-tags:
[1m[32mlatest[39m[22m: 1.1.1

published [33mover a year ago[39m by [33misaacs[39m <[36mi@izs.me[39m>

`
