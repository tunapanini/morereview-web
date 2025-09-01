import sgMail from '@sendgrid/mail'
import { createHash, randomBytes } from 'crypto'
import { createServerClient } from '@/lib/supabase/server'
import type { EmailFrequency, PreferenceLevel } from '@prisma/client'

// SendGrid setup
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is required')
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export interface SubscriptionRequest {
  email: string
  firstName?: string
  lastName?: string
  emailFrequency?: EmailFrequency
  preferences?: Array<{
    category: string
    preference: PreferenceLevel
  }>
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  private supabase = createServerClient()
  private fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@morereview.co.kr'
  private emailSalt = process.env.EMAIL_SALT || 'default-salt'

  /**
   * Subscribe a new user to email notifications
   */
  async subscribe(request: SubscriptionRequest): Promise<{ success: boolean; subscriberId?: number; message: string }> {
    try {
      // Check if email already exists
      const { data: existingUser } = await this.supabase
        .from('email_subscribers')
        .select('id, is_active')
        .eq('email', request.email)
        .single()

      if (existingUser) {
        if (existingUser.is_active) {
          return {
            success: false,
            message: '이미 구독 중인 이메일 주소입니다.'
          }
        } else {
          // Reactivate existing subscription
          const { error } = await this.supabase
            .from('email_subscribers')
            .update({ 
              is_active: true,
              subscription_date: new Date().toISOString(),
              email_frequency: request.emailFrequency || 'DAILY'
            })
            .eq('id', existingUser.id)

          if (error) throw error

          return {
            success: true,
            subscriberId: existingUser.id,
            message: '구독이 다시 활성화되었습니다.'
          }
        }
      }

      // Create new subscriber
      const subscriptionToken = this.generateToken(request.email, 'subscribe')
      const unsubscribeToken = this.generateToken(request.email, 'unsubscribe')

      const { data: newSubscriber, error } = await this.supabase
        .from('email_subscribers')
        .insert({
          email: request.email,
          first_name: request.firstName,
          last_name: request.lastName,
          email_frequency: request.emailFrequency || 'DAILY',
          subscription_token: subscriptionToken,
          unsubscribe_token: unsubscribeToken,
          is_active: true
        })
        .select('id')
        .single()

      if (error) throw error

      // Save user preferences if provided
      if (request.preferences && request.preferences.length > 0) {
        const preferencesData = request.preferences.map(pref => ({
          subscriber_id: newSubscriber.id,
          category: pref.category,
          preference: pref.preference,
          is_explicit: true,
          confidence: 1.0
        }))

        const { error: prefError } = await this.supabase
          .from('user_preferences')
          .insert(preferencesData)

        if (prefError) {
          console.error('Failed to save preferences:', prefError)
          // Don't fail the subscription for preference errors
        }
      }

      // Send welcome email
      await this.sendWelcomeEmail(request.email, {
        firstName: request.firstName,
        unsubscribeToken
      })

      return {
        success: true,
        subscriberId: newSubscriber.id,
        message: '구독이 완료되었습니다. 환영 이메일을 확인해주세요.'
      }

    } catch (error) {
      console.error('Subscription error:', error)
      return {
        success: false,
        message: '구독 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
      }
    }
  }

  /**
   * Unsubscribe a user using their unsubscribe token
   */
  async unsubscribe(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: subscriber, error } = await this.supabase
        .from('email_subscribers')
        .update({ is_active: false })
        .eq('unsubscribe_token', token)
        .eq('is_active', true)
        .select('email')
        .single()

      if (error || !subscriber) {
        return {
          success: false,
          message: '유효하지 않은 구독 해지 링크입니다.'
        }
      }

      return {
        success: true,
        message: '구독이 해지되었습니다.'
      }

    } catch (error) {
      console.error('Unsubscribe error:', error)
      return {
        success: false,
        message: '구독 해지 처리 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * Send welcome email to new subscriber
   */
  private async sendWelcomeEmail(email: string, data: { firstName?: string; unsubscribeToken: string }) {
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://morereview.co.kr'}/email/unsubscribe?token=${data.unsubscribeToken}`
    
    const emailTemplate: EmailTemplate = {
      subject: '🎉 MoreReview 이메일 구독을 환영합니다!',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="color: #2563eb; text-align: center;">환영합니다! 🎉</h1>
          
          <p>안녕하세요${data.firstName ? ` ${data.firstName}님` : ''}!</p>
          
          <p><strong>MoreReview</strong> 이메일 구독을 신청해 주셔서 감사합니다.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">📧 앞으로 받으실 내용</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>매일 엄선된 캠페인 추천</li>
              <li>카테고리별 맞춤 캠페인 정보</li>
              <li>쿠팡 파트너스 할인 상품 소개</li>
              <li>놓치기 쉬운 마감 임박 캠페인</li>
            </ul>
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="https://morereview.co.kr" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              MoreReview 바로가기 🚀
            </a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            이메일 수신을 원하지 않으시면 
            <a href="${unsubscribeUrl}" style="color: #2563eb;">여기서 구독 해지</a>하실 수 있습니다.
          </p>
        </div>
      `,
      text: `
MoreReview 이메일 구독을 환영합니다!

안녕하세요${data.firstName ? ` ${data.firstName}님` : ''}!

MoreReview 이메일 구독을 신청해 주셔서 감사합니다.

앞으로 받으실 내용:
- 매일 엄선된 캠페인 추천
- 카테고리별 맞춤 캠페인 정보
- 쿠팡 파트너스 할인 상품 소개
- 놓치기 쉬운 마감 임박 캠페인

MoreReview 바로가기: https://morereview.co.kr

구독 해지: ${unsubscribeUrl}
      `
    }

    await this.sendEmail(email, emailTemplate)
  }

  /**
   * Send email using SendGrid
   */
  private async sendEmail(to: string, template: EmailTemplate) {
    try {
      const msg = {
        to,
        from: this.fromEmail,
        subject: template.subject,
        text: template.text,
        html: template.html,
      }

      await sgMail.send(msg)
      // Email sent successfully

    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error)
      throw error
    }
  }

  /**
   * Generate secure token for subscription/unsubscription
   */
  private generateToken(email: string, type: 'subscribe' | 'unsubscribe'): string {
    const timestamp = Date.now().toString()
    const randomData = randomBytes(16).toString('hex')
    const data = `${email}-${type}-${timestamp}-${randomData}`
    
    return createHash('sha256')
      .update(data + this.emailSalt)
      .digest('hex')
  }

  /**
   * Get active subscribers count
   */
  async getActiveSubscribersCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('email_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) {
      console.error('Failed to get subscribers count:', error)
      return 0
    }

    return count || 0
  }

  /**
   * Get subscriber by email
   */
  async getSubscriberByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('email_subscribers')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error) return null
    return data
  }
}