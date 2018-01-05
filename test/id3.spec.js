'use strict'

/* eslint-disable no-undef */

const FILE_TO_TEST = process.env.ID3_FILE
const { parse } = require('../lib/id3')

test('Parsing a MP3 file', async () => {
    const frames = await parse(FILE_TO_TEST)
    expect(typeof frames).toBe('object')
    expect(frames).toHaveProperty('TIT2', 'Love me... Love me....')
    expect(frames).toHaveProperty('TPE1', 'Arsenium')
    expect(frames).toHaveProperty('TYER', '2005')
    expect(frames).toHaveProperty('TCON', 'Pop')
    expect(frames).toHaveProperty('TPE2', 'Arsenium')
})
