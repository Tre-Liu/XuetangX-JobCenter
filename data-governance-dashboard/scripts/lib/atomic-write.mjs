import { mkdir, rename, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export async function writeJsonAtomically(outputPath, value) {
  const target = outputPath instanceof URL ? fileURLToPath(outputPath) : resolve(outputPath)
  const temp = join(dirname(target), `.${basename(target)}.${process.pid}.tmp`)
  await mkdir(dirname(target), { recursive: true })

  try {
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
    await rename(temp, target)
  } finally {
    await unlink(temp).catch((error) => {
      if (error.code !== 'ENOENT') throw error
    })
  }
}
