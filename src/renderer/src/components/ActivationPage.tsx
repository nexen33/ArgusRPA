import React, { useState, useEffect } from 'react';
import { Copy, ShieldCheck, AlertCircle, Key, ArrowRight, Check } from 'lucide-react';

const ActivationPage: React.FC = () => {
  const [machineId, setMachineId] = useState<string>('LOADING...');
  const [licenseCode, setLicenseCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 强制深色模式
    document.documentElement.className = 'theme-dark dark';
    
    // @ts-ignore
    if (window.activationAPI) {
      // @ts-ignore
      window.activationAPI.getMachineId().then((id: string) => setMachineId(id));
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(machineId);
  };

  const handleActivate = async () => {
    if (!licenseCode.trim()) {
      setStatus('error');
      setErrorMsg('请输入密钥');
      return;
    }

    setStatus('loading');
    try {
      // @ts-ignore
      const res = await window.activationAPI.activateLicense(licenseCode.trim());
      if (res.valid) {
        setStatus('success');
        // 保持“激活成功”显示 1000ms，然后再触发淡出动画
        setTimeout(() => {
          setIsFadingOut(true);
          // 淡出动画持续 700ms，因此再等 800ms 后正式切入主应用
          setTimeout(() => {
            // @ts-ignore
            window.activationAPI.launchApp();
          }, 800);
        }, 1000);
      } else {
        setStatus('error');
        const reasonMap: Record<string, string> = {
          invalid_signature: '密钥无效或已被篡改',
          machine_mismatch: '密钥与当前设备不匹配',
          expired: '密钥已过期',
          malformed: '密钥格式错误'
        };
        setErrorMsg(reasonMap[res.reason] || '验证失败');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg('验证过程发生异常');
    }
  };

  return (
    <div 
      className={`flex flex-col h-screen w-screen rounded-3xl px-8 pt-8 font-sans relative overflow-hidden transition-all duration-700 ease-in-out transform ${
        isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#1e1e2e', // 强制深色底色
        color: '#f4f4f5',
        border: '1px solid #3f3f46',
        WebkitAppRegion: 'drag'
      } as any}
    >
      <div 
        className="absolute top-0 left-0 w-full h-1.5" 
        style={{
          background: 'repeating-linear-gradient(-45deg, #ef4444 0, #ef4444 10px, #f59e0b 10px, #f59e0b 20px, #10b981 20px, #10b981 30px, #3b82f6 30px, #3b82f6 40px, #8b5cf6 40px, #8b5cf6 50px)',
          opacity: 0.9
        }}
      ></div>

      <div className="flex flex-col items-center mb-8 shrink-0">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-inner" style={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }}>
          <ShieldCheck className="w-8 h-8" style={{ color: '#f4f4f5' }} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: '#f4f4f5' }}>Argus 授权验证</h1>
        <div className="text-sm text-center leading-relaxed" style={{ color: '#a1a1aa' }}>
          <p>当前设备未获授权</p>
          <p>请联系管理员提供以下设备码以获取激活密钥</p>
        </div>
      </div>

      <div className="space-y-5 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#a1a1aa' }}>本机设备码</label>
          <div className="flex relative">
            <input 
              type="text" 
              readOnly 
              value={machineId}
              className="w-full rounded-lg py-2.5 pl-3 pr-10 text-sm font-mono focus:outline-none transition-colors border"
              style={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5' }}
            />
            <button 
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition-colors"
              style={{ color: '#71717a' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f4f4f5'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#71717a'}
              title="复制设备码"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#a1a1aa' }}>密钥</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#71717a' }} />
            <style>
              {`
                .custom-placeholder::placeholder {
                  color: #52525b;
                  opacity: 0.7;
                }
              `}
            </style>
            <input 
              type="text" 
              value={licenseCode}
              onChange={(e) => {
                setLicenseCode(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              placeholder="请输入密钥"
              className="w-full rounded-lg py-2.5 pl-9 pr-3 text-sm font-mono focus:outline-none transition-colors border custom-placeholder"
              style={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5' }}
            />
          </div>
        </div>

        {status === 'error' && (
          <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleActivate}
          disabled={status === 'loading' || !licenseCode.trim()}
          className={`w-full font-medium py-2.5 rounded-lg transition-all duration-200 border relative overflow-hidden group ${
            status === 'success' ? 'pointer-events-none' : 'disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
          style={{ backgroundColor: '#f4f4f5', color: '#18181b', borderColor: '#3f3f46' }}
        >
          {/* Base Layer */}
          <div className="flex items-center justify-center space-x-2">
            <span>{status === 'loading' ? '验证中...' : status === 'success' ? '激活成功' : '激活应用'}</span>
            {status === 'idle' && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
            {status === 'success' && <Check className="w-4 h-4 font-bold" strokeWidth={3} />}
          </div>

          {/* Success Animated Sweep Layer */}
          <div 
            className="absolute inset-0 flex items-center justify-center space-x-2"
            style={{ 
              backgroundColor: '#10b981', // 翡翠绿
              color: '#ffffff',
              clipPath: status === 'success' ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
              transition: status === 'success' ? 'clip-path 1000ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}
          >
            <span>激活成功</span>
            <Check className="w-4 h-4 font-bold" strokeWidth={3} />
          </div>
        </button>
      </div>
      
      <div className="mt-auto h-20 flex items-center justify-center shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button 
          // @ts-ignore
          onClick={() => window.activationAPI?.quitApp()}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          退出程序
        </button>
      </div>
    </div>
  );
};

export default ActivationPage;
