"use client"

import "@xterm/xterm/css/xterm.css"
import { useEffect, useRef, useState } from "react"
import { useDeviceStore } from "@/store"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Terminal, Plug, PlugZap } from "lucide-react"

export default function ShellPage() {
  const devices = useDeviceStore((s) => s.devices)
  const [selectedDevice, setSelectedDevice] = useState("")
  const [connected, setConnected] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<any>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return

    const initTerminal = async () => {
      const { Terminal } = await import("@xterm/xterm")
      const { FitAddon } = await import("@xterm/addon-fit")

      const term = new Terminal({
        cursorBlink: true,
        cursorStyle: "block",
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Meslo LG M", monospace',
        theme: {
          background: "#0a0a0a",
          foreground: "#f0f0f0",
          cursor: "#f0f0f0",
          selectionBackground: "#264f78",
          black: "#1e1e1e",
          red: "#f44747",
          green: "#4ec9b0",
          yellow: "#dcdcaa",
          blue: "#569cd6",
          magenta: "#c586c0",
          cyan: "#4fc1ff",
          white: "#d4d4d4",
          brightBlack: "#808080",
          brightRed: "#f44747",
          brightGreen: "#4ec9b0",
          brightYellow: "#dcdcaa",
          brightBlue: "#569cd6",
          brightMagenta: "#c586c0",
          brightCyan: "#4fc1ff",
          brightWhite: "#ffffff",
        },
        allowProposedApi: true,
      })

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)

      if (terminalRef.current) {
        term.open(terminalRef.current)
        fitAddon.fit()
      }

      xtermRef.current = { term, fitAddon }

      term.onData((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(data)
        }
      })

      term.onResize(({ cols, rows }) => {
        // Send resize info if supported
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }))
        }
      })
    }

    initTerminal()

    const handleResize = () => {
      if (xtermRef.current) {
        xtermRef.current.fitAddon.fit()
      }
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (xtermRef.current) {
        xtermRef.current.term.dispose()
        xtermRef.current = null
      }
    }
  }, [])

  const connect = () => {
    if (!selectedDevice || connected) return

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/v1/devices/${encodeURIComponent(selectedDevice)}/shell/ws`)

    ws.onopen = () => {
      setConnected(true)
      if (xtermRef.current) {
        xtermRef.current.term.focus()
        xtermRef.current.term.writeln("\r\n\x1b[32mConnected to " + selectedDevice + "\x1b[0m")
      }
    }

    ws.onmessage = (event) => {
      if (xtermRef.current) {
        xtermRef.current.term.write(event.data)
      }
    }

    ws.onerror = () => {
      if (xtermRef.current) {
        xtermRef.current.term.writeln("\r\n\x1b[31mWebSocket connection error\x1b[0m")
      }
    }

    ws.onclose = () => {
      setConnected(false)
      wsRef.current = null
      if (xtermRef.current) {
        xtermRef.current.term.writeln("\r\n\x1b[33mConnection closed\x1b[0m")
      }
    }

    wsRef.current = ws
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setConnected(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shell</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Interactive ADB shell with full terminal emulation
        </p>
      </div>

      <div className="flex gap-3 items-center">
        <Select value={selectedDevice} onValueChange={setSelectedDevice} disabled={connected}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select device" />
          </SelectTrigger>
          <SelectContent>
            {devices.filter((d) => d.status === "device").map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.market_name ?? d.model ?? d.id}
                {(d.model || d.id) && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {d.model ?? ""}{d.model && d.id ? " · " : ""}{d.id ?? ""}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!connected ? (
          <Button onClick={connect} disabled={!selectedDevice}>
            <Plug className="mr-2 h-4 w-4" />
            Connect
          </Button>
        ) : (
          <Button variant="destructive" onClick={disconnect}>
            <PlugZap className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            ref={terminalRef}
            className="h-[calc(100vh-16rem)]"
          />
        </CardContent>
      </Card>


    </div>
  )
}
