'use strict'

const { ENCODINGS } = require('../encoding')

class GenericFrameDecoder {
    decode({ data, size }) {
        if (!data || !(data instanceof Buffer)) {
            throw new TypeError('data must be a Buffer')
        }
        const encoding = data.readInt8(0)
        const encodingName = ENCODINGS[encoding]
        if (!encodingName) {
            throw new TypeError('Cannot decode text encoding for frame')
        }
        return this.extractTextData(data, encodingName, size)
    }
    extractTextData(data, encodingName, size) {
        const textData = Buffer.alloc(size - 1)
        data.copy(textData, 0, 1, size)
        if (!textData) {
            return null
        }
        return textData.toString(encodingName)
    }
}

module.exports = GenericFrameDecoder
