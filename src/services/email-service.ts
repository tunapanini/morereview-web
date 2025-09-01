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
  async subscribe(request: SubscriptionRequest, ip?: string): Promise<{ success: boolean; subscriberId?: number; message: string }> {
    try {
      // Rate limiting check
      const rateLimitCheck = await this.checkSubscriptionRateLimit(request.email)
      if (!rateLimitCheck.allowed) {
        await this.logSubscriptionAttempt(request.email, ip, false, rateLimitCheck.reason)
        return {
          success: false,
          message: rateLimitCheck.reason || '요청이 제한되었습니다.'
        }
      }

      // Check if email already exists
      const { data: existingUser } = await this.supabase
        .from('email_subscribers')
        .select('id, is_active, created_at')
        .eq('email', request.email)
        .single()

      if (existingUser) {
        if (existingUser.is_active) {
          await this.logSubscriptionAttempt(request.email, ip, false, '이미 구독 중')
          return {
            success: false,
            message: '이미 구독 중인 이메일 주소입니다.'
          }
        } else {
          // Check if this is a recent resubscription (potential abuse)
          const timeSinceLastSub = new Date().getTime() - new Date(existingUser.created_at).getTime()
          const thirtyMinutes = 30 * 60 * 1000

          if (timeSinceLastSub < thirtyMinutes) {
            await this.logSubscriptionAttempt(request.email, ip, false, '너무 빠른 재구독')
            return {
              success: false,
              message: '구독 해지 후 30분 뒤에 다시 구독할 수 있습니다.'
            }
          }

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

          await this.logSubscriptionAttempt(request.email, ip, true, '재구독 성공')
          
          // Send welcome email for reactivation (but log it as reactivation)
          await this.sendWelcomeEmail(request.email, {
            firstName: request.firstName,
            unsubscribeToken: '' // Will need to get actual token
          })

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

      // Send welcome email (only for new subscribers)
      await this.sendWelcomeEmail(request.email, {
        firstName: request.firstName,
        unsubscribeToken
      })

      await this.logSubscriptionAttempt(request.email, ip, true, '신규 구독 성공')

      return {
        success: true,
        subscriberId: newSubscriber.id,
        message: '구독이 완료되었습니다. 환영 이메일을 확인해주세요.'
      }

    } catch (error) {
      console.error('Subscription error:', error)
      await this.logSubscriptionAttempt(request.email, ip, false, `에러: ${error}`)
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
              <li>쿠팡 아이템 소개 및 비슷한 체험단 알림</li>
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

  /**
   * Get all active subscribers
   */
  async getAllActiveSubscribers() {
    const { data, error } = await this.supabase
      .from('email_subscribers')
      .select('id, email, first_name, last_name, subscription_date, email_frequency')
      .eq('is_active', true)
      .order('subscription_date', { ascending: false })

    if (error) {
      console.error('Failed to get all subscribers:', error)
      return []
    }

    return data || []
  }

  /**
   * Delete subscriber by email (permanent delete from database)
   */
  async deleteSubscriber(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await this.supabase
        .from('email_subscribers')
        .delete()
        .eq('email', email)
        .select('email')
        .single()

      if (error || !data) {
        return {
          success: false,
          message: '해당 이메일의 구독자를 찾을 수 없습니다.'
        }
      }

      return {
        success: true,
        message: `${email} 구독자가 삭제되었습니다.`
      }
    } catch (error) {
      console.error('Delete subscriber error:', error)
      return {
        success: false,
        message: '구독자 삭제 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * Delete multiple subscribers by emails
   */
  async deleteMultipleSubscribers(emails: string[]): Promise<{ success: boolean; message: string; deletedCount: number }> {
    try {
      const { data, error } = await this.supabase
        .from('email_subscribers')
        .delete()
        .in('email', emails)
        .select('email')

      if (error) {
        throw error
      }

      const deletedCount = data ? data.length : 0

      return {
        success: true,
        message: `${deletedCount}명의 구독자가 삭제되었습니다.`,
        deletedCount
      }
    } catch (error) {
      console.error('Delete multiple subscribers error:', error)
      return {
        success: false,
        message: '구독자 삭제 중 오류가 발생했습니다.',
        deletedCount: 0
      }
    }
  }

  /**
   * Update subscriber information
   */
  async updateSubscriber(email: string, updates: {
    firstName?: string;
    lastName?: string;
    emailFrequency?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const updateData: Record<string, string> = {}
      
      if (updates.firstName !== undefined) updateData.first_name = updates.firstName
      if (updates.lastName !== undefined) updateData.last_name = updates.lastName  
      if (updates.emailFrequency !== undefined) updateData.email_frequency = updates.emailFrequency
      
      const { data, error } = await this.supabase
        .from('email_subscribers')
        .update(updateData)
        .eq('email', email)
        .eq('is_active', true)
        .select('email, first_name, last_name')
        .single()

      if (error || !data) {
        return {
          success: false,
          message: '해당 구독자를 찾을 수 없거나 업데이트에 실패했습니다.'
        }
      }

      return {
        success: true,
        message: `${email} 구독자 정보가 업데이트되었습니다.`
      }
    } catch (error) {
      console.error('Update subscriber error:', error)
      return {
        success: false,
        message: '구독자 정보 업데이트 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * Check if email subscription should be rate limited
   */
  private async checkSubscriptionRateLimit(email: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // Check recent subscription attempts for this email
      const { data: recentByEmail, error: emailError } = await this.supabase
        .from('email_subscribers')
        .select('created_at')
        .eq('email', email)
        .gte('created_at', oneHourAgo.toISOString())

      if (emailError) throw emailError

      // Block if more than 3 attempts in 1 hour from same email
      if (recentByEmail && recentByEmail.length >= 3) {
        return { 
          allowed: false, 
          reason: '동일 이메일로 너무 많은 구독 시도가 있었습니다. 1시간 후 다시 시도해주세요.' 
        }
      }

      // Check for suspicious patterns (same email subscribed/unsubscribed multiple times)
      const { data: historyCount, error: historyError } = await this.supabase
        .from('email_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .gte('created_at', oneDayAgo.toISOString())

      if (historyError) throw historyError

      // Block if more than 5 subscription records in 24 hours (suspicious)
      if (historyCount && historyCount >= 5) {
        return { 
          allowed: false, 
          reason: '의심스러운 활동이 감지되었습니다. 24시간 후 다시 시도해주세요.' 
        }
      }

      return { allowed: true }

    } catch (error) {
      console.error('Rate limit check error:', error)
      // Allow by default if check fails (fail-open for user experience)
      return { allowed: true }
    }
  }

  /**
   * Log subscription attempt for monitoring
   */
  private async logSubscriptionAttempt(email: string, ip?: string, success: boolean, reason?: string) {
    try {
      // In a real implementation, you'd log this to a separate monitoring table
      // or external service like DataDog, CloudWatch, etc.
      console.warn('Subscription attempt:', {
        email,
        ip,
        success,
        reason,
        timestamp: new Date().toISOString()
      })
      
      // Could implement database logging here:
      /*
      await this.supabase
        .from('subscription_logs')
        .insert({
          email,
          ip_address: ip,
          success,
          reason,
          created_at: new Date().toISOString()
        })
      */
    } catch (error) {
      console.error('Failed to log subscription attempt:', error)
    }
  }
}