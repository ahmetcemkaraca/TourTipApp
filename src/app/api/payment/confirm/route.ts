/**
 * API Route: Confirm Payment and Update Booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { completeBookingService } from '@/lib/booking-service-complete';

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, bookingId } = await request.json();

    if (!paymentIntentId || !bookingId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update booking payment status
    await completeBookingService.updatePaymentStatus(
      bookingId,
      'paid',
      paymentIntentId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
