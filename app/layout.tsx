"use client"
import "./globals.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit"
import { getFullnodeUrl } from "@mysten/sui/client"
import "@mysten/dapp-kit/dist/index.css"
import { useState } from "react"

const networks = { mainnet: { url: getFullnodeUrl("mainnet") } }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <html lang="en">
      <head>
        <title>SuiYield — Best DeFi Yields on Sui</title>
        <meta name="description" content="Find the best yield rates across every Sui DeFi protocol. One screen, one click." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0A0E1A" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <SuiClientProvider networks={networks} defaultNetwork="mainnet">
            <WalletProvider autoConnect>
              {children}
            </WalletProvider>
          </SuiClientProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}