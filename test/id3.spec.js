'use strict'

/* eslint-disable no-undef */

const FILE_TO_TEST = './test/test.mp3'
const { parse } = require('../lib/id3')

test('Parsing a MP3 file', async () => {
    const frames = await parse(FILE_TO_TEST)
    expect(typeof frames).toBe('object')
    expect(frames).toHaveProperty('title', 'Levels (Skrillex Remix)')
    expect(frames).toHaveProperty('artist', 'Avicii')
    expect(frames).toHaveProperty('year', '2011')
    expect(frames).toHaveProperty('genre', 'Dance')
    expect(frames).toHaveProperty('band', 'Avicii')
    expect(frames).toHaveProperty('album', 'Levels (Remixes) - EP')
})
