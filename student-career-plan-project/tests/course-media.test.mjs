import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { getCourseMedia } from '../src/data/course-media.ts'
import { learningChapters } from '../src/data/learning-space.ts'

function boxes(buffer, start = 0, end = buffer.length) {
  const found = []
  for (let position = start; position < end;) {
    assert.ok(position + 8 <= end, '媒体容器的块头必须完整')
    let size = buffer.readUInt32BE(position)
    const type = buffer.toString('ascii', position + 4, position + 8)
    const headerLength = size === 1 ? 16 : 8
    if (size === 1) size = Number(buffer.readBigUInt64BE(position + 8))
    if (size === 0) size = end - position
    assert.ok(size >= headerLength && position + size <= end, `${type} 媒体块长度必须有效`)
    found.push({ type, start: position + headerLength, end: position + size })
    position += size
  }
  return found
}

function child(buffer, parent, type) {
  const match = boxes(buffer, parent.start, parent.end).find(box => box.type === type)
  assert.ok(match, `MP4 缺少 ${type} 块`)
  return match
}

test('every video unit has a local, complete H.264 film and matching poster', async () => {
  const units = learningChapters.flatMap(chapter => chapter.units).filter(unit => unit.type === '视频')
  assert.equal(units.length, 3)
  for (const unit of units) {
    const media = getCourseMedia(unit.id)
    assert.ok(media, `${unit.id} 缺少视频媒体`)
    assert.doesNotMatch(media.src, /^(?:https?:)?\/\//)
    const source = await readFile(new URL(`../public/${media.src.replace(/^\.\//, '')}`, import.meta.url))
    const root = boxes(source)
    for (const kind of ['ftyp', 'moov', 'mdat']) assert.ok(root.some(box => box.type === kind), `${unit.id} 缺少 ${kind}`)
    assert.ok(root.findIndex(box => box.type === 'moov') < root.findIndex(box => box.type === 'mdat'), '播放元数据应位于文件前部')
    const movie = root.find(box => box.type === 'moov')
    const header = child(source, movie, 'mvhd')
    assert.equal(source[header.start], 0)
    const duration = source.readUInt32BE(header.start + 16) / source.readUInt32BE(header.start + 12)
    assert.equal(duration, media.durationSeconds, `${unit.id} 的标注时长必须与 MP4 一致`)
    const track = child(source, movie, 'trak')
    const trackHeader = child(source, track, 'tkhd')
    assert.equal(source.readUInt32BE(trackHeader.end - 8) / 65536, 960)
    assert.equal(source.readUInt32BE(trackHeader.end - 4) / 65536, 540)
    const trackMedia = child(source, track, 'mdia')
    const handler = child(source, trackMedia, 'hdlr')
    assert.equal(source.toString('ascii', handler.start + 8, handler.start + 12), 'vide')
    const sampleTable = child(source, child(source, trackMedia, 'minf'), 'stbl')
    const sampleDescription = child(source, sampleTable, 'stsd')
    assert.equal(source.toString('ascii', sampleDescription.start + 12, sampleDescription.start + 16), 'avc1')
    const sampleSizes = child(source, sampleTable, 'stsz')
    assert.equal(source.readUInt32BE(sampleSizes.start + 8), duration * 24)
    const poster = await readFile(new URL(`../public/${media.poster.replace(/^\.\//, '')}`, import.meta.url))
    assert.deepEqual([...poster.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
    assert.equal(poster.readUInt32BE(16), 960)
    assert.equal(poster.readUInt32BE(20), 540)
  }
  assert.equal(getCourseMedia('function-domain'), undefined)
})
