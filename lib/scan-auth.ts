import { prisma } from './prisma'

export class ScanNotFoundError extends Error {
  constructor() {
    super('Scan not found')
  }
}

export async function assertScanOwnership(scanId: string, userId: string) {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: { findings: true },
  })

  // Return 404 whether the scan doesn't exist or belongs to another user
  if (!scan || scan.userId !== userId) {
    throw new ScanNotFoundError()
  }

  return scan
}
