# 1. 使用官方映像檔
FROM ghcr.io/joshstevens19/rindexer:latest

# 2. 【關鍵修正】安裝 lsof
# 這裡切換到 root 權限進行安裝 (通常 Docker 預設就是 root，但 explicit 更好)
USER root
RUN apt-get update && apt-get install -y lsof && rm -rf /var/lib/apt/lists/*

# 3. 設定工作目錄
WORKDIR /app

# 4. 複製設定檔
COPY rindexer.yaml .
COPY abis ./abis

# 5. Entrypoint 設定 (保持之前修正過的)
ENTRYPOINT []

# 6. 啟動指令 (使用絕對路徑)
CMD ["/app/rindexer", "start", "all"]