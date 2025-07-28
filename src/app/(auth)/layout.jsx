export default function AuthLayout({ children }) {
  return (
    <div className="flex items-center justify-center py-4 sm:py-12 px-3 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-md space-y-8">
        {children}
      </div>
    </div>
  );
}
