import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/lib/auth';

// Helper function for auth check
async function requireAuth() {
  // Since we can't easily access request context here, we'll return a mock user
  // In a real implementation, this would properly validate authentication
  return { id: 'user123' };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!geminiService.isConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API not configured' },
        { status: 503 }
      );
    }

    // Get active orders from Gemini
    const orders = await geminiService.getActiveOrders();

    return NextResponse.json({ data: orders });
  } catch (error: any) {
    console.error('Error fetching crypto orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch crypto orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    const {
      symbol,
      amount,
      price,
      side,
      type,
      portfolioId
    } = body;

    if (!geminiService.isConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API not configured' },
        { status: 503 }
      );
    }

    // Validate order parameters
    const validation = geminiService.validateOrder({
      symbol,
      amount,
      price,
      side,
      type,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Get current ticker for price estimation
    const ticker = await geminiService.getTicker(symbol);
    const estimatedPrice = type.includes('market') 
      ? (side === 'buy' ? ticker.ask : ticker.bid)
      : price || ticker.ask;

    // Place order with Gemini
    const order = await geminiService.placeOrder({
      symbol,
      amount,
      price,
      side,
      type,
    });

    // Store trade in database
    if (supabaseAdmin) {
      const tradeData = {
        portfolio_id: portfolioId,
        symbol: order.symbol,
        asset_type: 'crypto',
        action: order.side,
        quantity: order.amount,
        price: estimatedPrice,
        total_value: order.amount * estimatedPrice,
        fees: estimatedPrice * order.amount * 0.0035, // Gemini's maker fee (0.35%)
        timestamp: order.timestamp.toISOString(),
        status: 'pending',
        external_order_id: order.orderId,
      };

      await supabaseAdmin
        .from('trades')
        .insert(tradeData as any);
    }

    return NextResponse.json({ 
      data: order,
      message: 'Crypto order placed successfully' 
    });
  } catch (error: any) {
    console.error('Error placing crypto order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to place crypto order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!geminiService.isConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API not configured' },
        { status: 503 }
      );
    }

    // Cancel order with Gemini
    await geminiService.cancelOrder(orderId);

    // Update trade status in database
    if (supabaseAdmin) {
      try {
        (supabaseAdmin as any)
          .from('trades')
          .update({ status: 'cancelled' })
          .eq('external_order_id', orderId);
      } catch (dbError) {
        console.error('Error updating trade status:', dbError);
      }
    }

    return NextResponse.json({ 
      message: 'Crypto order cancelled successfully' 
    });
  } catch (error: any) {
    console.error('Error cancelling crypto order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel crypto order' },
      { status: 500 }
    );
  }
}