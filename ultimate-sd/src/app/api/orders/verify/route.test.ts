import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/feature-flags-server', () => ({ canAccessFeature: vi.fn() }));
vi.mock('@/lib/user-llm', () => ({ activateUserPlan: vi.fn() }));

const mockOrdersFetch = vi.fn();
vi.mock('@/lib/razorpay', () => ({
  getRazorpayClient: vi.fn(() => ({
    orders: { fetch: mockOrdersFetch },
  })),
  verifyPaymentSignature: vi.fn(() => true),
}));

import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { activateUserPlan } from '@/lib/user-llm';
import { POST } from './route';

const mockedAuth = vi.mocked(auth);
const mockedCanAccessFeature = vi.mocked(canAccessFeature);
const mockedActivateUserPlan = vi.mocked(activateUserPlan);

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/orders/verify', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
});

describe('POST /api/orders/verify', () => {
  it('activates the plan recorded on the Razorpay order, not the client-supplied planType', async () => {
    mockOrdersFetch.mockResolvedValue({
      id: 'order_1',
      notes: { userId: 'user-1', planType: 'platform' },
    });

    const res = await POST(
      makeRequest({
        razorpay_order_id: 'order_1',
        razorpay_payment_id: 'pay_1',
        razorpay_signature: 'sig_1',
        // Client falsely claims lifetime while the order was only for platform.
        planType: 'lifetime',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockedActivateUserPlan).toHaveBeenCalledWith('user-1', 'platform');
    expect(json.planType).toBe('platform');
  });

  it('rejects a lifetime order with 403 if the lifetimePlan flag is off at verify time', async () => {
    mockOrdersFetch.mockResolvedValue({
      id: 'order_2',
      notes: { userId: 'user-1', planType: 'lifetime' },
    });
    mockedCanAccessFeature.mockResolvedValue(false);

    const res = await POST(
      makeRequest({
        razorpay_order_id: 'order_2',
        razorpay_payment_id: 'pay_2',
        razorpay_signature: 'sig_2',
        planType: 'lifetime',
      })
    );

    expect(res.status).toBe(403);
    expect(mockedActivateUserPlan).not.toHaveBeenCalled();
  });

  it('activates a lifetime order when the flag allows it', async () => {
    mockOrdersFetch.mockResolvedValue({
      id: 'order_3',
      notes: { userId: 'user-1', planType: 'lifetime' },
    });
    mockedCanAccessFeature.mockResolvedValue(true);

    const res = await POST(
      makeRequest({
        razorpay_order_id: 'order_3',
        razorpay_payment_id: 'pay_3',
        razorpay_signature: 'sig_3',
        planType: 'lifetime',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockedActivateUserPlan).toHaveBeenCalledWith('user-1', 'lifetime');
    expect(json.planType).toBe('lifetime');
  });

  it('rejects when the order notes belong to a different user', async () => {
    mockOrdersFetch.mockResolvedValue({
      id: 'order_4',
      notes: { userId: 'someone-else', planType: 'platform' },
    });

    const res = await POST(
      makeRequest({
        razorpay_order_id: 'order_4',
        razorpay_payment_id: 'pay_4',
        razorpay_signature: 'sig_4',
        planType: 'platform',
      })
    );

    expect(res.status).toBe(403);
    expect(mockedActivateUserPlan).not.toHaveBeenCalled();
  });
});
