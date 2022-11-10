const { sigstore } = require('sigstore')
const { readFile } = require('fs/promises')

const INTOTO_PAYLOAD_TYPE = 'application/vnd.in-toto+json'
const INTOTO_STATEMENT_TYPE = 'https://in-toto.io/Statement/v0.1'
const SLSA_PREDICATE_TYPE = 'https://slsa.dev/provenance/v0.2'

const BUILDER_ID_PREFIX = 'https://github.com/npm/cli'
const BUILD_TYPE_PREFIX = 'https://github.com/npm/cli/gha'
const BUILD_TYPE_VERSION = 'v0'

const verifyProvenance = async (subject, provenance, tarballData) => {
  let provenanceBundle
  try {
    provenanceBundle = JSON.parse(await readFile(provenance))
  } catch (err) {
    err.message = `Invalid provenance provided: ${err.message}`
    throw err
  }

  const payload = extractBundlePayload(provenanceBundle)
  if (!payload.subject || !payload.subject.length) {
    throw new Error('No subject found in sigstore bundle payload')
  }
  if (payload.subject.length > 1) {
    throw new Error('Found more than one subject in the sigstore bundle payload')
  }

  const bundleSubject = payload.subject[0]
  if (subject.name !== bundleSubject.name) {
    throw new Error(
      `Provenance subject ${bundleSubject.name} does not match the package: ${subject.name}`
    )
  }
  if (subject.digest.sha512 !== bundleSubject.digest.sha512) {
    throw new Error('Provenance subject digest does not match the package')
  }

  await sigstore.verify(provenanceBundle)
  return provenanceBundle
}

const extractBundlePayload = (bundle) => {
  if (!bundle?.dsseEnvelope?.payload) {
    throw new Error('No dsseEnvelope with payload found in sigstore bundle')
  }
  try {
    return JSON.parse(Buffer.from(bundle.dsseEnvelope.payload, 'base64').toString('utf8'))
  } catch (err) {
    err.message = `Failed to parse payload from dsseEnvelope: ${err.message}`
    throw err
  }
}

const generateProvenance = async (subject, opts) => {
  const { env } = process
  const payload = {
    _type: INTOTO_STATEMENT_TYPE,
    subject,
    predicateType: SLSA_PREDICATE_TYPE,
    predicate: {
      buildType: `${BUILD_TYPE_PREFIX}@${BUILD_TYPE_VERSION}`,
      builder: { id: `${BUILDER_ID_PREFIX}@${opts.npmVersion}` },
      invocation: {
        configSource: {
          uri: `git+${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}@${env.GITHUB_REF}`,
          digest: {
            sha1: env.GITHUB_SHA,
          },
          entryPoint: env.GITHUB_WORKFLOW_REF || env.GITHUB_WORKFLOW,
        },
        parameters: {},
        environment: {
          GITHUB_ACTOR_ID: env.GITHUB_ACTOR_ID,
          GITHUB_EVENT_NAME: env.GITHUB_EVENT_NAME,
          GITHUB_JOB: env.GITHUB_JOB,
          GITHUB_REF: env.GITHUB_REF,
          GITHUB_REF_TYPE: env.GITHUB_REF_TYPE,
          GITHUB_REPOSITORY: env.GITHUB_REPOSITORY,
          GITHUB_REPOSITORY_ID: env.GITHUB_REPOSITORY_ID,
          GITHUB_REPOSITORY_OWNER_ID: env.GITHUB_REPOSITORY_OWNER_ID,
          GITHUB_RUN_ATTEMPT: env.GITHUB_RUN_ATTEMPT,
          GITHUB_RUN_ID: env.GITHUB_RUN_ID,
          GITHUB_RUN_NUMBER: env.GITHUB_RUN_NUMBER,
          GITHUB_SHA: env.GITHUB_SHA,
          GITHUB_WORKFLOW: env.GITHUB_WORKFLOW,
          GITHUB_WORKFLOW_REF: env.GITHUB_WORKFLOW_REF,
          GITHUB_WORKFLOW_SHA: env.GITHUB_WORKFLOW_SHA,
          IMAGE_OS: env.ImageOS,
          IMAGE_VERSION: env.ImageVersion,
          RUNNER_ARCH: env.RUNNER_ARCH,
          RUNNER_NAME: env.RUNNER_NAME,
          RUNNER_OS: env.RUNNER_OS,
        },
      },
      metadata: {
        buildInvocationId: `${env.GITHUB_RUN_ID}-${env.GITHUB_RUN_ATTEMPT}`,
        completeness: {
          parameters: false,
          environment: false,
          materials: false,
        },
        reproducible: false,
      },
      materials: [
        {
          uri: `git+${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}`,
          digest: {
            sha1: env.GITHUB_SHA,
          },
        },
      ],
    },
  }

  return sigstore.signAttestation(Buffer.from(JSON.stringify(payload)), INTOTO_PAYLOAD_TYPE, opts)
}

module.exports = {
  generateProvenance,
  verifyProvenance,
}
