'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Sparkles, Mail, Lock, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'

export function LoginPage() {
  const { login, navigate } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        login(data.data)
        toast.success(`خوش آمدید، ${data.data.name}`)
        navigate('admin')
      } else {
        toast.error(data.error || 'ورود ناموفق')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور')
    }
    setLoading(false)
  }



  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 relative overflow-hidden">
      {/* Decorative background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 to-brand-900/60" />

      <Card className="relative w-full max-w-md p-8 glass-strong">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gold to-brand-600 flex items-center justify-center shadow-lg mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">ورود به پنل مدیریت</h1>
          <p className="text-sm text-muted-foreground mt-2">
            برای دسترسی به پنل مدیریت، وارد شوید
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">ایمیل</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pr-10"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium mb-1.5 block">رمز عبور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10 pl-10"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                ورود
                <ArrowLeft className="w-4 h-4 mr-2" />
              </>
            )}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('home')}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </Card>
    </div>
  )
}
