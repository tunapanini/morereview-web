import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/services/email-service'

const emailService = new EmailService()

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, message: '구독 해지 토큰이 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await emailService.unsubscribe(token)

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }

  } catch (error) {
    console.error('Unsubscribe API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '구독 해지 처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}

// GET method for direct unsubscribe links (e.g., from email)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, message: '구독 해지 토큰이 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await emailService.unsubscribe(token)

    // Return HTML response for direct email links
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>구독 해지 - MoreReview</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px; 
              text-align: center; 
            }
            .success { color: #16a34a; }
            .error { color: #dc2626; }
            .btn {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>MoreReview</h1>
          <div class="${result.success ? 'success' : 'error'}">
            <h2>${result.success ? '✅' : '❌'}</h2>
            <p>${result.message}</p>
          </div>
          <a href="https://morereview.co.kr" class="btn">홈페이지로 돌아가기</a>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })

  } catch (error) {
    console.error('Unsubscribe GET error:', error)
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>오류 - MoreReview</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px; 
              text-align: center; 
            }
            .error { color: #dc2626; }
            .btn {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>MoreReview</h1>
          <div class="error">
            <h2>❌</h2>
            <p>구독 해지 처리 중 오류가 발생했습니다.</p>
          </div>
          <a href="https://morereview.co.kr" class="btn">홈페이지로 돌아가기</a>
        </body>
      </html>
    `

    return new NextResponse(errorHtml, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
}