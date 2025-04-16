// app/(legal)/delete-account/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import { supabase } from '@/lib/supabase';

export default function DeleteAccountPage() {
  const { user, signOut } = useAuthStore();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirmDelete) {
      setError('You must confirm that you understand the consequences of account deletion');
      return;
    }
    
    // If the user is logged in, use their email
    const emailToUse = user?.email || email;
    
    if (!emailToUse) {
      setError('Email is required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // For authenticated users, we can process the deletion directly
      if (user) {
        // Step 1: Create a deletion request record
        await supabase
          .from('deletion_requests')
          .insert([
            {
              user_id: user.id,
              email: user.email,
              reason: reason || 'Not provided',
              status: 'pending'
            }
          ]);
        
        // Step 2: Sign the user out
        await signOut();
      } else {
        // For unauthenticated users, just create a deletion request
        await supabase
          .from('deletion_requests')
          .insert([
            {
              email: emailToUse,
              reason: reason || 'Not provided',
              status: 'pending'
            }
          ]);
      }
      
      // Show success message
      setSuccess(true);
      
      // Clear form
      setEmail('');
      setReason('');
      setConfirmDelete(false);
      
    } catch (err: any) {
      console.error('Error requesting account deletion:', err);
      setError('There was an error submitting your request. Please try again or contact support.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="container max-w-2xl py-12 px-4 md:px-6 lg:py-16">
      <Link 
        href="/" 
        className="inline-flex items-center text-sm text-primary hover:underline mb-8 block"
      >
        &larr; Back to Home
      </Link>
      
      {success ? (
        <Card>
          <CardHeader>
            <div className="flex items-center mb-2 text-green-600">
              <CheckCircledIcon className="w-6 h-6 mr-2" />
              <CardTitle className="text-green-600">Request Submitted</CardTitle>
            </div>
            <CardDescription>
              Your account deletion request has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We have received your request to delete your account and associated data. Our team will process your request within 30 days as required by applicable data protection laws.
            </p>
            <p>
              You will receive an email confirmation when your data has been completely removed from our systems.
            </p>
            <p>
              If you have any questions or concerns, please contact our support team at{' '}
              <a href="mailto:privacy@jobgenie.com" className="text-primary hover:underline">
                privacy@jobgenie.com
              </a>.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/')} className="w-full">
              Return to Home Page
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <h1 className="text-3xl font-bold tracking-tight mb-2 md:text-4xl">
            Account Deletion Request
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Use this form to request the deletion of your account and associated data.
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>Request Data Deletion</CardTitle>
              <CardDescription>
                We respect your privacy and your right to control your data. Complete this form to request the deletion of your account and personal information from our systems.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 text-amber-800 dark:text-amber-300 flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Important Notice</h3>
                    <p className="text-sm">
                      This action will permanently delete your JobGenie account and all associated data, including your profile, saved jobs, documents, and interview recordings. This action cannot be undone.
                    </p>
                  </div>
                </div>
                
                {!user && (
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter the email associated with your account"
                      required={!user}
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Please enter the email address associated with your JobGenie account.
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="reason" className="block text-sm font-medium">
                    Reason for Deletion (Optional)
                  </label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please let us know why you're deleting your account"
                    className="resize-none"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your feedback helps us improve our services.
                  </p>
                </div>
                
                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox 
                    id="confirmDelete" 
                    checked={confirmDelete}
                    onCheckedChange={(checked) => setConfirmDelete(checked === true)}
                  />
                  <label 
                    htmlFor="confirmDelete" 
                    className="text-sm leading-tight cursor-pointer"
                  >
                    I understand that this action will permanently delete my account and all associated data from JobGenie, and that this action cannot be undone.
                  </label>
                </div>
                
                {error && (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3 text-red-800 dark:text-red-300 text-sm">
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  variant="destructive" 
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Request...' : 'Request Account Deletion'}
                </Button>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  By submitting this request, you acknowledge that your account and all data associated with it will be permanently deleted.
                </p>
              </CardFooter>
            </form>
          </Card>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">How long will it take to process my request?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We typically process deletion requests within 30 days, as required by applicable data protection laws.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Will I receive confirmation of deletion?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes, you will receive an email confirmation when your data has been completely removed from our systems.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Can I recover my account after deletion?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No, once your account has been deleted, it cannot be recovered. You would need to create a new account if you wish to use JobGenie again.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">What data will be deleted?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We will delete all personal information associated with your account, including your profile details, saved jobs, documents, and interview recordings. Anonymized usage data that cannot be linked back to you may be retained.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
