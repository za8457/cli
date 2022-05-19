const Table = require('cli-table3')
const { v4: isCidrV4, v6: isCidrV6 } = require('is-cidr')
const log = require('../utils/log-shim.js')
const profile = require('npm-profile')

const otplease = require('../utils/otplease.js')
const pulseTillDone = require('../utils/pulse-till-done.js')
const readUserInfo = require('../utils/read-user-info.js')

const table = (opts, rows) => {
  if (rows == null && Array.isArray(opts)) {
    rows = opts
    opts = {}
  }
  const t = new Table(opts)
  t.push(...rows)
  return t
}

const shortestUniquePrefix = (key, items, { minLength }) => {
  const otherItems = items.filter((item) => key !== item)
  for (let i = minLength; i < key.length; i++) {
    const match = otherItems.some(item => item.slice(0, i) === key.slice(0, i))
    if (!match) {
      return key.slice(0, i)
    }
  }
  return key
}

const BaseCommand = require('../base-command.js')
class Token extends BaseCommand {
  static description = 'Manage your authentication tokens'
  static name = 'token'
  static usage = ['list', 'revoke <id|token>', 'create [--read-only] [--cidr=list]']
  static params = ['read-only', 'cidr', 'registry', 'otp']
  static ignoreImplicitWorkspace = true

  async completion (opts) {
    const argv = opts.conf.argv.remain
    const subcommands = ['list', 'revoke', 'create']
    if (argv.length === 2) {
      return subcommands
    }

    if (subcommands.includes(argv[2])) {
      return []
    }

    throw new Error(`${argv[2]} not recognized`)
  }

  async exec (args) {
    switch (args[0]) {
      case undefined:
      case 'list':
      case 'ls':
        return this.output(this.list())
      case 'delete':
      case 'revoke':
      case 'remove':
      case 'rm':
        return this.output(this.rm(args.slice(1)))
      case 'create':
        return this.output(this.create(args.slice(1)))
      default:
        throw this.usageError(`${args[0]} is not a recognized subcommand.`)
    }
  }

  async output (res) {
    res = await res
    console.log(res)
    const conf = this.npm.flatOptions

    if (conf.json) {
      this.npm.output(JSON.stringify(res, null, 2))
    } else if (conf.parseable) {
      res.forEach(r => this.npm.output(r.join('\t')))
    } else {
      this.npm.output(res.toString())
    }
  }

  async list () {
    log.info('token', 'getting list')

    const conf = this.npm.flatOptions
    const tokens = await pulseTillDone.withPromise(profile.listTokens(conf))

    if (conf.json) {
      return tokens
    }

    const columns = ['key', 'token', 'created', 'readonly', 'CIDR whitelist']
    const rows = tokens.map(token => [
      token.key,
      token.token,
      token.created,
      token.readonly ? 'true' : 'false',
      token.cidr_whitelist ? token.cidr_whitelist.join(',') : '',
    ])

    if (conf.parseable) {
      return [columns, ...rows]
    }

    const tokenKeys = rows.map(row => row[0])
    return table({ head: columns }, rows.map((row) => [
      shortestUniquePrefix(row[0], tokenKeys, { minLength: 6 }),
      row[1] + '…',
      String(row[2]).slice(0, 10),
      ...row.slice(3),
    ]))
  }

  async rm (args) {
    log.info('token', 'removing')

    if (args.length === 0) {
      throw this.usageError('`<tokenKey>` argument is required.')
    }

    const conf = this.npm.flatOptions
    const tokens = await pulseTillDone.withPromise(profile.listTokens(conf))

    const removeKeys = args.map(arg => {
      const found = tokens.filter(({ key, token }) => key.startsWith(arg) || token.startsWith(arg))

      if (found.length === 0) {
        throw new Error(`Unknown token id or value "${arg}"`)
      }

      if (found.length > 1) {
        throw new Error(`Token ID "${arg}" was ambiguous and matched more than one token`)
      }

      return found[0]
    })

    for (const key of removeKeys) {
      await otplease(conf, opts => profile.removeToken(key.key, opts))
    }

    if (conf.json) {
      return removeKeys
    }

    if (conf.parseable) {
      return removeKeys
    }

    return `Removed ${removeKeys.length} token${removeKeys.length !== 1 ? 's' : ''}`
  }

  async create () {
    log.info('token', 'creating')

    const conf = this.npm.flatOptions
    const password = await readUserInfo.password()
    const token = await pulseTillDone.withPromise(otplease(
      conf,
      opts => profile.createToken(password, conf.readonly, this.validateCIDRList(conf.cidr), opts)
    )).then(({ key: _, updated: __, ...result }) => result)

    if (conf.json) {
      return token
    }

    if (conf.parseable) {
      return Object.entries(token)
    }

    return table(Object.entries(token).map(([k, v]) => ({ [this.npm.chalk.bold(k)]: v })))
  }

  validateCIDRList (cidrs) {
    const invalidCIDRError = (msg) => Object.assign(new Error(msg), { code: 'EINVALIDCIDR' })

    const maybeList = cidrs ? (Array.isArray(cidrs) ? cidrs : [cidrs]) : []
    const list = maybeList.length === 1 ? maybeList[0].split(/,\s*/) : maybeList

    for (const cidr of list) {
      if (isCidrV6(cidr)) {
        throw invalidCIDRError(`CIDR whitelist can only contain IPv4 addresses, ${cidr} is IPv6`)
      }

      if (!isCidrV4(cidr)) {
        throw invalidCIDRError(`CIDR whitelist contains invalid CIDR entry: ${cidr}`)
      }
    }

    return list
  }
}
module.exports = Token
