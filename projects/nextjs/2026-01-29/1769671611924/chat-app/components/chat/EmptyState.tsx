'use client';

export default function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
          <svg
            className="h-8 w-8 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        Start a conversation
      </h3>
      <p className="mb-4 max-w-sm text-sm text-gray-600">
        Send a message to begin your conversation with Claude. Ask questions, get help, or just chat!
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          💡 &ldquo;Help me write an email&rdquo;
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          🧠 &ldquo;Explain quantum computing&rdquo;
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          ✨ &ldquo;Generate ideas for...&rdquo;
        </div>
      </div>
    </div>
  );
}
