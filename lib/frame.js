'use strict'

const { CODES } = require('./frame-identifiers')
const GenericFrameDecoder = require('./frames/generic')

function extractFrame(frameCode, frameSize, stream) {
    if (!CODES.includes(frameCode)) {
        throw new TypeError(`Unknown frame identifier : ${frameCode}`)
    }
    const decoder = new GenericFrameDecoder()
    return decoder.decode({
        data : stream.read(frameSize),
        size : frameSize,
    })
}

module.exports = { extractFrame }
