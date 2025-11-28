# 1. 使用官方 Pre-built Image
FROM ghcr.io/joshstevens19/rindexer:latest

# 2. 設定工作目錄
WORKDIR /app

# 3. 複製設定檔
COPY rindexer.yaml .
COPY abis ./abis

# 4. 【關鍵修正】重設 ENTRYPOINT 並使用絕對路徑
# 我們先清空 Entrypoint，避免繼承基底映像檔的設定干擾
ENTRYPOINT []

# 5. 使用絕對路徑啟動，確保一定找得到
CMD ["/usr/local/bin/rindexer", "start", "all"]