import type { Metadata, Viewport } from 'next'
import './globals.css'
import ReactQueryProvider from '@/providers/ReactQueryProvider'
import { GoogleAnalytics } from '@next/third-parties/google'
import SentryInit from '@/components/SentryInit'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Abiding Pages',
  description: '반려동물을 잃은 보호자를 위한 49일 AI 편지 동행 서비스',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Abiding Pages',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#1C0F2E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        {/* 폰트 출처 사전 연결 — DNS/TLS 핸드셰이크 선점 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          폰트 CSS를 렌더 차단(render-blocking)에서 제외.
          media="print"로 로드 → 초기 페인트를 막지 않고, 로드 완료 시 아래 스크립트가 media='all'로 전환.
          한글 글리프(Pretendard·Nanum)는 각 CSS의 unicode-range 서브셋이 그대로 적용 → 글자 깨짐 없음.
          전환 전에는 globals.css 폴백 체인(Noto Sans KR, system-ui 등)으로 즉시 표시(FOUT).
        */}
        {/*
          suppressHydrationWarning: 위 스크립트가 load 시 media="print"→"all"로 바꾸는데,
          이 전환이 하이드레이션보다 먼저 일어나면 서버(print)/DOM(all) 속성이 달라
          hydration mismatch 경고가 난다. 의도된 DOM 변경이므로 경고만 억제한다.
        */}
        {/* Pretendard (본문 sans) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          media="print"
          data-lazy-style=""
          suppressHydrationWarning
        />
        {/* Google Fonts: Allura, Nanum Myeongjo, Nanum Pen Script, Caveat */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Allura&family=Nanum+Myeongjo:wght@400;700&family=Nanum+Pen+Script&family=Caveat:wght@400;600&display=swap"
          media="print"
          data-lazy-style=""
          suppressHydrationWarning
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var l=document.querySelectorAll('link[data-lazy-style]');for(var i=0;i<l.length;i++){l[i].addEventListener('load',function(){this.media='all'});}})();",
          }}
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Allura&family=Nanum+Myeongjo:wght@400;700&family=Nanum+Pen+Script&family=Caveat:wght@400;600&display=swap"
          />
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">
        <SentryInit />
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
      {process.env.NEXT_PUBLIC_CLARITY_ID && (
        <Script id="clarity-init" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","${process.env.NEXT_PUBLIC_CLARITY_ID}");
        `}</Script>
      )}
    </html>
  )
}
