// src/app/page.tsx
"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'

export default function Page() {
  const [query, setQuery] = useState('')
  const [currentWsData, setCurrentWsData] = useState<string>('{}')
  const [responses, setResponses] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reconnectTimer, setReconnectTimer] = useState(1)
  const socket = useRef<WebSocket>()

  const connectWs = useCallback((timer = 1) => {
    // Already connected
    if (socket.current && socket.current.readyState < WebSocket.CLOSING) {
      console.info('WebSocket already connected or is connecting')
      return
    }

    // Connect to WebSocket server
    socket.current = new WebSocket('ws://localhost:3000')

    socket.current.onopen = () => {
      console.info('WebSocket server connected')
      setReconnectTimer(1)
    }

    socket.current.onmessage = (message) => {
      setCurrentWsData(message.data)
    }

    socket.current.onclose = async () => {
      console.info(`WebSocket server closed, will attempt reconnection in ${timer}s`)
      await new Promise((resolve) => setTimeout(resolve, timer * 1000))
      setReconnectTimer(prevTimer => {
        const newTimer = prevTimer * 2
        connectWs(newTimer)
        return newTimer
      })
    }

    socket.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }, [])

  const processResponse = (rawData: string, responses: string[]) => {
    const data = JSON.parse(rawData)
    console.debug(data)
    if (data.status === 'DONE') {
      setIsLoading(false)
      const color = data.requestId ? 'white' : 'lightblue'
      setResponses([...responses, `<div style="color:${color};padding:5px">` + data.response.replace(/\n/g, "<br />") + '</div>'])
    } else if (data.status === 'CONNECTED') {
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (query === '') {
      return
    }
    while (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.info('Waiting 1s for socket connection to establish.')
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setCurrentWsData(JSON.stringify({
      status: "DONE",
      response: "Query: " + query
    }))
    socket.current.send(JSON.stringify({ message: query }))
  }

  // Attempt to connect and maintain connection
  useEffect(() => {
    connectWs()
  }, [connectWs])

  // When new messages arrive, process them and then set them to empty
  useEffect(() => {
    if (currentWsData && currentWsData.length > 2) {
      processResponse(currentWsData, responses)
      setCurrentWsData('')
    }
  }, [responses, currentWsData])

  return (
      <div>
        <form id="query-input-form" onSubmit={handleSubmit}>
          <textarea
              id="query-input"
              rows={5}
              cols={120}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything..."
          />
          <button id="query-submit-btn" type="submit">Submit</button>
        </form>

        {/* Rendering Responses */}
        {responses.map((response, index) => (
          <div key={index} dangerouslySetInnerHTML={{ __html: response }}></div>
        ))}

        {/* Rendering Loading signal */}
        {isLoading && <p>LOADING</p>}
      </div>
  )
}
