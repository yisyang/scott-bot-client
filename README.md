# scott-bot-client

This is the client. For server, see: https://github.com/yisyang/scott-bot-server

This is a simple HTML WebSocket Client that connects to the WebSocket Server, 
intended for a user to send text queries into.

Client request format:
```
{
    message: string
}
```


Server response format:

```
{
    requestId: string,
    status: 'IN_PROGRESS'|'DONE'|'ERROR',
    response: string
}
```
