#!/usr/bin/env node

const rawTo = require('.')

const [format, input, output] = process.argv.splice(2)

console.log('Parsing images in', input, 'please wait, this may take a while')
rawTo(input, output, { format, log: true })
  .then((images) => {
    console.log('Finished converting images')
  })
  .catch(console.error)
