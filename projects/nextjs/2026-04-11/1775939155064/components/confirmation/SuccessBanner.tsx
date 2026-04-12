'use client'

import { useState } from 'react'
import { Check, Copy, CheckCheck } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { cn } from '@/lib/utils'

interface SuccessBannerProps {
  confirmationNumber: string
  className?: string
}

export function SuccessBanner({ confirmationNumber, className }: SuccessBannerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(confirmationNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers that don't support clipboard API
      console.error('Failed to copy to clipboard')
    }
  }

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden',
        className
      )}
    >
      <div className="p-8">
        {/* Success Icon with Scale-in Animation */}
        <div className="flex justify-center mb-6">
          <div 
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-scale-in"
            style={{
              animation: 'scale-in 300ms ease-out forwards',
            }}
          >
            {/* Green Checkmark SVG */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-green-600"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-check-draw"
                style={{
                  strokeDasharray: 24,
                  strokeDashoffset: 24,
                  animation: 'check-draw 400ms ease-out 200ms forwards',
                }}
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Shipment Confirmed!
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Your shipment has been successfully created and scheduled for pickup.
            Save your confirmation number for your records.
          </p>
        </div>

        {/* Confirmation Number with Copy Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="bg-gray-50 rounded-lg px-6 py-4 border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 text-center sm:text-left">
              Confirmation Number
            </p>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-gray-900 tracking-wide">
              {confirmationNumber}
            </p>
          </div>
          
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200',
              copied
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
            )}
            aria-label={copied ? 'Copied!' : 'Copy confirmation number'}
          >
            {copied ? (
              <>
                <CheckCheck className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <QRCodeSVG
              value={confirmationNumber}
              size={128}
              level="M"
              includeMargin={false}
              imageSettings={{
                src: '',
                x: undefined,
                y: undefined,
                height: 24,
                width: 24,
                excavate: true,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Scan to track your shipment
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes check-draw {
          0% {
            stroke-dashoffset: 24;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  )
}
