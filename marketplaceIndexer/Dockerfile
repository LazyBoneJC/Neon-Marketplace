# marketplaceIndexer/Dockerfile

FROM ghcr.io/joshstevens19/rindexer:latest

WORKDIR /app

COPY rindexer.yaml .
COPY abis ./abis

# 重設 Entrypoint
ENTRYPOINT []

# 關鍵修正：
# 1. 使用 sh -c 讓環境變數生效
# 2. 顯式傳入 --port 參數，強迫 rindexer 使用 Zeabur 指定的 Port
CMD ["sh", "-c", "/app/rindexer start all --port $PORT"]