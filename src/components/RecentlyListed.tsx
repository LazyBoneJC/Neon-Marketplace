import { useQuery } from "@tanstack/react-query"
import { useMemo, useState, useCallback } from "react"
import NFTBox from "./NFTBox"
import Link from "next/link"
import FaucetButton from "./FaucetButton"

// 定義 Rindexer 的 GraphQL URL (通常預設是這個，或從環境變數讀取)
const RINDEXER_URL = process.env.NEXT_PUBLIC_RINDEXER_URL || "http://127.0.0.1:3001/graphql"

// ============== Types ==============
type SortOption = "recent" | "price_asc" | "price_desc"

interface FilterState {
    minPrice: string
    maxPrice: string
}

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

// ============== GraphQL Query ==============
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

// ============== Fetcher ==============
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

// ============== Helper: Convert raw price to USDC ==============
const toUSDC = (rawPrice: string): number => Number(rawPrice) / 1_000_000

// ============== FilterBar Component ==============
function FilterBar({
    sortBy,
    onSortChange,
    filters,
    onFilterChange,
    onClearFilters,
    hasActiveFilters,
}: {
    sortBy: SortOption
    onSortChange: (sort: SortOption) => void
    filters: FilterState
    onFilterChange: (filters: FilterState) => void
    onClearFilters: () => void
    hasActiveFilters: boolean
}) {
    const [localFilters, setLocalFilters] = useState(filters)
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    const handleApply = () => {
        onFilterChange(localFilters)
        setIsFilterOpen(false)
    }

    const handleClear = () => {
        setLocalFilters({ minPrice: "", maxPrice: "" })
        onClearFilters()
        setIsFilterOpen(false)
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Sort Dropdown */}
            <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="
                    px-4 py-2 rounded-lg
                    bg-zinc-800 border border-zinc-700
                    text-sm text-zinc-300
                    hover:border-purple-500/50 focus:border-purple-500 focus:outline-none
                    transition-colors cursor-pointer
                "
            >
                <option value="recent">Recently Listed</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
            </select>

            {/* Filter Button */}
            <div className="relative">
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`
                        px-4 py-2 rounded-lg border text-sm
                        transition-all duration-200
                        ${hasActiveFilters
                            ? "bg-purple-600/20 border-purple-500 text-purple-300"
                            : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-purple-500/50"
                        }
                    `}
                >
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                        </svg>
                        Filter
                        {hasActiveFilters && <span className="w-2 h-2 bg-purple-500 rounded-full" />}
                    </span>
                </button>

                {/* Filter Dropdown */}
                {isFilterOpen && (
                    <div className="
                        absolute top-full right-0 mt-2 z-50
                        w-64 p-4 rounded-xl
                        bg-zinc-900 border border-zinc-700
                        shadow-xl shadow-black/50
                    ">
                        <h4 className="text-sm font-semibold text-zinc-300 mb-3">Price Range (USDC)</h4>
                        
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="number"
                                placeholder="Min"
                                value={localFilters.minPrice}
                                onChange={(e) => setLocalFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                                className="
                                    w-full min-w-0 px-3 py-2 rounded-lg
                                    bg-zinc-800 border border-zinc-700
                                    text-sm text-white placeholder-zinc-500
                                    focus:border-purple-500 focus:outline-none
                                "
                            />
                            <span className="text-zinc-500 shrink-0">—</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={localFilters.maxPrice}
                                onChange={(e) => setLocalFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                                className="
                                    w-full min-w-0 px-3 py-2 rounded-lg
                                    bg-zinc-800 border border-zinc-700
                                    text-sm text-white placeholder-zinc-500
                                    focus:border-purple-500 focus:outline-none
                                "
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleClear}
                                className="
                                    flex-1 px-3 py-2 rounded-lg
                                    bg-zinc-800 border border-zinc-700
                                    text-sm text-zinc-400 hover:text-white
                                    transition-colors
                                "
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleApply}
                                className="
                                    flex-1 px-3 py-2 rounded-lg
                                    bg-purple-600 hover:bg-purple-500
                                    text-sm text-white font-medium
                                    transition-colors
                                "
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============== Main Component ==============
export default function RecentlyListedNFTs() {
    // Filter & Sort State
    const [sortBy, setSortBy] = useState<SortOption>("recent")
    const [filters, setFilters] = useState<FilterState>({ minPrice: "", maxPrice: "" })

    const hasActiveFilters = filters.minPrice !== "" || filters.maxPrice !== ""

    const handleClearFilters = useCallback(() => {
        setFilters({ minPrice: "", maxPrice: "" })
    }, [])

    // Data Fetching
    const { data, isLoading, error } = useQuery({
        queryKey: ["marketplace-events"],
        queryFn: fetchMarketplaceEvents,
        refetchInterval: 5000,
    })

    // Process, Filter & Sort listings
    const activeListings = useMemo(() => {
        if (!data) return []

        const listedNodes: ItemListedEvent[] = data.allItemListeds.nodes
        const boughtNodes: BaseEvent[] = data.allItemBoughts.nodes
        const canceledNodes: BaseEvent[] = data.allItemCanceleds.nodes

        // Merge and sort all events by block order
        const allEvents = [...listedNodes, ...boughtNodes, ...canceledNodes]
        allEvents.sort((a, b) => {
            if (b.blockNumber !== a.blockNumber) {
                return b.blockNumber - a.blockNumber
            }
            return b.logIndex - a.logIndex
        })

        // Get latest status for each NFT
        const latestStatusMap = new Map<string, BaseEvent>()
        for (const event of allEvents) {
            const key = `${event.contractAddress}-${event.tokenId}`
            if (!latestStatusMap.has(key)) {
                latestStatusMap.set(key, event)
            }
        }

        // Filter to only active listings
        let active = Array.from(latestStatusMap.values())
            .filter(event => event.__typename === "ItemListed")
            .map(event => event as ItemListedEvent)

        // Apply price filter
        if (filters.minPrice !== "") {
            const minPriceUSDC = parseFloat(filters.minPrice)
            if (!isNaN(minPriceUSDC)) {
                active = active.filter(nft => toUSDC(nft.price) >= minPriceUSDC)
            }
        }
        if (filters.maxPrice !== "") {
            const maxPriceUSDC = parseFloat(filters.maxPrice)
            if (!isNaN(maxPriceUSDC)) {
                active = active.filter(nft => toUSDC(nft.price) <= maxPriceUSDC)
            }
        }

        // Apply sorting
        switch (sortBy) {
            case "price_asc":
                active.sort((a, b) => toUSDC(a.price) - toUSDC(b.price))
                break
            case "price_desc":
                active.sort((a, b) => toUSDC(b.price) - toUSDC(a.price))
                break
            case "recent":
            default:
                // Already sorted by block order from the map iteration
                break
        }

        return active
    }, [data, sortBy, filters])

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
                    <FaucetButton />
                    <Link
                        href="/list-nft"
                        className="
                            group relative inline-flex items-center gap-2 px-5 py-3 
                            bg-zinc-900 border border-zinc-700 hover:border-purple-500 
                            rounded-xl font-mono text-sm font-bold text-zinc-300 hover:text-white 
                            transition-all duration-300 shadow-lg hover:shadow-purple-500/20
                            hover:-translate-y-0.5 active:translate-y-0 h-full
                        "
                    >
                        <span className="text-xl leading-none text-purple-500 group-hover:text-purple-400 transition-colors">
                            +
                        </span>
                        <span>List Item</span>
                    </Link>
                </div>
            </div>

            {/* Filter & Sort Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <p className="text-sm text-zinc-500">
                    {activeListings.length} {activeListings.length === 1 ? "item" : "items"} listed
                    {hasActiveFilters && " (filtered)"}
                </p>
                <FilterBar
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    filters={filters}
                    onFilterChange={setFilters}
                    onClearFilters={handleClearFilters}
                    hasActiveFilters={hasActiveFilters}
                />
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
                    <p className="text-zinc-500 text-lg mb-4">
                        {hasActiveFilters ? "No NFTs match your filters." : "No NFTs listed yet."}
                    </p>
                    {hasActiveFilters ? (
                        <button
                            onClick={handleClearFilters}
                            className="text-purple-400 hover:text-purple-300 underline underline-offset-4"
                        >
                            Clear filters
                        </button>
                    ) : (
                        <Link
                            href="/list-nft"
                            className="text-purple-400 hover:text-purple-300 underline underline-offset-4"
                        >
                            Be the first to list one!
                        </Link>
                    )}
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

