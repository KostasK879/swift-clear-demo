'use client'

import { useState } from 'react'
import ChatWidget from '@/components/ChatWidget'
import VoiceWidget from '@/components/VoiceWidget'

export default function Widgets() {
  const [chatOpen, setChatOpen] = useState(false)
  return (
    <>
      <ChatWidget onOpenChange={setChatOpen} />
      <VoiceWidget chatOpen={chatOpen} />
    </>
  )
}
