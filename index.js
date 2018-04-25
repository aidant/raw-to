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

async function convertImage (input, output, { format, log }) {
  let metadata = await ep.readMetadata(input, ['b', 'JpgFromRaw'])
  const parsedMetadata = {
    data: Buffer.from(metadata.data[0].JpgFromRaw.replace(/^base64:/, ''), 'base64'),
    path: metadata.data[0].SourceFile
  }
  const file = await new Promise((resolve, reject) => {
    const name = path.join(output, path.parse(parsedMetadata.path).name + '.' + format)
    const stream = fs.createWriteStream(name)
      .on('error', (error) => {
        reject(error)
      })
      .on('finish', () => {
        resolve(name)
      })

    sharp(parsedMetadata.data)
      .toFormat(format)
      .pipe(stream)
  })
  return file
}

module.exports = async (input, output, { format = 'jpeg', log = false } = {}) => {
  validatePaths(input, output)
  validateFormat(format)
  await fs.ensureDir(output)
  let files = await fs.readdir(input)
  files = files.filter((file) => /^\.nef$/i.test(path.parse(file).ext))
  await ep.open()
  const result = []
  try {
    for (const file of files) {
      const image = await convertImage(file, output, { format })
      if (log) console.log('Finished converting:', file)
      result.push(image)
    }
    ep.close()
    return result
  } catch (e) {
    ep.close()
    throw e
  }
}
