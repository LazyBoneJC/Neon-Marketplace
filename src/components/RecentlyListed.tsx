import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import NFTBox from "./NFTBox"
import Link from "next/link"
import FaucetButton from "./FaucetButton"

// 定義 Rindexer 的 GraphQL URL (通常預設是這個，或從環境變數讀取)
const RINDEXER_URL = process.env.NEXT_PUBLIC_RINDEXER_URL || "http://127.0.0.1:3001/graphql"

// 定義 GraphQL 查詢
// 我們使用 RINDEXER_ID_DESC 排序，因為它是自動遞增的 ID，能代表事件被索引的順序（即時間順序）
// const GET_EVENTS_QUERY = `
//   query GetMarketplaceEvents {
//     allItemListeds(orderBy: [RINDEXER_ID_DESC], first: 50) {
//       nodes {
//         rindexerId
//         contractAddress: nftAddress
//         tokenId
//         price
//         seller
//         __typename
//       }
//     }
//     allItemBoughts(orderBy: [RINDEXER_ID_DESC], first: 50) {
//       nodes {
//         rindexerId
//         contractAddress: nftAddress
//         tokenId
//         __typename
//       }
//     }
//     allItemCanceleds(orderBy: [RINDEXER_ID_DESC], first: 50) {
//       nodes {
//         rindexerId
//         contractAddress: nftAddress
//         tokenId
//         __typename
//       }
//     }
//   }
// `

// 1. 修改 Query: 必須抓取 blockNumber 和 logIndex 以便正確排序
// 使用區塊鏈的原生順序 (Block -> Tx -> Log) 才是最安全的
const GET_EVENTS_QUERY = `
  query GetMarketplaceEvents {
    allItemListeds(orderBy: [BLOCK_NUMBER_DESC, LOG_INDEX_DESC], first: 50) {
      nodes {
        contractAddress: nftAddress
        tokenId
        price
        seller
        blockNumber
        logIndex
        __typename
      }
    }
    allItemBoughts(orderBy: [BLOCK_NUMBER_DESC, LOG_INDEX_DESC], first: 50) {
      nodes {
        contractAddress: nftAddress
        tokenId
        blockNumber
        logIndex
        __typename
      }
    }
    allItemCanceleds(orderBy: [BLOCK_NUMBER_DESC, LOG_INDEX_DESC], first: 50) {
      nodes {
        contractAddress: nftAddress
        tokenId
        blockNumber
        logIndex
        __typename
      }
    }
  }
`

// 定義事件的 TypeScript 介面
interface BaseEvent {
    contractAddress: string
    tokenId: string
    blockNumber: number
    logIndex: number
    __typename: "ItemListed" | "ItemBought" | "ItemCanceled"
}

interface ItemListedEvent extends BaseEvent {
    __typename: "ItemListed"
    price: string
    seller: string
}

// Fetcher 函數
const fetchMarketplaceEvents = async () => {
    const response = await fetch(RINDEXER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: GET_EVENTS_QUERY }),
    })

    if (!response.ok) {
        throw new Error("Network response was not ok")
    }

    const json = await response.json()
    return json.data
}

export default function RecentlyListedNFTs() {
    // 1. 使用 React Query 撈取資料
    const { data, isLoading, error } = useQuery({
        queryKey: ["marketplace-events"], // 唯一的查詢鍵
        queryFn: fetchMarketplaceEvents, // 查詢函數
        refetchInterval: 5000, // 每 5 秒自動更新一次，模擬即時性
    })

    // 2. 使用 useMemo 處理過濾邏輯:
    // 只顯示目前仍在上架的 NFTs, 即最新事件為 ItemListed 的, 排除已被買走或取消的, 並依 rindexerId 由大到小排序, 代表最新的在前, 以提升使用者體驗, 讓他們看到最新上架的 NFT, 而不是亂序的
    // useMemo 用來避免每次 render 都重新計算
    const activeListings = useMemo(() => {
        if (!data) return []

        const listedNodes: ItemListedEvent[] = data.allItemListeds.nodes
        const boughtNodes: BaseEvent[] = data.allItemBoughts.nodes
        const canceledNodes: BaseEvent[] = data.allItemCanceleds.nodes

        // 合併所有事件
        const allEvents = [...listedNodes, ...boughtNodes, ...canceledNodes]

        // 根據 rindexerId 由大到小排序 (最新的在前)
        // 原理：我們需要先確保事件是按時間順序處理的，這樣才能正確判斷每個 NFT 的最新狀態
        // sort 原理：a-b 為由小到大，b-a 為由大到小，所以這裡用 b.rindexerId - a.rindexerId，代表由大到小排序
        // allEvents.sort((a, b) => b.rindexerId - a.rindexerId)

        // 3. 關鍵修正: 改用 blockNumber 和 logIndex 進行排序
        // 先比較區塊高度，如果同區塊，再比較 Log Index
        allEvents.sort((a, b) => {
            if (b.blockNumber !== a.blockNumber) {
                return b.blockNumber - a.blockNumber // 區塊高度由大到小
            }
            return b.logIndex - a.logIndex // 同區塊內，事件順序由大到小
        })

        // 使用 Map 來記錄每個 NFT (ID + Address) 的最新狀態
        // Key: `${contractAddress}-${tokenId}`
        const latestStatusMap = new Map<string, BaseEvent>()

        for (const event of allEvents) {
            // key: 唯一標識一個 NFT (合約地址 + 代幣 ID)
            // 這樣可以確保我們能正確追蹤每個 NFT 的最新狀態
            const key = `${event.contractAddress}-${event.tokenId}`

            // 因為我們已經是由新到舊排序，所以如果 Map 裡面還沒有這個 Key，
            // 代表這個 event 就是該 NFT 的「最新狀態」
            if (!latestStatusMap.has(key)) {
                latestStatusMap.set(key, event)
            }
        }

        // 過濾出最新狀態是 "ItemListed" 的事件
        // 為何要.map? 因為 TypeScript 無法自動推斷過濾後的類型，所以我們需要手動告訴它這些事件都是 ItemListedEvent
        const active = Array.from(latestStatusMap.values())
            .filter(event => event.__typename === "ItemListed")
            .map(event => event as ItemListedEvent)

        return active
    }, [data])

    return (
        <div className="w-full">
            {/* Header 區域 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/5 pb-4">
                {/* 左側：標題區 */}
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500 font-mono tracking-tight">
                        Recently Listed
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">Fresh drops from the community</p>
                </div>

                {/* 右側：動作區 (Faucet + List) */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Faucet 按鈕 (比較大顆，放在左邊當輔助) */}
                    <FaucetButton />

                    {/* List Item 按鈕 (主要動作，放在最右邊) */}
                    <Link
                        href="/list-nft"
                        className="
                            group relative inline-flex items-center gap-2 px-5 py-3 
                            bg-zinc-900 border border-zinc-700 hover:border-purple-500 
                            rounded-xl font-mono text-sm font-bold text-zinc-300 hover:text-white 
                            transition-all duration-300 shadow-lg hover:shadow-purple-500/20
                            hover:-translate-y-0.5 active:translate-y-0 h-full
                        "
                        // 稍微加高 py-3 讓高度跟 Faucet 按鈕接近一點
                    >
                        <span className="text-xl leading-none text-purple-500 group-hover:text-purple-400 transition-colors">
                            +
                        </span>
                        <span>List Item</span>
                    </Link>
                </div>
            </div>

            {/* Loading & Error States */}
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                </div>
            ) : error ? (
                <div className="text-center p-8 border border-red-900/30 bg-red-950/10 rounded-xl">
                    <p className="text-red-400">
                        Unable to load listings. Please try again later.
                    </p>
                </div>
            ) : activeListings.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-zinc-500 text-lg mb-4">No NFTs listed yet.</p>
                    <Link
                        href="/list-nft"
                        className="text-purple-400 hover:text-purple-300 underline underline-offset-4"
                    >
                        Be the first to list one!
                    </Link>
                </div>
            ) : (
                // Grid System
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeListings.map(nft => (
                        <NFTBox
                            key={`${nft.contractAddress}-${nft.tokenId}`}
                            tokenId={nft.tokenId}
                            contractAddress={nft.contractAddress}
                            price={nft.price}
                            seller={nft.seller}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
