'use strict'

/**
 * ID3v2 Tag Reader
 * Official specification : http://id3.org/id3v2.4.0-structure
 */

const Fs = require('fs')
const { extractFrame } = require('./frame')
const convert = require('./converter')

function readHeaderIdentifier(stream) {
    const identifier = stream.read(3).toString('utf8')
    if (identifier !== 'ID3') {
        throw new TypeError('The given file does not have any ID3 Tag')
    }
    return identifier
}

function readVersion(stream) {
    const version = stream.read(2)
    const major = version.readInt8(0)
    const release = version.readInt8(1)
    return `v${major}.${release}`
}

function readFlags(stream) {
    const result = {
        allFrames : false,
        extended : false,
        experimental : false,
        footer : false,
    }
    const flags = stream.read(1).readInt8(0)
    if (flags & 0x80) {
        result.allFrames = true
    }
    if (flags & 0x40) {
        result.extended = true
    }
    if (flags & 0x20) {
        result.experimental = true
    }
    if (flags & 0x10) {
        result.footer = true
    }
    if (flags & 0x0f) {
        throw new TypeError('Invalid flags : Last 4 bytes must be cleared')
    }
    return result
}

function readID3Size(stream) {
    return stream.read(4).readInt32BE(0)
}

function readExtendedHeader(stream) {
    let extended = {
        update : false,
        crc : null,
        restrictions : {
            size : null,
            encoding : false,
            textSize : null,
            imageEncoding : false,
            imageSize : null,
        },
    }
    stream.read(4).readInt32BE(0)
    const flagBytes = stream.read(1).readInt8(0)
    if (flagBytes) {
        const extendedFlags = stream.read(flagBytes)
        if (extendedFlags.readInt8(1)) {
            extended.update = true
        }
        if (extendedFlags.readInt8(2)) {
            extended.crc = stream.read(35).toString('hex')
        }
        if (extendedFlags.readInt8(3)) {
            const restr = extendedFlags.readInt8(4)
            extended.restrictions.size = {
                frames : 128,
                tag : 10248576,
            }
            if (restr & 0x40) {
                extended.restrictions.size.frames = 64
                extended.restrictions.size.tag = 128 * 1024
            }
            if (restr & 0x80) {
                extended.restrictions.size.frames = 32
                extended.restrictions.size.tag = 40960
            }
            if (restr & 0xc0) {
                extended.restrictions.size.frames = 32
                extended.restrictions.size.tag = 4096
            }

            if (restr & 0x20) {
                extended.restrictions.encoding = true
            }

            if (restr & 0x08) {
                extended.restrictions.textSize = 1024
            }
            if (restr & 0x10) {
                extended.restrictions.textSize = 128
            }
            if (restr & 0x18) {
                extended.restrictions.textSize = 30
            }

            if (restr & 0x04) {
                extended.restrictions.imageEncoding = true
            }

            if (restr & 0x01) {
                extended.restrictions.imageSize = { x : 256, y : 256 }
            }
            if (restr & 0x02) {
                extended.restrictions.imageSize = { x : 64, y : 64 }
            }
            if (restr & 0x03) {
                extended.restrictions.imageSize = { x : 64, y : 64, exact : true }
            }
        }
    }
    return extended
}

function isValidFrame(frameId) {
    return /[A-Z0-9]+/.exec(frameId) !== null
}

function readFrame(stream) {
    const frameId = stream.read(4).toString('latin1')
    if (!frameId || frameId === '\u0000\u0000\u0000\u0000') {
        return null
    }
    if (!isValidFrame(frameId)) {
        throw new TypeError(`Invalid ID3 frame in the file`)
    }
    const frameSize = stream.read(4).readInt32BE(0)
    const flags = stream.read(2).readInt16BE(0)

    const frameProperties = {
        preserveTag : true,
        preserveFile : true,
        readOnly : true,
        groupIdentity : false,
        compression : false,
        encryption : false,
        unsynchronisation : false,
        dataLength : false,
    }

    if (flags & 0x4000) {
        frameProperties.preverseTag = true
    }
    if (flags & 0x2000) {
        frameProperties.preserveFile = true
    }
    if (flags & 0x1000) {
        frameProperties.readOnly = true
    }
    if (flags & 0x0040) {
        frameProperties.groupIdentity = true
    }
    if (flags & 0x0008) {
        frameProperties.compression = true
    }
    if (flags & 0x0004) {
        frameProperties.encryption = true
    }
    if (flags & 0x0002) {
        frameProperties.unsynchronisation = true
    }
    if (flags & 0x0001) {
        frameProperties.dataLength = true
    }

    const extractedData = extractFrame(frameId, frameSize, stream)
    if (!extractedData) {
        return null
    }
    return {
        [frameId] : extractedData,
    }
}

function work(path) {
    return new Promise((resolve, reject) => {
        const file = Fs.createReadStream(path)
        file.on('readable', () => {
            let frames = {}
            try {
                readHeaderIdentifier(file)
                readVersion(file)
                const flags = readFlags(file)
                readID3Size(file)

                if (flags.extended) {
                    readExtendedHeader(file)
                }

                let remainFrames = true
                while (remainFrames) {
                    try {
                        const frame = readFrame(file)
                        if (!frame) {
                            remainFrames = false
                        }
                        frames = Object.assign({}, frames, frame)
                    } catch (err) {
                        console.warn(err.message)
                    }
                }
                resolve(frames)
            } catch (err) {
                reject(err)
            } finally {
                file.close()
            }
        })
    })
}

module.exports = {
    parse : async (path) => {
        const frames = await work(path)
        return convert(frames)
    },
}
