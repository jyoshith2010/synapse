import { useState } from 'react'
import emailjs from '@emailjs/browser'

export default function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('')

    try {
      // EmailJS configuration
      const serviceId = 'YOUR_EMAILJS_SERVICE_ID'
      const templateId = 'YOUR_EMAILJS_TEMPLATE_ID'
      const publicKey = 'YOUR_EMAILJS_PUBLIC_KEY'

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject,
        message: formData.message,
        to_email: 'synapsesupport2505@gmail.com'
      }

      // Try to send via EmailJS if configured
      if (serviceId !== 'YOUR_EMAILJS_SERVICE_ID' && templateId !== 'YOUR_EMAILJS_TEMPLATE_ID' && publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
        await emailjs.send(serviceId, templateId, templateParams, publicKey)
        setSubmitStatus('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        // Fallback to mailto if EmailJS not configured
        const mailtoLink = `mailto:synapsesupport2505@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`
        window.open(mailtoLink, '_blank')
        setSubmitStatus('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
      }
    } catch (error) {
      console.error('Error submitting support request:', error)
      // Fallback to mailto on error
      const mailtoLink = `mailto:synapsesupport2505@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`
      window.open(mailtoLink, '_blank')
      setSubmitStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rise" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="section-label">Support</div>
      
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--txt)', marginBottom: 16 }}>
          Need Help?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--txt2)', marginBottom: 24 }}>
          We're here to help! Fill out the form below or reach out to us directly.
        </p>

        {/* Contact Information */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 16, 
          marginBottom: 32 
        }}>
          <div style={{
            padding: 20,
            borderRadius: 12,
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 8 }}>Email Support</div>
            <div style={{ fontSize: 16, color: 'var(--txt)', fontWeight: 500 }}>
              synapsesupport2505@gmail.com
            </div>
          </div>

          <div style={{
            padding: 20,
            borderRadius: 12,
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 8 }}>Instagram</div>
            <div style={{ fontSize: 16, color: 'var(--txt)', fontWeight: 500 }}>
              @synapse2505
            </div>
          </div>
        </div>

        {/* Support Form */}
        <div style={{
          padding: 24,
          borderRadius: 16,
          background: 'var(--glass)',
          border: '1px solid var(--glass-border)'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--txt)', marginBottom: 20 }}>
            Submit a Support Request
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>
                Your Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--txt)',
                  fontSize: 14
                }}
                placeholder="Enter your name"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>
                Your Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--txt)',
                  fontSize: 14
                }}
                placeholder="Enter your email"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>
                Subject
              </label>
              <select
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--txt)',
                  fontSize: 14
                }}
              >
                <option value="">Select a topic</option>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Account Issue">Account Issue</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>
                Message
              </label>
              <textarea
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--txt)',
                  fontSize: 14,
                  resize: 'vertical'
                }}
                placeholder="Describe your issue or request in detail..."
              />
            </div>

            {submitStatus === 'success' && (
              <div style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.3)',
                color: '#4ade80',
                fontSize: 13,
                marginBottom: 16
              }}>
                ✓ Your support request has been submitted. We'll get back to you soon!
              </div>
            )}

            {submitStatus === 'error' && (
              <div style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: '#f87171',
                fontSize: 13,
                marginBottom: 16
              }}>
                ✗ Failed to submit. Please try again or email us directly.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 8,
                background: isSubmitting ? 'rgba(124,58,255,0.3)' : 'var(--accent)',
                border: 'none',
                color: '#000',
                fontSize: 14,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Support Request'}
            </button>
          </form>
        </div>

        {/* FAQ Section */}
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--txt)', marginBottom: 20 }}>
            Frequently Asked Questions
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--glass)',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 8 }}>
                How do I reset my password?
              </div>
              <div style={{ fontSize: 13, color: 'var(--txt2)' }}>
                Click on "Forgot Password" on the login page and follow the instructions sent to your email.
              </div>
            </div>

            <div style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--glass)',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 8 }}>
                Is Synapse free to use?
              </div>
              <div style={{ fontSize: 13, color: 'var(--txt2)' }}>
                Yes! Synapse is completely free and open-source for all PUC students.
              </div>
            </div>

            <div style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--glass)',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 8 }}>
                How do I contact support?
              </div>
              <div style={{ fontSize: 13, color: 'var(--txt2)' }}>
                You can reach us via email at synapsesupport2505@gmail.com or DM us on Instagram @synapse2505
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
