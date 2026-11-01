import { NextResponse } from 'next/server'
import { HOUSE_SIZE_LABELS, HOUSE_SIZES, houseClearancePrice } from '@/lib/pricing'
import { listOwnerNotices, ownerNumberHint } from '@/lib/owner-notify'

export const dynamic = 'force-dynamic'

/** Admin only (see middleware). Recent owner texts plus whether house prices are set. */
export async function GET() {
  return NextResponse.json({
    notices: listOwnerNotices(),
    ownerNumberSet: Boolean(process.env.OWNER_SMS_NUMBER?.trim()),
    ownerNumberHint: ownerNumberHint(),
    housePrices: HOUSE_SIZES.map((size) => ({
      id: size,
      label: HOUSE_SIZE_LABELS[size],
      price: houseClearancePrice(size),
    })),
  })
}
