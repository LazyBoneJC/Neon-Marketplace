# 1. 使用作者提供的 Pre-built Image 當作基底 (省去編譯時間)
FROM ghcr.io/joshstevens19/rindexer:latest

# 2. 設定工作目錄
WORKDIR /app

# 3. 將設定檔與 ABI 複製進容器
# 注意：因為 Zeabur 的 Root Directory 會設在 marketplaceIndexer
# 所以這裡的 ./ 已經是指向 marketplaceIndexer 資料夾內部
COPY rindexer.yaml .
COPY abis ./abis

# 4. (重要) 確保依賴套件安裝 (如果需要)
# rindexer image 通常已經包含執行環境，這裡主要是確保權限或路徑正確

# 5. 啟動指令
# 使用 shell form 確保環境變數能被正確解析
CMD ["rindexer", "start", "all"]