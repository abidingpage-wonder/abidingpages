export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100dvh',
        background: 'var(--lav-50)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  )
}
