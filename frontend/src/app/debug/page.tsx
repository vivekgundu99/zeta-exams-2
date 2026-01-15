'use client';

export default function DebugPage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Deployment Debug</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold">Environment Variables:</h2>
          <pre className="mt-2">
            API_URL: {process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}
            {'\n'}
            RAZORPAY_KEY: {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'SET' : 'NOT SET'}
          </pre>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold">Build Info:</h2>
          <pre className="mt-2">
            NODE_ENV: {process.env.NODE_ENV}
            {'\n'}
            Next.js Version: 14.0.4
          </pre>
        </div>
        
        <div className="p-4 bg-green-100 rounded">
          <h2 className="font-bold text-green-800">✅ App is Working!</h2>
          <p className="mt-2">If you can see this page, your Next.js app is deployed successfully.</p>
        </div>
      </div>
    </div>
  );
}