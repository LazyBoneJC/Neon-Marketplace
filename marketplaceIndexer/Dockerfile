# 1. 使用官方映像檔
FROM ghcr.io/joshstevens19/rindexer:latest

# 2. 安裝 lsof, procps (包含 kill, ps), net-tools (包含 netstat)
# procps 是提供 kill 指令的關鍵套件
USER root
RUN apt-get update && \
    apt-get install -y lsof procps net-tools && \
    rm -rf /var/lib/apt/lists/*

# 3. 設定工作目錄
WORKDIR /app

# 4. 複製設定檔
COPY rindexer.yaml .
COPY abis ./abis

ENV HOST=0.0.0.0
ENV PORT=3001

# 5. Entrypoint 設定
ENTRYPOINT []

# 6. 啟動指令 (使用 shell form 以讀取環境變數)
CMD ["sh", "-c", "/app/rindexer start all --port $PORT"]