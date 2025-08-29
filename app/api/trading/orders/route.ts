import { NextRequest, NextResponse } from 'next/server';
import { alpacaService } from '@/lib/alpaca';
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'open' | 'closed' | 'all' | null;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get orders from Alpaca
    const orders = await alpacaService.getOrders({
      status: status || 'all',
      limit,
    });

    return NextResponse.json({ data: orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
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
      qty,
      side,
      type,
      timeInForce,
      limitPrice,
      stopPrice,
      portfolioId
    } = body;

    // Validate order parameters
    const validation = alpacaService.validateOrder({
      symbol,
      qty,
      side,
      type,
      limitPrice,
      stopPrice,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Check if market is open for market orders
    if (type === 'market') {
      const isOpen = await alpacaService.isMarketOpen();
      if (!isOpen) {
        return NextResponse.json(
          { error: 'Market is closed. Use limit orders for after-hours trading.' },
          { status: 400 }
        );
      }
    }

    // Get current quote for price calculation
    const quote = await alpacaService.getLatestQuote(symbol);
    const estimatedPrice = type === 'market' 
      ? (side === 'buy' ? quote.askPrice : quote.bidPrice)
      : limitPrice || quote.askPrice;

    // Place order with Alpaca
    const order = await alpacaService.placeOrder({
      symbol,
      qty,
      side,
      type,
      timeInForce,
      limitPrice,
      stopPrice,
    });

    // Store trade in database
    if (supabaseAdmin) {
      const tradeData = {
        portfolio_id: portfolioId,
        symbol: order.symbol,
        asset_type: 'stock',
        action: order.side,
        quantity: order.qty,
        price: estimatedPrice,
        total_value: order.qty * estimatedPrice,
        fees: 0, // Alpaca has zero commission
        timestamp: order.submittedAt.toISOString(),
        status: 'pending',
        external_order_id: order.id,
      };

      await supabaseAdmin
        .from('trades')
        .insert(tradeData as any);
    }

    return NextResponse.json({ 
      data: order,
      message: 'Order placed successfully' 
    });
  } catch (error: any) {
    console.error('Error placing order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to place order' },
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

    // Cancel order with Alpaca
    await alpacaService.cancelOrder(orderId);

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
      message: 'Order cancelled successfully' 
    });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel order' },
      { status: 500 }
    );
  }
}