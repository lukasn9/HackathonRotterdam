'use client'

import TranscriptView from '@/components/TranscriptView'
import ChatPanel from '@/components/ChatPanel'
import EmojiReactions from '@/components/EmojiReactions'

type Props = {
  roomId: string
  roomTitle: string
  displayName: string
  profileTag: string
}

export default function AudienceRoom({ roomId, roomTitle, displayName, profileTag }: Props) {
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Transcript panel */}
      <div className="flex-1 flex flex-col overflow-hidden p-6 border-r border-gray-800">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="font-semibold text-lg">{roomTitle}</h1>
            <p className="text-xs text-gray-500">Welcome, {displayName}</p>
          </div>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded-md">{profileTag}</span>
        </div>

        <div className="flex-1 overflow-hidden">
          <TranscriptView roomId={roomId} />
        </div>

        <div className="flex-shrink-0 pt-4 border-t border-gray-800 mt-4">
          <EmojiReactions roomId={roomId} />
        </div>
      </div>

      {/* Chat panel */}
      <div className="w-96 flex flex-col p-6">
        <ChatPanel roomId={roomId} />
      </div>
    </div>
  )
}
