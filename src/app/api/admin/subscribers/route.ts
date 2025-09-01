import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/services/email-service'

const emailService = new EmailService()

// DELETE method for deleting subscribers (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const emails = searchParams.get('emails')
    
    if (email) {
      // Delete single subscriber
      const result = await emailService.deleteSubscriber(email)
      return NextResponse.json(result, { 
        status: result.success ? 200 : 400 
      })
    } else if (emails) {
      // Delete multiple subscribers
      const emailList = emails.split(',').map(e => e.trim())
      const result = await emailService.deleteMultipleSubscribers(emailList)
      return NextResponse.json(result, { 
        status: result.success ? 200 : 400 
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'email 또는 emails 파라미터가 필요합니다.'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Admin delete subscribers error:', error)
    return NextResponse.json({
      success: false,
      message: '구독자 삭제 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// PATCH method for updating subscriber information
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'email 파라미터가 필요합니다.'
      }, { status: 400 })
    }

    const body = await request.json()
    const { firstName, lastName, emailFrequency } = body

    const result = await emailService.updateSubscriber(email, {
      firstName,
      lastName,
      emailFrequency
    })

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    })

  } catch (error) {
    console.error('Admin update subscriber error:', error)
    return NextResponse.json({
      success: false,
      message: '구독자 정보 업데이트 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
