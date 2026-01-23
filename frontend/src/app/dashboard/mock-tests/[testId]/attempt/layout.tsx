// frontend/src/app/dashboard/mock-tests/[testId]/attempt/layout.tsx - NEW FILE
'use client';

export default function MockTestAttemptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout removes the sidebar for mock test attempts
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}