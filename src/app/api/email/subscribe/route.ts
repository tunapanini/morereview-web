import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/services/email-service'
import type { SubscriptionRequest } from '@/services/email-service'

const emailService = new EmailService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SubscriptionRequest

    // Get client IP address
    const ip = request.ip || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Basic validation
    if (!body.email) {
      return NextResponse.json(
        { success: false, message: '이메일 주소가 필요합니다.' },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: '올바른 이메일 주소를 입력해주세요.' },
        { status: 400 }
      )
    }

    // Process subscription with IP tracking
    const result = await emailService.subscribe(body, ip)

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 429 }) // 429 Too Many Requests for rate limited
    }

  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listAll = searchParams.get('list') === 'true'
    
    if (listAll) {
      // Get all subscribers list
      const subscribers = await emailService.getAllActiveSubscribers()
      
      return NextResponse.json({
        success: true,
        data: {
          activeSubscribers: subscribers.length,
          subscribers: subscribers.map(sub => ({
            id: sub.id,
            email: sub.email,
            name: [sub.first_name, sub.last_name].filter(Boolean).join(' ') || '이름 없음',
            subscriptionDate: sub.subscription_date,
            emailFrequency: sub.email_frequency
          })),
          message: `현재 ${subscribers.length}명의 구독자가 있습니다.`
        }
      })
    } else {
      // Just get count
      const count = await emailService.getActiveSubscribersCount()
      
      return NextResponse.json({
        success: true,
        data: {
          activeSubscribers: count,
          message: `현재 ${count}명의 구독자가 있습니다.`
        }
      })
    }
  } catch (error) {
    console.error('Get subscribers API error:', error)
    return NextResponse.json(
      { success: false, message: '구독자 정보를 가져올 수 없습니다.' },
      { status: 500 }
    )
  }
}