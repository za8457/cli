const Table = require('cli-table3')
const chalk = require('chalk')
const { v4: isCidrV4, v6: isCidrV6 } = require('is-cidr')
const log = require('../utils/log-shim.js')
const profile = require('npm-profile')

const otplease = require('../utils/otplease.js')
const pulseTillDone = require('../utils/pulse-till-done.js')
const readUserInfo = require('../utils/read-user-info.js')

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

    throw new Error(argv[2] + ' not recognized')
  }

  async exec (args, cb) {
    log.gauge.show('token')
    if (args.length === 0) {
      return this.list()
    }
    switch (args[0]) {
      case 'list':
      case 'ls':
        return this.list()
      case 'delete':
      case 'revoke':
      case 'remove':
      case 'rm':
        return this.rm(args.slice(1))
      case 'create':
        return this.create(args.slice(1))
      default:
        throw this.usageError(`${args[0]} is not a recognized subcommand.`)
    }
  }

  async list () {
    const conf = this.npm.flatOptions
    log.info('token', 'getting list')
    const tokens = await pulseTillDone.withPromise(profile.listTokens(conf))
    if (conf.json) {
      this.npm.output(JSON.stringify(tokens, null, 2))
      return
    } else if (conf.parseable) {
      this.npm.output(['key', 'token', 'created', 'readonly', 'CIDR whitelist'].join('\t'))
      tokens.forEach(token => {
        this.npm.output(
          [
            token.key,
            token.token,
            token.created,
            token.readonly ? 'true' : 'false',
            token.cidr_whitelist ? token.cidr_whitelist.join(',') : '',
          ].join('\t')
        )
      })
      return
    }
    this.generateTokenIds(tokens, 6)
    const idWidth = tokens.reduce((acc, token) => Math.max(acc, token.id.length), 0)
    const table = new Table({
      head: ['id', 'token', 'created', 'readonly', 'CIDR whitelist'],
      colWidths: [Math.max(idWidth, 2) + 2, 9, 12, 10],
    })
    tokens.forEach(token => {
      table.push([
        token.id,
        token.token + '…',
        String(token.created).slice(0, 10),
        token.readonly ? 'yes' : 'no',
        token.cidr_whitelist ? token.cidr_whitelist.join(', ') : '',
      ])
    })
    this.npm.output(table.toString())
  }

  async rm (args) {
    if (args.length === 0) {
      throw this.usageError('`<tokenKey>` argument is required.')
    }

    const conf = this.npm.flatOptions
    const tokens = await pulseTillDone.withPromise(profile.listTokens(conf))
    const toRemove = args.map(id => {
      const matches = tokens.filter(token => token.key.indexOf(id) === 0 || token.token.indexOf(id) === 0)
      if (matches.length === 0) {
        throw new Error(`Unknown token id or value "${id}".`)
      }
      if (matches.length > 1) {
        throw new Error(`Token ID "${id}" was ambiguous and matched more than on token`)
      }
      return matches[0].key
    })
    for (const key of toRemove) {
      await otplease(conf, conf => {
        return profile.removeToken(key, conf)
      })
    }
    if (conf.json) {
      this.npm.output(JSON.stringify(toRemove))
    } else if (conf.parseable) {
      this.npm.output(toRemove.join('\t'))
    } else {
      this.npm.output('Removed ' + toRemove.length + ' token' + (toRemove.length !== 1 ? 's' : ''))
    }
  }

  async create (args) {
    const conf = this.npm.flatOptions
    const cidr = conf.cidr
    const readonly = conf.readOnly

    return readUserInfo
      .password()
      .then(password => {
        const validCIDR = this.validateCIDRList(cidr)
        log.info('token', 'creating')
        return pulseTillDone.withPromise(
          otplease(conf, conf => {
            return profile.createToken(password, readonly, validCIDR, conf)
          })
        )
      })
      .then(result => {
        delete result.key
        delete result.updated
        if (conf.json) {
          this.npm.output(JSON.stringify(result))
        } else if (conf.parseable) {
          Object.keys(result).forEach(k => this.npm.output(k + '\t' + result[k]))
        } else {
          const table = new Table()
          for (const k of Object.keys(result)) {
            table.push({ [chalk.bold(k)]: String(result[k]) })
          }
          this.npm.output(table.toString())
        }
      })
  }

  invalidCIDRError (msg) {
    return Object.assign(new Error(msg), { code: 'EINVALIDCIDR' })
  }

  generateTokenIds (tokens, minLength) {
    const byId = {}
    for (const token of tokens) {
      token.id = token.key
      for (let ii = minLength; ii < token.key.length; ++ii) {
        const match = tokens.some(
          ot => ot !== token && ot.key.slice(0, ii) === token.key.slice(0, ii)
        )
        if (!match) {
          token.id = token.key.slice(0, ii)
          break
        }
      }
      byId[token.id] = token
    }
    return byId
  }

  validateCIDRList (cidrs) {
    const maybeList = cidrs ? (Array.isArray(cidrs) ? cidrs : [cidrs]) : []
    const list = maybeList.length === 1 ? maybeList[0].split(/,\s*/) : maybeList
    for (const cidr of list) {
      if (isCidrV6(cidr)) {
        throw this.invalidCIDRError(
          'CIDR whitelist can only contain IPv4 addresses, ' + cidr + ' is IPv6'
        )
      }

      if (!isCidrV4(cidr)) {
        throw this.invalidCIDRError('CIDR whitelist contains invalid CIDR entry: ' + cidr)
      }
    }
    return list
  }
}
module.exports = Token
