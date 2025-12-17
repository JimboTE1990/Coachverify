import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CoachDogFullLogo } from '../components/Layout';

export const DebugAuth: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        // Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        // Check current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        // Parse URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashData: any = {};
        hashParams.forEach((value, key) => {
          hashData[key] = value.substring(0, 50) + '...'; // Truncate for display
        });

        // Parse query params
        const queryParams = new URLSearchParams(window.location.search);
        const queryData: any = {};
        queryParams.forEach((value, key) => {
          queryData[key] = value;
        });

        // Check if coach profile exists
        let coachProfile = null;
        if (user) {
          const { data: coach, error: coachError } = await supabase
            .from('coaches')
            .select('*')
            .eq('user_id', user.id)
            .single();

          coachProfile = coach || coachError?.message;
        }

        setDebugInfo({
          timestamp: new Date().toISOString(),
          url: window.location.href,
          hash: window.location.hash,
          hashParams: hashData,
          queryParams: queryData,
          session: session ? {
            user_id: session.user.id,
            email: session.user.email,
            email_confirmed_at: session.user.email_confirmed_at,
            created_at: session.user.created_at,
          } : null,
          sessionError: sessionError?.message,
          user: user ? {
            id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            user_metadata: user.user_metadata,
          } : null,
          userError: userError?.message,
          coachProfile,
        });
      } catch (err: any) {
        setDebugInfo({ error: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchDebugInfo();
  }, []);

  const testEmailSend = async () => {
    const testEmail = prompt('Enter email address to test verification email:');
    if (!testEmail) return;

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: testEmail,
      });

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Verification email sent! Check your inbox.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">🔍 Auth Debug Panel</h1>
          <CoachDogFullLogo className="h-12 w-auto" />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4">Loading debug info...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-brand-400">📍 Current URL Info</h2>
              <pre className="bg-slate-900 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify({
                  url: debugInfo.url,
                  hash: debugInfo.hash,
                  hashParams: debugInfo.hashParams,
                  queryParams: debugInfo.queryParams,
                }, null, 2)}
              </pre>
            </div>

            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-green-400">👤 Session & User</h2>
              <pre className="bg-slate-900 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify({
                  session: debugInfo.session,
                  sessionError: debugInfo.sessionError,
                  user: debugInfo.user,
                  userError: debugInfo.userError,
                }, null, 2)}
              </pre>
            </div>

            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-yellow-400">🎓 Coach Profile</h2>
              <pre className="bg-slate-900 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify(debugInfo.coachProfile, null, 2)}
              </pre>
            </div>

            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-purple-400">🧪 Test Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={testEmailSend}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Resend Verification Email
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Refresh Debug Info
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-red-400">📋 Full Debug Data</h2>
              <pre className="bg-slate-900 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
