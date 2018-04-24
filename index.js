const sharp = require('sharp')
const exiftool = require('node-exiftool')
const exiftoolBin = require('dist-exiftool')
const fs = require('fs-extra')
const path = require('path')
const ep = new exiftool.ExiftoolProcess(exiftoolBin)

const formatTypes = ['jpeg', 'png', 'tiff', 'raw', 'webp']

function validateFormat (format) {
  if (!new RegExp(`^(${formatTypes.join('|')})$`).test(format)) {
    throw new TypeError(`format must be one of ${formatTypes.join(', ')} recieved ${format}`)
  }
}

function validatePaths (input, output) {
  if (typeof input !== 'string') throw new TypeError('input is required')
  if (typeof output !== 'string') throw new TypeError('output is required')
}

module.exports = async (input, output, { format = 'jpeg' } = {}) => {
  validatePaths(input, output)
  validateFormat(format)
  await fs.ensureDir(output)
  try {
    await ep.open()
    let metadata = await ep.readMetadata(input, ['b', 'JpgFromRaw'])
    const imageMetadata = (metadata.data instanceof Array) ? metadata.data : [metadata.data]
    const parsedMetadata = imageMetadata
      .filter(meta => meta && !!meta.JpgFromRaw)
      .map(meta => ({
        data: Buffer.from(meta.JpgFromRaw.replace(/^base64:/, ''), 'base64'),
        path: meta.SourceFile
      }))
    const promises = parsedMetadata.map(meta => new Promise((resolve, reject) => {
      const name = path.join(output, path.parse(meta.path).name + '.' + format)
      const stream = fs.createWriteStream(name)
        .on('error', (error) => {
          reject(error)
        })
        .on('finish', () => {
          resolve(name)
        })

      sharp(meta.data)
        .toFormat(format)
        .pipe(stream)
    }))
    const files = await Promise.all(promises)
    ep.close()
    return files
  } catch (error) {
    ep.close()
    throw error
  }
}
