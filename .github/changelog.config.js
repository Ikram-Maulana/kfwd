'use strict'
const config = require('conventional-changelog-conventionalcommits')

module.exports = config({
  gitRawCommitsOpts: {
    merges: undefined,
    noMerges: undefined,
  },
})
