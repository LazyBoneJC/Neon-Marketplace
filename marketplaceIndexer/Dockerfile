# 1. 使用官方 Pre-built Image
FROM ghcr.io/joshstevens19/rindexer:latest

# 2. 設定工作目錄
WORKDIR /app

# 3. 複製設定檔 (因為 workdir 是 /app，所以複製到當前目錄就是 /app)
COPY rindexer.yaml .
COPY abis ./abis

ENV HOST=0.0.0.0
ENV PORT=3001
EXPOSE 3001

# 4. 重設 ENTRYPOINT (避免繼承干擾)
ENTRYPOINT []

# 5. 【關鍵修正】使用絕對路徑 "/app/rindexer"
# 這是根據官方 source code 第 75 行確認的真實位置
CMD ["/app/rindexer", "start", "all"]